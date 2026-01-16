import { Color, Vector2, Vector3 } from 'three';
import { createGame, createBox, createSphere, createStage, createCamera, createZone, createText, setGlobal, onGlobalChange, onGlobalChanges } from '@zylem/game-lib';
import { makeMoveable } from '@zylem/game-lib';
import { ricochet2DCollision } from '@zylem/game-lib';
import { ricochet2DInBounds } from '@zylem/game-lib';
import { ricochetSound } from '@zylem/game-lib';
import { boundary2d } from '@zylem/game-lib';

const board = { top: 10, bottom: -10, left: -12, right: 12 };

const paddleSize = new Vector3(4, 0.6, 1);
const paddleSpeed = 12;

const paddle = createBox({
	name: 'paddle',
	position: new Vector3(0, -9, 0),
	size: paddleSize,
	material: { color: new Color('#ffffff') },
});
makeMoveable(paddle).onUpdate(({ me, inputs }) => {
	const { Left, Right } = inputs.p1.directions;
	const { Horizontal } = inputs.p1.axes;
	const value = (Right.held ? 1 : 0) - (Left.held ? 1 : 0) || Horizontal.value;
	me.moveX(value * paddleSpeed);
});
paddle.addBehavior(boundary2d({ boundaries: board }));

const ballRadius = 0.25;
const ball = createSphere({
	name: 'ball',
	radius: ballRadius,
	material: { color: new Color(Color.NAMES.lightgreen) },
});
const moveableBall = makeMoveable(ball)
	.onSetup(({ me }) => {
		me.setPosition(0, -7, 0);
		me.moveXY(0, 8);
	})
	.addBehaviors([
		ricochet2DInBounds(
			{ boundaries: board, maxSpeed: 25, minSpeed: 3 },
			(event) => {
				console.log(`Ball hit ${event.boundary} at ${event.position.x}, ${event.position.y}`);
			}
		),
		ricochet2DCollision(
			{ collisionWith: { name: 'brick' }, reflectionMode: 'simple' },
			({ other, globals }) => {
				ricochetSound(900, 0.04);
				const remaining = globals.bricksRemaining - 1;
				globals.bricksRemaining = remaining;
				globals.score = globals.score + 100;
				other.nodeDestroy({ me: other, globals });
			}
		),
		ricochet2DCollision(
			{ collisionWith: { name: 'paddle' }, reflectionMode: 'angled' },
			() => {
				ricochetSound(900, 0.04);
			}
		),
	]);

const failZone = createZone({
	name: 'failZone',
	position: new Vector3(0, board.bottom - 1, 0),
	size: new Vector3(board.right - board.left + 10, 2, 1),
});
failZone.onEnter(({ visitor, globals }) => {
	if (visitor.uuid === moveableBall.uuid) {
		if (globals.lives > 0) globals.lives = globals.lives - 1;
		if (globals.lives !== 0) {
			moveableBall.setPosition(0, -7, 0);
			moveableBall.moveXY(0, 8);
		} else {
			moveableBall.setPosition(0, -2, 0);
			moveableBall.moveXY(0, 0);
		}
	}
});

const brickRows = 4;
const brickCols = 10;
const brickSize = new Vector3(2, 0.6, 1);
const brickStartY = 6;
const brickGap = 0.4;
const bricks = [] as any[];
for (let r = 0; r < brickRows; r++) {
	for (let c = 0; c < brickCols; c++) {
		const x = board.left + 2 + c * (brickSize.x + brickGap);
		const y = brickStartY - r * (brickSize.y + 0.6);
		const color = new Color().setHSL(0.02 + r * 0.08, 0.8, 0.5);
		const b = createBox({
			name: 'brick',
			size: brickSize,
			position: new Vector3(x, y, 0),
			material: { color },
			collision: { static: true },
		});
		bricks.push(b);
	}
}

const camera1 = createCamera({
	position: new Vector3(0, 0, 0),
	perspective: 'fixed-2d',
	zoom: 24,
});

const scoreText = createText({
	name: 'scoreText',
	text: 'Score: 0',
	fontSize: 20,
	stickToViewport: true,
	screenPosition: new Vector2(0.1, 0.05),
});

const livesText = createText({
	name: 'livesText',
	text: 'Lives: 3',
	fontSize: 20,
	stickToViewport: true,
	screenPosition: new Vector2(0.9, 0.05),
});

const statusText = createText({
	name: 'statusText',
	text: '',
	fontSize: 32,
	stickToViewport: true,
	screenPosition: new Vector2(0.5, 0.5),
});

const stage1 = createStage({}, camera1);
const game = createGame({
	id: 'breakout',
	debug: true,
	globals: {
		score: 0,
		lives: 3,
		bricksRemaining: bricks.length,
		status: '',
	},
	input: {
		p1: {
			key: {
				ArrowLeft: ['directions.left'],
				ArrowRight: ['directions.right'],
				a: ['directions.left'],
				d: ['directions.right'],
			},
		},
	},
}, stage1, paddle, moveableBall, failZone, scoreText, livesText, statusText, ...bricks);

game.onGlobalChanges<[number, number]>(['bricksRemaining', 'lives'], ([remaining, lives]) => {
	if (remaining <= 0) setGlobal('status', 'win');
	if (lives <= 0) setGlobal('status', 'lose');
});

game.onGlobalChange<string>('status', (value) => {
	if (value === 'win') statusText.updateText('You Win!');
	else if (value === 'lose') statusText.updateText('Game Over');
	else statusText.updateText('');
});

game.onGlobalChange<number>('score', (value) => {
	scoreText.updateText(`Score: ${value}`);
});

game.onGlobalChange<number>('lives', (value) => {
	livesText.updateText(`Lives: ${value}`);
});

export default game;


