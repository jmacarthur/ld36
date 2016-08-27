var b2CircleDef;
var b2BodyDef;
var b2PolyDef;

var drawWorld;
var b2RevoluteJointDef;
var $;

var b2BoxDef;
var b2AABB;
var b2Vec2;
var b2World;


class Pos {
    x: number;
    y: number;
}

function createBox(world, x, y, width, height, fixed = false) {
    if (typeof(fixed) == 'undefined') fixed = true;
    var boxSd = new b2BoxDef();
    if (!fixed) boxSd.density = 1.0;
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
    createBox(world, 25, 270, 10, 20, true);
    createBox(world, 85, 270, 10, 20, true);
    createBox(world, 145, 270, 10, 20, true);
    var pendulum = createBox(world, 150, 100, 20, 20, false);
    pin (pendulum, world.GetGroundBody(), pendulum.GetCenterPosition());
    var gradient = createPoly(world, 200, 200, [[0, 0], [200, -30], [200, 30]], true);
};

function solidifyPolygon(world, poly: Polygon)
{
    var points : Number[][] = new Array();
    for(var p:number=0;p<poly.points.length;p++) {
	points.push([poly.points[p].x, poly.points[p].y]);
    }
    console.log("Creating poly",points);
    var newPoly = createPoly(world, 0, 0, points, false);  
}

var initId = 0;
var world = createWorld();
var ctx;
var canvasWidth;
var canvasHeight;
var canvasTop;
var canvasLeft;

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

function recreatePolygons()
{
    for(var p:number = 0;p<userPolys.length;p++) {
	var addPoly : Polygon = userPolys[p];
	solidifyPolygon(world, addPoly);
    }
}
    

function drawEverything()
{
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    drawWorld(world, ctx);
    drawCurrentPoly(ctx);
}

function step(cnt) {
    if(physicsOn) {
	var stepping = false;
	var timeStep = 1.0/60;
	var iteration = 1;
	world.Step(timeStep, iteration);
	drawEverything();
	//drawUserPolys(ctx); // Not necessary as box2d draws them
	setTimeout('step(' + (cnt || 0) + ')', 10);
    }
}

var canvas = document.getElementsByTagName('canvas')[0];
var body = document.getElementsByTagName('body')[0];
class Polygon {
    points : Pos [];
}
var keysDown: boolean [];
keysDown = new Array<boolean>();

if (canvas.getContext('2d')) {
    ctx = canvas.getContext('2d');
    body.onkeydown = function (event) {
	var c = event.keyCode;
	keysDown[c] = true;
	// Make keyboard alternates to the control buttons:

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
	    if (physicsOn) {
		world = createWorld();
		initWorld(world);
		physicsOn = false;
		recreatePolygons();
		drawEverything();
	    } else {
		if (Math.random() < 0.5) 
		    createBall(world, 390, 10, 10, false, 1.0);
		else 
		    createBall(world, 390, 10, 20, false);
		startPhysics();
	    }
	}
    }
    body.onkeyup = function (event) {
	var c = event.keyCode;
	keysDown[c] = false;
    }
}

var physicsOn : boolean = false;
function startPhysics()
{
    if(!physicsOn) {
	physicsOn = true;
	step(0);
    }
}

function createWorld() {
    var worldAABB = new b2AABB();
    worldAABB.minVertex.Set(-1000, -1000);
    worldAABB.maxVertex.Set(1000, 1000);
    var gravity = new b2Vec2(0, 300);
    var doSleep = true;
    var world = new b2World(worldAABB, gravity, doSleep);
    createGround(world);
    createBox(world, 0, 125, 10, 250, true);
    createBox(world, 500, 125, 10, 250, true);
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
var currentPoly : Polygon;
var world;
var userPolys : Polygon[];
window.onload=function() {
    world = createWorld();
    initWorld(world);
    ctx = $('canvas').getContext('2d');
    var canvasElm = $('canvas');
    canvasWidth = parseInt(canvasElm.width);
    canvasHeight = parseInt(canvasElm.height);
    canvasTop = parseInt(canvasElm.style.top);
    canvasLeft = parseInt(canvasElm.style.left);
    userPolys = new Array<Polygon>();
    canvas.addEventListener('click', function(e) {
	if(currentPoly === undefined)
	{
	    currentPoly = new Polygon();
	    currentPoly.points = new Array<Pos>();
	}
	var pos: Pos = new Pos();
	pos.x = e.x - canvasLeft;
	pos.y = e.y - canvasTop;
	currentPoly.points.push(pos);
	drawEverything()
    });
    canvas.addEventListener('contextmenu', function(e) {
	/* Right click - does nothing. */
	console.log("Right click");
	if(currentPoly === undefined)
	{
	    return;
	}
	userPolys.push(currentPoly);
	solidifyPolygon(world, currentPoly);
	currentPoly = undefined;
	drawEverything();
    });
    drawEverything();
};
