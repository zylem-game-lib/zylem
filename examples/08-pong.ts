import { Color, Vector3, Vector2 } from 'three';
import { game, box, sphere, stage, camera, zone, globalChanges, text } from '../src/main';
import { makeMoveable } from '../src/lib/actions/capabilities/moveable';
import { ricochet2DInBounds } from '../src/lib/actions/behaviors/ricochet/ricochet-2d-in-bounds';
import { ricochetSound, pingPongBeep } from '../src/lib/sounds';
import { boundary2d } from '../src/lib/actions/behaviors/boundaries/boundary';
import { ricochet2DCollision } from '../src/lib/actions/behaviors/ricochet/ricochet-2d-collision';

const gameBounds = { top: 5, bottom: -5, left: -15, right: 15 };

const ball = await sphere({
	name: 'ball',
	position: new Vector3(0, 0, 0),
	radius: 0.1,
	color: new Color(Color.NAMES.lightgreen),
});
const moveableBall = makeMoveable(ball).onSetup(({ me }) => {
	me.setPosition(0, 0, 0);
	me.moveX(5);
}).addBehaviors([
	ricochet2DInBounds({ boundaries: gameBounds }, () => {
		ricochetSound();
	}),
	ricochet2DCollision({ collisionWith: { name: RegExp('paddle') } }, () => {
		pingPongBeep();
	})
]);

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
	const { Up, Down } = inputs.p1.directions;
	const { Vertical } = inputs.p1.axes;
	let value = (Up.held ? 1 : 0) - (Down.held ? 1 : 0) || -(Vertical.value);
	me.moveY(value * paddleSpeed);
});
paddle1.addBehavior(boundary2d({ boundaries: gameBounds }));

const paddle2 = await box({
	name: 'paddle2',
	position: { x: 10, y: 0, z: 0 },
	size: paddleSize,
	material: paddleMaterial,
});
makeMoveable(paddle2).onUpdate(({ me, inputs }) => {
	const { Up, Down } = inputs.p2.directions;
	const { Vertical } = inputs.p2.axes;
	const value = (Up.held ? 1 : 0) - (Down.held ? 1 : 0) || -(Vertical.value);
	me.moveY(value * paddleSpeed);
});
paddle2.addBehavior(boundary2d({ boundaries: gameBounds }));

const p1Goal = await zone({
	name: 'p1Goal',
	position: { x: 12, y: 0, z: 0 },
	size: new Vector3(2, 10, 1),
});
p1Goal.onEnter(({ visitor }) => {
	const p1Score = game1.getGlobal('p1Score');
	if (visitor.uuid === moveableBall.uuid) {
		game1.setGlobal('p1Score', Number(p1Score) + 1);
		moveableBall.setPosition(0, 0, 0);
		moveableBall.moveXY(-5, 0);
	}
});

const p2Goal = await zone({
	name: 'p2Goal',
	position: { x: -12, y: 0, z: 0 },
	size: new Vector3(2, 10, 1),
});
p2Goal.onEnter(({ visitor }) => {
	const p2Score = game1.getGlobal('p2Score');
	if (visitor.uuid === moveableBall.uuid) {
		game1.setGlobal('p2Score', Number(p2Score) + 1);
		moveableBall.setPosition(0, 0, 0);
		moveableBall.moveXY(5, 0);
	}
});

const camera1 = camera({
	position: new Vector3(0, 0, 0),
	perspective: 'fixed-2d',
	zoom: 12,
});

const p1Text = await text({
	name: 'p1Text',
	text: '0',
	fontSize: 24,
	screenPosition: new Vector2(0.45, 0.05),
});

const p2Text = await text({
	name: 'p2Text',
	text: '0',
	fontSize: 24,
	screenPosition: new Vector2(0.55, 0.05),
});

const winnerText = await text({
	name: 'winnerText',
	text: '',
	fontSize: 36,
	screenPosition: new Vector2(0.5, 0.5),
});

const stage1 = stage({ variables: { screenBounces: 0 } }, camera1);
const game1 = game({
	id: 'pong',
	debug: true,
	globals: {
		p1Score: 0,
		p2Score: 0,
		winner: '',
	},
	input: {
		p1: { key: { w: ['directions.up'], s: ['directions.down'] } },
		p2: { key: { ArrowUp: ['directions.up'], ArrowDown: ['directions.down'] } },
	},
}, stage1, ball, paddle1, paddle2, p1Goal, p2Goal, p1Text, p2Text, winnerText);

const goalScore = 3;

stage1.onUpdate(
	globalChanges(['p1Score', 'p2Score'], ([p1, p2]) => {
		if (p1 >= goalScore) game1.setGlobal('winner', 'p1');
		if (p2 >= goalScore) game1.setGlobal('winner', 'p2');
	}),
);
game1.onGlobalChange('winner', (value) => {
	console.log('Winner:', value);
	if (value === 'p1') {
		winnerText.updateText('P1 Wins!');
	} else if (value === 'p2') {
		winnerText.updateText('P2 Wins!');
	} else {
		winnerText.updateText('');
	}
});

game1.onGlobalChange('p1Score', (value) => {
	p1Text.updateText(String(value));
});
game1.onGlobalChange('p2Score', (value) => {
	p2Text.updateText(String(value));
});

game1.start();
