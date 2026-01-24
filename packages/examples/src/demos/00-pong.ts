import { Color, Vector3, Vector2 } from 'three';
import { 
    createGame, createBox, createSphere, createStage, createCamera, createZone, createText,
    makeMoveable, ricochetSound, pingPongBeep,
    getGlobal, setGlobal,
    WorldBoundary2DBehavior, Ricochet2DBehavior, BoundaryRicochetCoordinator
} from '@zylem/game-lib';

const gameBounds = { top: 5, bottom: -5, left: -15, right: 15 };

const ball = createSphere({
	name: 'ball',
	position: new Vector3(0, 0, 0),
	radius: 0.1,
	color: new Color(Color.NAMES.white),
});

const moveableBall = makeMoveable(ball);

// Attach ricochet behavior for ball reflection
const ballRicochet = moveableBall.use(Ricochet2DBehavior, {
	minSpeed: 5,
	maxSpeed: 10,
	speedMultiplier: 1.05,
	reflectionMode: 'angled',
	maxAngleDeg: 60,
});

// Attach boundary behavior to detect wall hits
const ballBoundary = moveableBall.use(WorldBoundary2DBehavior, {
	boundaries: gameBounds,
});

moveableBall.onSetup(({ me }) => {
	me.setPosition(0, 0, 0);
	me.move(new Vector3(5, 0, 0));
});

const ballCoordinator = new BoundaryRicochetCoordinator(moveableBall, ballBoundary, ballRicochet);

moveableBall.onUpdate(({ me }) => {
	const result = ballCoordinator.update();

	if (result) {
		me.body?.setLinvel({ x: result.velocity.x, y: result.velocity.y, z: 0 }, true);
		ricochetSound();
	}
});

// Handle paddle collisions
moveableBall.onCollision(({ entity, other }) => {
	if (!other.name || other.name.indexOf('paddle') === -1) return;

	// Determine collision normal based on paddle position (always force horizontal reflection)
	const ballPos = entity.body?.translation();
	const paddlePos = other.body?.translation();
	if (!ballPos || !paddlePos) return;

	const normalX = ballPos.x > paddlePos.x ? 1 : -1;

	// Compute ricochet with entities and explicit normal
	const result = ballRicochet.getRicochet({
		entity,
		otherEntity: other,
		otherSize: paddleSize,
		contact: { normal: { x: normalX, y: 0 } },
	});

	if (result) {
		entity.body?.setLinvel({ x: result.velocity.x, y: result.velocity.y, z: 0 }, true);
		pingPongBeep();
	}
});

const paddleSize = { x: 0.20, y: 1.5, z: 1 };
const paddleMaterial = { color: new Color(Color.NAMES.white) };
const paddleSpeed = 5;

const paddle1 = createBox({
	name: 'paddle1',
	position: { x: -8, y: 0, z: 0 },
	size: paddleSize,
	material: paddleMaterial,
});

const paddle1Moveable = makeMoveable(paddle1);
const paddle1Boundary = paddle1Moveable.use(WorldBoundary2DBehavior, {
	boundaries: gameBounds,
});

paddle1Moveable.onUpdate(({ me, inputs }) => {
	const { Up, Down } = inputs.p1.directions;
	const { Vertical } = inputs.p1.axes;
	let value = (Up.held ? 1 : 0) - (Down.held ? 1 : 0) || -(Vertical.value);
	let moveY = value * paddleSpeed;

	// Constrain movement to boundaries
	({ moveY } = paddle1Boundary.getMovement(0, moveY));
	me.moveY(moveY);
});

const paddle2 = createBox({
	name: 'paddle2',
	position: { x: 8, y: 0, z: 0 },
	size: paddleSize,
	material: paddleMaterial,
});

const paddle2Moveable = makeMoveable(paddle2);
const paddle2Boundary = paddle2Moveable.use(WorldBoundary2DBehavior, {
	boundaries: gameBounds,
});

paddle2Moveable.onUpdate(({ me, inputs }) => {
	const { Up, Down } = inputs.p2.directions;
	const { Vertical } = inputs.p2.axes;
	const value = (Up.held ? 1 : 0) - (Down.held ? 1 : 0) || -(Vertical.value);
	let moveY = value * paddleSpeed;

	// Constrain movement to boundaries
	({ moveY } = paddle2Boundary.getMovement(0, moveY));
	me.moveY(moveY);
});

const p1Goal = createZone({
	name: 'p1Goal',
	position: { x: 12, y: 0, z: 0 },
	size: new Vector3(2, 10, 1),
});
p1Goal.onEnter(({ visitor }) => {
	const p1Score = getGlobal<number>('p1Score') ?? 0;
	if (visitor.uuid === moveableBall.uuid) {
		setGlobal('p1Score', p1Score + 1);
		moveableBall.setPosition(0, 0, 0);
		moveableBall.moveXY(-5, 0);
	}
});

const p2Goal = createZone({
	name: 'p2Goal',
	position: { x: -12, y: 0, z: 0 },
	size: new Vector3(2, 10, 1),
});
p2Goal.onEnter(({ visitor }) => {
	const p2Score = getGlobal<number>('p2Score') ?? 0;
	if (visitor.uuid === moveableBall.uuid) {
		setGlobal('p2Score', p2Score + 1);
		moveableBall.setPosition(0, 0, 0);
		moveableBall.moveXY(5, 0);
	}
});

const camera = createCamera({
	position: new Vector3(0, 0, 0),
	perspective: 'fixed-2d',
	zoom: 12,
});

const p1Text = createText({
	name: 'p1Text',
	text: '0',
	fontSize: 24,
	screenPosition: new Vector2(0.45, 0.05),
});

const p2Text = createText({
	name: 'p2Text',
	text: '0',
	fontSize: 24,
	screenPosition: new Vector2(0.55, 0.05),
});

const winnerText = createText({
	name: 'winnerText',
	text: '',
	fontSize: 36,
	screenPosition: new Vector2(0.5, 0.5),
});

const stage1 = createStage({ backgroundColor: new Color(Color.NAMES.black) }, camera);
const game = createGame({
	id: 'pong',
	debug: true,
	globals: {
		p1Score: 0,
		p2Score: 0,
		winner: '',
	},
	input: {
		// Keyboard mapping (W/S for P1, Arrows for P2)
		// Note: Keyboard mainly drives directions.Up/Down.
		// Gamepad support is automatic and provided via axes.Vertical.
		p1: { key: { w: ['directions.Up'], s: ['directions.Down'] } },
		p2: { key: { ArrowUp: ['directions.Up'], ArrowDown: ['directions.Down'] } },
	},
}, stage1, ball, paddle1, paddle2, p1Goal, p2Goal, p1Text, p2Text, winnerText);

const goalScore = 3;

game.onGlobalChanges<[number, number]>(['p1Score', 'p2Score'], ([p1, p2]) => {
	if (p1 >= goalScore) {
		setGlobal('winner', 'p1');
		moveableBall.setPosition(0, 1, 0);
		moveableBall.moveXY(0, 0);
	}
	if (p2 >= goalScore) {
		setGlobal('winner', 'p2');
		moveableBall.setPosition(0, 1, 0);
		moveableBall.moveXY(0, 0);
	}
});

game.onGlobalChange<string>('winner', (value) => {
	console.log('Winner:', value);
	if (value === 'p1') {
		winnerText.updateText('P1 Wins!');
	} else if (value === 'p2') {
		winnerText.updateText('P2 Wins!');
	} else {
		winnerText.updateText('');
	}
});

game.onGlobalChange<number>('p1Score', (value) => {
	p1Text.updateText(String(value));
});

game.onGlobalChange<number>('p2Score', (value) => {
	p2Text.updateText(String(value));
});

export default game;
