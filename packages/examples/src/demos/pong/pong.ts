import { Color } from 'three';
import { createGame, createStage, createCamera } from '@zylem/game-lib/core';
import { createBox, createSphere, createText } from '@zylem/game-lib/entity';
import { getGlobal, setGlobal } from '@zylem/game-lib/globals';
import {
	BoundaryRicochetCoordinator,
	Ricochet2DBehavior,
	WorldBoundary2DBehavior,
} from '@zylem/game-lib/behavior';
import { ricochetSound, pingPongBeep } from '@zylem/game-lib/audio';

export default function createDemo() {
	const gameBounds = { top: 5, bottom: -5, left: -15, right: 15 };

	const ball = createSphere({
		name: 'ball',
		position: { x: 0, y: 0, z: 0 },
		radius: 0.1,
		color: new Color(Color.NAMES.white),
	});

	const ballRicochet = ball.use(Ricochet2DBehavior, {
		minSpeed: 5,
		maxSpeed: 10,
		speedMultiplier: 1.05,
		reflectionMode: 'angled',
		maxAngleDeg: 60,
	});

	const ballBoundary = ball.use(WorldBoundary2DBehavior, {
		boundaries: gameBounds,
	});

	const ballCoordinator = new BoundaryRicochetCoordinator(
		ball as any,
		ballBoundary,
		ballRicochet,
	);

	ball.onSetup(({ me }) => {
		me.moveXY(5, 0);
	});

	ball.onUpdate(() => {
		ballCoordinator.update();
	});

	ballRicochet.onRicochet(() => {
		ricochetSound();
	});

	const paddleSize = { x: 0.2, y: 1.5, z: 1 };
	const paddleMaterial = { color: new Color(Color.NAMES.white) };
	const paddleSpeed = 5;

	function createPaddle(name: string, x: number, player: 'p1' | 'p2') {
		const paddle = createBox({
			name,
			position: { x, y: 0, z: 0 },
			size: paddleSize,
			material: paddleMaterial,
		});

		const paddleBoundary = paddle.use(WorldBoundary2DBehavior, {
			boundaries: gameBounds,
		});

		paddle.onUpdate(({ me, inputs }) => {
			const { Up, Down } = inputs[player].directions;
			const { Vertical } = inputs[player].axes;
			const value = (Up.held ? 1 : 0) - (Down.held ? 1 : 0) || -Vertical.value;
			let moveY = value * paddleSpeed;
			({ moveY } = paddleBoundary.getMovement(0, moveY));
			me.moveXY(0, moveY);
		});

		return paddle;
	}

	const paddle1 = createPaddle('paddle1', -8, 'p1');
	const paddle2 = createPaddle('paddle2', 8, 'p2');

	// Paddle hits reflect the ball with an angled bounce.
	ball.onCollision(({ entity, other }) => {
		if (other.name !== 'paddle1' && other.name !== 'paddle2') return;
		ballRicochet.applyRicochet({
			entity,
			otherEntity: other,
			otherSize: paddleSize,
			contact: { normal: { x: other.name === 'paddle1' ? 1 : -1, y: 0 } },
		});
		pingPongBeep();
	});

	const camera = createCamera({
		position: { x: 0, y: 0, z: 0 },
		perspective: 'fixed-2d',
		zoom: 12,
	});

	const p1Text = createText({
		name: 'p1Text',
		text: '0',
		fontSize: 24,
		screenPosition: { x: 0.45, y: 0.05 },
	});

	const p2Text = createText({
		name: 'p2Text',
		text: '0',
		fontSize: 24,
		screenPosition: { x: 0.55, y: 0.05 },
	});

	const winnerText = createText({
		name: 'winnerText',
		text: '',
		fontSize: 36,
		screenPosition: { x: 0.5, y: 0.5 },
	});

	const stage1 = createStage(
		{
			backgroundColor: new Color(Color.NAMES.black),
		},
		camera,
	);
	const game = createGame(
		{
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
				p2: {
					key: { ArrowUp: ['directions.Up'], ArrowDown: ['directions.Down'] },
				},
			},
		},
		stage1,
		ball,
		paddle1,
		paddle2,
		p1Text,
		p2Text,
		winnerText,
	);

	const goalScore = 3;
	let justScored = false;

	function resetBall(velocityX: number) {
		ball.setPosition(0, 0, 0);
		ball.moveXY(velocityX, 0);
	}

	stage1.onUpdate(() => {
		const position = ball.getPosition?.();
		if (!position) return;

		if (justScored && Math.abs(position.x) < 0.5) {
			justScored = false;
		}
		if (justScored || (getGlobal<string>('winner') ?? '') !== '') {
			return;
		}

		if (position.x >= 12) {
			setGlobal('p1Score', (getGlobal<number>('p1Score') ?? 0) + 1);
			resetBall(-5);
			justScored = true;
		} else if (position.x <= -12) {
			setGlobal('p2Score', (getGlobal<number>('p2Score') ?? 0) + 1);
			resetBall(5);
			justScored = true;
		}
	});

	game.onGlobalChanges<[number, number]>(['p1Score', 'p2Score'], ([p1, p2]) => {
		if (p1 >= goalScore) {
			setGlobal('winner', 'p1');
			ball.setPosition(0, 1, 0);
			ball.moveXY(0, 0);
		}
		if (p2 >= goalScore) {
			setGlobal('winner', 'p2');
			ball.setPosition(0, 1, 0);
			ball.moveXY(0, 0);
		}
	});

	game.onGlobalChange<string>('winner', value => {
		console.log('Winner:', value);
		if (value === 'p1') {
			winnerText.updateText('P1 Wins!');
		} else if (value === 'p2') {
			winnerText.updateText('P2 Wins!');
		} else {
			winnerText.updateText('');
		}
	});

	game.onGlobalChange<number>('p1Score', value => {
		p1Text.updateText(String(value));
	});

	game.onGlobalChange<number>('p2Score', value => {
		p2Text.updateText(String(value));
	});

	return game;
}
