/// <reference path="draw_world.ts"/>

var b2CircleDef;
var b2BodyDef;
var b2PolyDef;

var b2RevoluteJointDef;
var $;

var b2BoxDef;
var b2AABB;
var b2Vec2;
var b2World;


class Pos {
    constructor(x:number, y:number) {
	this.x = x;
	this.y = y;
    }
    x: number;
    y: number;
};

var coinTypes = {
    "Denarius": {radius: 9.5, weight: 7, value: 10 },
    "Aureus": { radius: 10, weight: 3, value: 250 },
    "Sesterius": {radius: 17.5, weight: 25, value: 2.5},
    "Dupondius": { radius: 14.5, weight: 13, value: 1.25},
    "As": {radius: 13.5, weight: 10.5, value: 0.625}
};

var levels = [
    ["Denarius", "Aureus", "Sesterius", "Dupondius", "As"],
    ["Denarius", "Sesterius"],
    ["Denarius", "Sesterius", "As"],
    ["Denarius", "Aureus", "Dupondius"],
];

function drawCoin(ctx,  cx:number, cy:number, name:string) : void
{
    ctx.save();
    ctx.translate(cx,cy);
    var r = coinTypes[name].radius;
    ctx.drawImage(coin1Image, -r, -r, r*2, r*2);
    ctx.restore();
}

var toolbarSelect : number = 0; // Records the current tool
var userNails: Pos[] = new Array<Pos>();
function sgn(x:number): number
{
    if(x>0) return 1;
    else if(x<0) return -1;
    else return 0;
}

function createBox(world, x, y, width, height, fixed = false, density:number = 1.0) {
    if (typeof(fixed) == 'undefined') fixed = true;
    var boxSd = new b2BoxDef();
    if (!fixed) boxSd.density = density;
    boxSd.extents.Set(width, height);
    var boxBd = new b2BodyDef();
    boxBd.AddShape(boxSd);
    boxBd.position.Set(x,y);
    return world.CreateBody(boxBd)
}

function createBall(world, x, y, rad, fixed = false, density = 1.0) {
    var ballSd = new b2CircleDef();
    if (!fixed) ballSd.density = density;
    ballSd.radius = rad || 10;
    ballSd.restitution = 0.2;
    var ballBd = new b2BodyDef();
    ballBd.AddShape(ballSd);
    ballBd.position.Set(x,y);
    return world.CreateBody(ballBd);
};

function createPoly(world, x, y, points, fixed = false) {
    var polySd = new b2PolyDef();
    if (!fixed) polySd.density = 1.0;
    polySd.vertexCount = points.length;
    for (var i = 0; i < points.length; i++) {
	polySd.vertices[i].Set(points[i][0], points[i][1]);
    }
    var polyBd = new b2BodyDef();
    polyBd.AddShape(polySd);
    polyBd.position.Set(x,y);
    return world.CreateBody(polyBd)
};

function pin(body1, body2, pos : Pos)
{
    var jointDef = new b2RevoluteJointDef();
    jointDef.body1 = body1;
    jointDef.body2 = body2;
    jointDef.anchorPoint = pos;
    world.CreateJoint(jointDef);
}

function initWorld(world) {
};

function isClockwise(poly: Polygon) : boolean
{
    var total : number = 0;
    for(var p:number=0;p<poly.points.length;p++) {
	var p1 : Pos = poly.points[p];
	var p2 : Pos = poly.points[(p+1) % poly.points.length];
	total += (p2.x - p1.x)*(p2.y+p1.y);
    }
    return total>0;
}

function solidifyPolygon(world, poly: Polygon)
{
    var points : Number[][] = new Array();
    for(var p:number=0;p<poly.points.length;p++) {
	points.push([poly.points[p].x, poly.points[p].y]);
    }
    // Box2djs doesn't like anticlockwise polygons
    if(isClockwise(poly)) points.reverse();
    console.log("Creating poly",points);
    var newPoly = createPoly(world, 0, 0, points, false);
    physicsPolygons.push(newPoly);
}

var physicsPolygons = new Array();

var initId = 0;
var world = createWorld();
var ctx;
var canvasWidth;
var canvasHeight;
var canvasTop;
var canvasLeft;
var toolbarImage = new Image();
var titleImage = new Image();
var frameCount : number = 0;
var levelNo : number = 0;
var backgroundTile = new Image();
backgroundTile.src="graphics/wall1.png";

function drawCircle(ctx, pos:Pos, radius)
{
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'green';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#003300';
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
}

function drawCurrentPoly(ctx)
{
    if(currentPoly === undefined) return;
    ctx.beginPath();
    ctx.moveTo(currentPoly.points[0].x,currentPoly.points[0].y);
    for(var i:number=1;i<currentPoly.points.length;i++) {
	ctx.lineTo(currentPoly.points[i].x,currentPoly.points[i].y);
    }
    ctx.stroke();
    for(var i:number=0;i<currentPoly.points.length;i++) {
	drawCircle(ctx, currentPoly.points[i], 8);
    }
}

function drawNextLine(pos) : void
{
    var l : number =currentPoly.points.length;
    var last:Pos = currentPoly.points[l-1];
    if(isValidNextPoint(pos)) {
	ctx.strokeStyle = '#ffffff'
    } else {
	ctx.strokeStyle = '#ff0000'
    }
    ctx.beginPath();
    ctx.moveTo(last.x,last.y);
    ctx.lineTo(pos.x,pos.y);
    ctx.stroke();
    ctx.strokeStyle = '#ffffff'
   
}

function drawUserPolys(ctx)
{
    for(var p:number = 0;p<userPolys.length;p++) {
	var drawPoly : Polygon = userPolys[p];
	ctx.beginPath();
	ctx.moveTo(drawPoly.points[0].x,drawPoly.points[0].y);
	for(var i:number=1;i<drawPoly.points.length;i++) {
	    ctx.lineTo(drawPoly.points[i].x,drawPoly.points[i].y);
	}
	ctx.closePath();
	ctx.stroke();
    }
}

function drawNails(ctx)
{
    for(var n:number = 0;n<userNails.length;n++) {
	drawCircle(ctx, userNails[n], 4);
    }
}

function recreatePolygons()
{
    physicsPolygons = new Array();
    for(var p:number = 0;p<userPolys.length;p++) {
	var addPoly : Polygon = userPolys[p];
	solidifyPolygon(world, addPoly);
    }
}
    
function recreateNails()
{
    console.log("Recreating "+userNails.length+" nails")
    var validNail : boolean[] = new Array<boolean>();
    for(var n : number = 0; n < userNails.length; n++) {
	validNail[n] = false;
	var pos:Pos = userNails[n];
	for(var p : number = 0; p < userPolys.length; p++) {
	    if(pointInsidePolygon(pos, userPolys[p])) {
		pin (physicsPolygons[p], world.GetGroundBody(), pos);
		validNail[n] = true;
	    }
	}	
    }
    // Purge nails
    var newNails : Pos[] = new Array<Pos>();
    for(var n : number = 0; n < userNails.length; n++) {
	if(validNail[n]) {
	    newNails.push(userNails[n]);
	}
    }
    userNails = newNails;
    
}

function drawAllCoins(ctx) {
    // Draws coins on the bottom of the screen, for reference
    var xpos = 0;
    for(var c:number=0;c<levels[levelNo].length;c++) {
	var coinName = levels[levelNo][c];
	var radius = coinTypes[coinName].radius;
	xpos += radius*1.1+10;
	drawCoin(ctx, xpos, 450, coinName);
	xpos += radius*1.1+10;
    }
}

function drawEverything()
{
    for(var y=0;y<512;y+=128) {
	for(var x=0;x<640;x+=128) {
	    ctx.drawImage(backgroundTile, x, y);
	}
    }
    drawWorld(world, ctx);
    drawCurrentPoly(ctx);
    drawNails(ctx);
    drawAllCoins(ctx);
    if(mode==GameMode.Title) {
	for(var i=0;i<3;i++) {
	    ctx.font = "40px 'IM Fell English SC'";
	    ctx.save();
	    ctx.globalAlpha = 0.4;
	    ctx.beginPath();	    
	    ctx.rect(0,i*96+64,640,64);
	    ctx.strokeStyle = "#808000";
	    ctx.fillStyle = "#c0c000";
	    ctx.fill();
	    ctx.stroke();
	    ctx.fillStyle = 'Black';
	    ctx.fillText('Prototype '+(i+1), 150, 96*i+128-(64-40)/2);
	    ctx.restore();
	}
    }
}

function step(cnt) {
    if(physicsOn) {
	var stepping = false;
	var timeStep = 1.0/60;
	var iteration = 1;
	if(frameCount % 100 == 0 && (coinsOut < 20 || levelNo==0)) {
	    var noCoinTypes = levels[levelNo].length;
	    var c = Math.floor(Math.random()*noCoinTypes);
	    var coinData = coinTypes[levels[levelNo][c]];
	    var coin = createBall(world, 390, 10, coinData.radius, false, coinData.weight / (Math.PI*coinData.radius*coinData.radius));
	    coin.type = c;
	    coinsOut += 1;
	    coins.push(coin);
	}
	frameCount += 1;

	world.Step(timeStep, iteration);
	drawEverything();
	for(var c : number=0;c<coins.length;c++) {
	    
	    if(coins[c] !== undefined && coins[c].m_position.y > 400) {
		var xpos = coins[c].m_position.x;
		var slot = Math.floor((xpos + 25)/ 60);
		console.log("Coin ("+coins[c].type+") reached bottom of screen at xpos "+xpos+" - slot "+slot);
		if(coins[c].type == slot)
		    correctCount += 1;
		else
		    wrongCount += 1;
		console.log("Score: "+(correctCount-wrongCount));
		
		world.DestroyBody(coins[c]);
		coins[c] = undefined;
	    }
	}
	//drawUserPolys(ctx); // Not necessary as box2d draws them
	setTimeout('step(' + (cnt || 0) + ')', 10);
    }
}

function returnToTitleScreen() : void {
    mode = GameMode.Title;
    levelNo = 0;
    resetLevel();
    drawEverything();
    drawToolbar(toolbarContext);
    startPhysics();
}
    

function toolbarFunction(fn: number):void {
    console.log("Toolbar function "+fn);
    if(fn==0) {
	finishCurrentPoly();
	toolbarSelect = 0;
	drawToolbar(toolbarContext);
    } else if (fn==1) {
	currentPoly = undefined;
	drawEverything();
    } else if (fn==2) {
	toolbarSelect = 2;
	drawToolbar(toolbarContext);
    } else if (fn==3) {
	toolbarSelect = 3;
	drawToolbar(toolbarContext);
    } else if (fn==4) {
	togglePhysics();
    } else if (fn==5) {
	returnToTitleScreen();
    }
    
}
var idNumbers = 0; // Increasing unique ID number
var canvas = document.getElementsByTagName('canvas')[0];
var body = document.getElementsByTagName('body')[0];
class Polygon {
    points : Pos [];
    id : number;
    constructor() {
	this.id = idNumbers++;
    }
}

function resetLevel() : void
{
    world = createWorld(levelNo);
    stopPhysics();
    initWorld(world);
    recreatePolygons();
    recreateNails();
    drawEverything();
    coins = new Array();
}

function clearLevel(): void
{
    userPolys = new Array();
    userNails = new Array();
}

var keysDown: boolean [];
keysDown = new Array<boolean>();

var coins = new Array();

function togglePhysics(): void
{
    if (physicsOn) {
	resetLevel();
	physicsOn = false;
    } else {
	startPhysics();
    }
}


if (canvas.getContext('2d')) {
    ctx = canvas.getContext('2d');
    body.onkeydown = function (event) {
	var c = event.keyCode;
	keysDown[c] = true;
	// Make keyboard alternates to the control buttons:
	console.log("Key pressed: "+c);
	// Poly - start a new polygon
	// EndPoly - end the current polygon
	// Nail - start adding nails
	// Remover - remove things by clicking on/in them
	// Start - Run the game
	// Exit - exit to menu

	if(c == 81) {
	    console.log("Quit!");
	}

	if(c == 32) { // Start / Reset
	    toolbarFunction(4);
	}

	if(c == 90) {
	    toolbarFunction(0);
	}
	if(c == 88) {
	    toolbarFunction(1);
	}
	if(c == 67) {
	    toolbarFunction(2);
	}
	if(c == 86) {
	    toolbarFunction(3);
	}
    }
    body.onkeyup = function (event) {
	var c = event.keyCode;
	keysDown[c] = false;
    }
}

var physicsOn : boolean = false;
var correctCount : number = 0;
var wrongCount : number = 0;
var coinsOut : number = 0;
function startPhysics()
{
    if(!physicsOn) {
	correctCount = 0;
	wrongCount = 0;
	coinsOut = 0;
	coins = new Array();
	physicsOn = true;
	frameCount = 0;
	step(0);
    }
}

function stopPhysics()
{
    if(physicsOn) {
	physicsOn = false;
    }
}

function finishCurrentPoly()
{
    if(currentPoly === undefined) return;
    userPolys.push(currentPoly);
    solidifyPolygon(world, currentPoly);
    currentPoly = undefined;
    drawEverything();
}

function createWorld(levelNo:number=0) {
    console.log("Creating world for level "+levelNo);
    var worldAABB = new b2AABB();
    worldAABB.minVertex.Set(-1000, -1000);
    worldAABB.maxVertex.Set(1000, 1000);
    var gravity = new b2Vec2(0, 300);
    var doSleep = true;
    world = new b2World(worldAABB, gravity, doSleep);
    createGround(world);

    // Side walls
    createBox(world, 0, 125, 10, 250, true);
    createBox(world, 500, 125, 10, 250, true);

    if(levelNo == 0) {
	// Title screen
	createPoly(world, 64,64, [[200,20], [400,0], [400,20]], true);	    
	createPoly(world, 0,128, [[0,0], [250,40], [0,40]], true);	    
	var seesaw = createBox(world, 300,300, 100,10, false, 0.1);
	pin(seesaw, world.GetGroundBody(), new Pos(300,300));
    } else {
	// Create slots for each coin
	var xpos : number = 0;
	createBox(world, xpos, 500, 10, 250, true);
	for(var c:number=0;c<levels[levelNo].length;c++) {
	    var coinName = levels[levelNo][c];
	    var radius = coinTypes[coinName].radius;
	    console.log("box with radius "+radius);
	    xpos += 20 + radius*2.2;
	    createBox(world, xpos, 500, 10, 250, true);
	}
    }
    return world;
}

function createGround(world) {
    var groundSd = new b2BoxDef();
    groundSd.extents.Set(1000, 50);
    groundSd.restitution = 0.2;
    var groundBd = new b2BodyDef();
    groundBd.AddShape(groundSd);
    groundBd.position.Set(-500, 900);
    return world.CreateBody(groundBd)
}

function drawToolbar(ctx) {
    if(mode == GameMode.Title) {
	ctx.drawImage(logoImage, 0, 0);
    } else {
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);
	ctx.drawImage(toolbarImage, 0, 0);
	ctx.beginPath();
	ctx.arc(toolbarSelect*64+32,32, 32, 0, 2 * Math.PI, false);
	ctx.lineWidth = 5;
	ctx.strokeStyle = '#003300';
	ctx.stroke();
	ctx.strokeStyle = '#ffffff';
    }

}

function pointInsidePolygon(pos: Pos, poly: Polygon) : boolean
{
    var inside: boolean = false;
    var i : number = 0;
    var j : number = poly.points.length-1;
    for (; i < poly.points.length; j = i++ ) {
	if ( ((poly.points[i].y>pos.y) != (poly.points[j].y>pos.y)) &&
	     (pos.x < (poly.points[j].x - poly.points[i].x) * (pos.y - poly.points[i].y) / (poly.points[j].y-poly.points[i].y) + poly.points[i].x) )
	    inside = !inside;
    }
    return inside;
}

function deletePolygon(poly: Polygon) : void
{
    console.log("Deleting polygon");
    var newPolys : Polygon[] = new Array<Polygon>();
    for(var p : number = 0; p < userPolys.length; p++) {
	if(userPolys[p].id != poly.id) newPolys.push(userPolys[p]);
    }
    userPolys = newPolys;
    resetLevel();
}

function removePolygonOrNail(pos: Pos)
{
    console.log("Looking for a polygon at "+pos);
    for(var p : number = 0; p < userPolys.length; p++) {
	var poly = userPolys[p];
	if(pointInsidePolygon(pos, poly)) {
	    deletePolygon(poly);
	    return;
	}
    }    
}

function addNail(pos: Pos)
{
    userNails.push(pos);
    recreateNails();
    drawEverything();
}

function isConvex(poly: Polygon) : boolean
{
    if(poly.points.length < 3)  return true;
    var previousCross : number = 0;
    for(var i :number=0; i < poly.points.length; i++)
    {
	var p0:Pos = poly.points[i];
	var p1:Pos = poly.points[(i+1) % poly.points.length];
	var p2:Pos = poly.points[(i+2) % poly.points.length];
	var dx1:number = p1.x-p0.x;
	var dy1:number = p1.y-p0.y;
	var dx2:number = p2.x-p1.x;
	var dy2:number = p2.y-p1.y;
	var cross = dx1*dy2 - dy1*dx2;
	if(previousCross != 0 && sgn(previousCross) != sgn(cross)) {
	    return false;
	}
	previousCross = cross;
    }
    return true;
}

function isValidNextPoint(pos: Pos)
{
    var l : number = currentPoly.points.length;
    currentPoly.points.push(pos);
    if(!isConvex(currentPoly)) {
	currentPoly.points.pop();
	return false;
    }
    currentPoly.points.pop();
    return true;
}

function addPointToCurrentPoly(pos: Pos)
{
    if(isValidNextPoint(pos))
	currentPoly.points.push(pos);
}


var currentPoly : Polygon;
var world;
var userPolys : Polygon[];
var toolbarContext;
var logoImage = new Image();

enum GameMode {
    Title,
    Level
}

var mode : GameMode = GameMode.Title;
window.onload=function() {
    world = createWorld();
    toolbarImage.src = 'graphics/toolbar.png';
    logoImage.src = 'graphics/logo.png';
    titleImage.src = 'graphics/title.png';
    initWorld(world);
    ctx = $('canvas').getContext('2d');
    ctx.lineJoin="round";
    var canvasElm = $('canvas');
    canvasWidth = parseInt(canvasElm.width);
    canvasHeight = parseInt(canvasElm.height);
    canvasTop = parseInt(canvasElm.style.top);
    canvasLeft = parseInt(canvasElm.style.left);
    var toolbarCanvas = $('canvas2');
    toolbarContext = toolbarCanvas.getContext('2d');
    toolbarCanvas.addEventListener('click', function(e) {
	var fn:number = Math.floor((e.x-parseInt(toolbarCanvas.style.left)) / 64);
	toolbarFunction(fn);
    });
    toolbarImage.onload = function() { drawToolbar(toolbarContext); };
    titleImage.onload = function() { drawEverything(); };
    userPolys = new Array<Polygon>();
    canvas.addEventListener('click', function(e) {
	var pos: Pos = new Pos(e.x - canvasLeft, e.y - canvasTop);
	if(mode == GameMode.Title) {
	    var selected = Math.floor((pos.y - 64)/ 96.0)+1;
	    if(selected>0 && selected <=3 ) {
		levelNo = selected;
		console.log("Beginning level "+levelNo);
		mode = GameMode.Level;
		clearLevel();
		resetLevel();
	    }
	} else {
	    if(toolbarSelect == 0) {
		if(currentPoly === undefined)
		{
		    currentPoly = new Polygon();
		    currentPoly.points = new Array<Pos>();
		}
		// TODO: if you click inside a polygon here, I'd like it to select a corner
		// and allow editing
		addPointToCurrentPoly(pos);
		drawEverything();
	    } else if (toolbarSelect == 2) {
		// Remove polygon or nail at that position
	    addNail(pos);
	    } else if (toolbarSelect == 3) {
		// Remove polygon or nail at that position
		removePolygonOrNail(pos);
	    }
	}
	drawToolbar(toolbarContext);
    });
    canvas.addEventListener('mousemove', function(e) {
	var pos: Pos = new Pos(e.x - canvasLeft, e.y - canvasTop);
	if(toolbarSelect == 0 && currentPoly !== undefined
	   && currentPoly.points.length > 1) {
	    console.log("Drawing next line pos");
	    drawEverything();
	    drawNextLine(pos);
	}
    });
    canvas.addEventListener('contextmenu', function(e) {
	/* Right click - does nothing. */
	console.log("Right click");
	finishCurrentPoly();
    });
    returnToTitleScreen();
};
