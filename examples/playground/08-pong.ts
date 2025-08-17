import { Color, Vector3 } from 'three';
import { game, box, sphere, stage, camera, zone, globalChange, globalChanges } from '../../src/main';
import { makeMoveable } from '../../src/lib/behaviors/moveable';
import { Vec0 } from '../../src/lib/core/utility';
import { pingPong } from '../../src/lib/actions/collision/ping-pong';
import { ricochet2d } from '../../src/lib/actions/update/ricochet';
import { ricochetSound, pingPongBeep } from '../../src/lib/sounds';
import { boundary } from '../../src/lib/actions/update/boundary';

const gameBounds = { top: 5, bottom: -5, left: -15, right: 15 };

const ball = await sphere({
	name: 'ball',
	position: Vec0,
	radius: 0.1,
	material: {
		color: new Color(Color.NAMES.lightgreen),
	},
});

const moveableBall = makeMoveable(ball);
moveableBall.onSetup(({ me }) => {
	me.setPosition(0, 0, 0);
	me.moveX(5);
});

moveableBall.onUpdate(
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
	name: 'paddle1',
	position: { x: -10, y: 0, z: 0 },
	size: paddleSize,
	material: paddleMaterial,
});
makeMoveable(paddle1).onUpdate(({ me, inputs }) => {
	const { Vertical } = inputs.p1.axes;
	const { value } = Vertical;
	me.moveY(-value * paddleSpeed);
}, boundary({ boundaries: gameBounds }));

const paddle2 = await box({
	name: 'paddle2',
	position: { x: 10, y: 0, z: 0 },
	size: paddleSize,
	material: paddleMaterial,
});
makeMoveable(paddle2).onUpdate(({ me, inputs }) => {
	const { Vertical } = inputs.p2.axes;
	const { value } = Vertical;
	me.moveY(-value * paddleSpeed);
}, boundary({ boundaries: gameBounds }));


const p1Goal = await zone({
	name: 'p1Goal',
	position: { x: 12, y: 0, z: 0 },
	size: new Vector3(2, 10, 1),
});
p1Goal.onEnter((params) => {
	const { visitor } = params;
	const p1Score = game1.getGlobal('p1Score');
	if (visitor.uuid === ball.uuid) {
		game1.setGlobal('p1Score', p1Score + 1);
		moveableBall.setPosition(0, 0, 0);
		moveableBall.moveX(-5);
	}
});

const p2Goal = await zone({
	name: 'p2Goal',
	position: { x: -12, y: 0, z: 0 },
	size: new Vector3(2, 10, 1),
});
p2Goal.onEnter((params) => {
	const { visitor } = params;
	const p2Score = game1.getGlobal('p2Score');
	if (visitor.uuid === ball.uuid) {
		game1.setGlobal('p2Score', p2Score + 1);
		moveableBall.setPosition(0, 0, 0);
		moveableBall.moveX(5);
	}
});

moveableBall.onCollision(
	pingPong({ minSpeed: 10 }),
	pingPongBeep()
);

const camera1 = await camera({
	position: new Vector3(0, 0, 0),
	perspective: 'fixed-2d',
	zoom: 12,
});

const stage1 = await stage(camera1);
const game1 = game({
	id: 'pong',
	debug: true,
	globals: {
		p1Score: 0,
		p2Score: 0,
		winner: '',
	}
}, stage1, ball, paddle1, paddle2, p1Goal, p2Goal);

stage1.onUpdate(
	globalChange('p1Score', (score) => {
		console.log('P1 score:', score);
	}),
	globalChanges(['p1Score', 'p2Score'], ([p1, p2]) => {
		if (p1 >= 3) game1.setGlobal('winner', 'p1');
		if (p2 >= 3) game1.setGlobal('winner', 'p2');
	}),
);
game1.start();
game1.onGlobalChange('winner', (value) => {
	console.log('Winner:', value);
});
