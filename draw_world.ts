var b2Joint;
var b2Shape;
var b2Math;

var coin1Image = new Image();
coin1Image.src = 'graphics/coin64.png';
var goldCoinImage = new Image();
var silverCoinImage = new Image();
var bronzeCoinImage = new Image();
var copperCoinImage = new Image();
goldCoinImage.src = 'graphics/goldcoin64.png';
silverCoinImage.src = 'graphics/silvercoin64.png';
bronzeCoinImage.src = 'graphics/bronzecoin64.png';
copperCoinImage.src = 'graphics/coppercoin64.png';

function drawWorld(world, context) {
	for (var j = world.m_jointList; j; j = j.m_next) {
		drawJoint(j, context);
	}
	for (var b = world.m_bodyList; b; b = b.m_next) {
		for (var s = b.GetShapeList(); s != null; s = s.GetNext()) {
		    drawShape(s, context, b);
		}
	}
}

function drawJoint(joint, context) {
	var b1 = joint.m_body1;
	var b2 = joint.m_body2;
	var x1 = b1.m_position;
	var x2 = b2.m_position;
	var p1 = joint.GetAnchor1();
	var p2 = joint.GetAnchor2();
	context.strokeStyle = '#00eeee';
	context.beginPath();
	switch (joint.m_type) {
	case b2Joint.e_distanceJoint:
		context.moveTo(p1.x, p1.y);
		context.lineTo(p2.x, p2.y);
		break;

	case b2Joint.e_pulleyJoint:
		// TODO
		break;

	default:
		if (b1 == world.m_groundBody) {
			context.moveTo(p1.x, p1.y);
			context.lineTo(x2.x, x2.y);
		}
		else if (b2 == world.m_groundBody) {
			context.moveTo(p1.x, p1.y);
			context.lineTo(x1.x, x1.y);
		}
		else {
			context.moveTo(x1.x, x1.y);
			context.lineTo(p1.x, p1.y);
			context.lineTo(x2.x, x2.y);
			context.lineTo(p2.x, p2.y);
		}
		break;
	}
	context.stroke();
}
function drawShape(shape, context, body) {
	context.strokeStyle = '#ffffff';
	switch (shape.m_type) {
	case b2Shape.e_circleShape:
		{
		    var circle = shape;
		    var pos = circle.m_position;
		    var r = circle.m_radius;
		    var ax = circle.m_R.col1;
		    context.save();
		    var rot = Math.atan2(ax.y,ax.x);
		    context.translate(pos.x,pos.y);
		    context.rotate(rot);
		    context.drawImage(body.image, -r, -r, r*2, r*2);
		    context.restore();
		}
		break;
	case b2Shape.e_polyShape:
		{
			var poly = shape;
			var tV = b2Math.AddVV(poly.m_position, b2Math.b2MulMV(poly.m_R, poly.m_vertices[0]));
		    context.beginPath();
			context.moveTo(tV.x, tV.y);
			for (var i = 0; i < poly.m_vertexCount; i++) {
				var v = b2Math.AddVV(poly.m_position, b2Math.b2MulMV(poly.m_R, poly.m_vertices[i]));
				context.lineTo(v.x, v.y);
			}
			context.lineTo(tV.x, tV.y);
		    context.fillStyle = '#c8c080';
		    context.strokeStyle = '#908040';
		    context.stroke();
		    context.fill();
		}
		break;
	}

}

