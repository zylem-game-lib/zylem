import { Color, Vector3 } from 'three';
import { game, box, sphere, stage, camera, zone } from '../../src/main';
import { makeMoveable } from '../../src/lib/behaviors/moveable';
import { Vec0 } from '../../src/lib/core/utility';
import { pingPong } from '../../src/lib/actions/collision/ping-pong';
import { ricochet2d } from '../../src/lib/actions/update/ricochet';
import { ricochetSound, pingPongBeep } from '../../src/lib/sounds';
import { boundary } from '../../src/lib/behaviors/boundary';

const gameBounds = { top: 5, bottom: -5, left: -15, right: 15 };

const ball = await sphere({
	position: Vec0,
	radius: 0.1,
	material: {
		color: new Color(Color.NAMES.lightgreen),
	},
});

const moveableBall = makeMoveable(ball);
moveableBall.onSetup(({ entity }) => {
	entity.setPosition(0, 0, 0);
	entity.moveX(5);
});

moveableBall.onUpdate(
	ricochet2d({
		boundaries: gameBounds,
		onRicochet: (event) => {
			ricochetSound();
		}
	})
);

const ball2 = await sphere({
	position: Vec0,
	radius: 0.1,
	material: {
		color: new Color(Color.NAMES.crimson),
	},
});
const moveableBall2 = makeMoveable(ball2);
moveableBall2.onSetup(({ entity }) => {
	entity.setPosition(0, 0.5, 0);
	entity.moveX(-5);
});

moveableBall2.onUpdate(
	ricochet2d({
		boundaries: gameBounds,
		onRicochet: (event) => {
			ricochetSound();
		}
	})
);

const paddleSize = { x: 0.20, y: 1.5, z: 1 };
const paddleMaterial = { color: new Color(Color.NAMES.lightblue) };
const paddleSpeed = 5;

const paddle1 = await box({
	position: { x: -10, y: 0, z: 0 },
	size: paddleSize,
	material: paddleMaterial,
});
makeMoveable(paddle1).onUpdate(({ entity, inputs }) => {
	const { Vertical } = inputs.p1.axes;
	const { value } = Vertical;
	entity.moveY(-value * paddleSpeed);
}, boundary({ boundaries: gameBounds }));

const paddle2 = await box({
	position: { x: 10, y: 0, z: 0 },
	size: paddleSize,
	material: paddleMaterial,
});
makeMoveable(paddle2).onUpdate(({ entity, inputs }) => {
	const { Vertical } = inputs.p2.axes;
	const { value } = Vertical;
	entity.moveY(-value * paddleSpeed);
}, boundary({ boundaries: gameBounds }));


const p1Goal = await zone({
	position: { x: -12, y: 0, z: 0 },
	size: new Vector3(2, 10, 1),
});
p1Goal.onEnter((params) => {
	const { visitor, globals } = params;
	if (visitor.uuid === ball.uuid) {
		globals.p2Score++;
		moveableBall.setPosition(0, 0, 0);
		moveableBall.moveX(5);
	}
	if (visitor.uuid === ball2.uuid) {
		globals.p2Score++;
		moveableBall2.setPosition(0, 0, 0);
		moveableBall2.moveX(5);
	}
});

const p2Goal = await zone({
	position: { x: 12, y: 0, z: 0 },
	size: new Vector3(2, 10, 1),
});
p2Goal.onEnter((params) => {
	const { visitor, globals } = params;
	if (visitor.uuid === ball.uuid) {
		globals.p1Score++;
		moveableBall.setPosition(0, 0, 0);
		moveableBall.moveX(-5);
	}
	if (visitor.uuid === ball2.uuid) {
		globals.p1Score++;
		moveableBall2.setPosition(0, 0, 0);
		moveableBall2.moveX(-5);
	}
});

moveableBall.onCollision(
	pingPong({ minSpeed: 10 }),
	pingPongBeep()
);

moveableBall2.onCollision(
	pingPong({ minSpeed: 10 }),
	pingPongBeep()
);

const camera1 = await camera({
	position: new Vector3(0, 0, 0),
	perspective: 'fixed-2d',
	zoom: 12,
});

const stage1 = await stage({
	gravity: Vec0,
	camera: camera1,
	variables: {
		p1Score: 0,
		p2Score: 0,
	}
});

const game1 = game({
	id: 'pong',
	debug: true,
}, stage1, ball, ball2, paddle1, paddle2, p1Goal, p2Goal);


game1.start();