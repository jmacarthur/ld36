var b2CircleDef;
var b2BodyDef;
var b2PolyDef;

var createBox;
var createWorld;
var drawWorld;
var b2RevoluteJointDef;
var $;

interface observedThing {
    observe: any;
}

function createBall(world, x, y, rad, fixed = false) {
    var ballSd = new b2CircleDef();
    if (!fixed) ballSd.density = 1.0;
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

function initWorld(world) {
    createBall(world, 350, 100, 50, true);
    createPoly(world, 100, 100, [[0, 0], [10, 30], [-10, 30]], true);
    createPoly(world, 150, 150, [[0, 0], [10, 30], [-10, 30]], true);
    var pendulum = createBox(world, 150, 100, 20, 20, false);
    var jointDef = new b2RevoluteJointDef();
    jointDef.body1 = pendulum;
    jointDef.body2 = world.GetGroundBody();
    jointDef.anchorPoint = pendulum.GetCenterPosition();
    world.CreateJoint(jointDef);

    var seesaw = createPoly(world, 300, 200, [[0, 0], [100, 30], [-100, 30]]);
    jointDef.body1 = seesaw;
    jointDef.anchorPoint = seesaw.GetCenterPosition();
    world.CreateJoint(jointDef);
};

var initId = 0;
var world = createWorld();
var ctx;
var canvasWidth;
var canvasHeight;
var canvasTop;
var canvasLeft;

function step(cnt) {
    var stepping = false;
    var timeStep = 1.0/60;
    var iteration = 1;
    world.Step(timeStep, iteration);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    drawWorld(world, ctx);
    setTimeout('step(' + (cnt || 0) + ')', 10);
}

var canvas = document.getElementsByTagName('canvas')[0];
var body = document.getElementsByTagName('body')[0];

var keysDown: boolean [];
keysDown = new Array<boolean>();

if (canvas.getContext('2d')) {
    ctx = canvas.getContext('2d');
    body.onkeydown = function (event) {
	var c = event.keyCode;
	keysDown[c] = true;
	if(c == 81) {
	    console.log("Quit!");
	}
    }
}

Event.observe(window, 'load', function() {
    world = createWorld();
    initWorld(world);
    ctx = $('canvas').getContext('2d');
    var canvasElm = $('canvas');
    
    canvasWidth = parseInt(canvasElm.width);
    canvasHeight = parseInt(canvasElm.height);
    canvasTop = parseInt(canvasElm.style.top);
    canvasLeft = parseInt(canvasElm.style.left);
    Event.observe('canvas', 'click', function(e) {
	if (Math.random() < 0.5) 
	    createBall(world, Event.pointerX(e) - canvasLeft, Event.pointerY(e) - canvasTop, false);
	else 
	    createBox(world, Event.pointerX(e) - canvasLeft, Event.pointerY(e) - canvasTop, 10, 10, false);
    });
    Event.observe('canvas', 'contextmenu', function(e) {
	/* Right click - does nothing. */
	return false;
    });
    step(0);
});
