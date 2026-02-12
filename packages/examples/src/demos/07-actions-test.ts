/**
 * Actions API Demo
 *
 * Demonstrates:
 * - moveBy / moveTo interval actions
 * - sequence / parallel / repeatForever composition
 * - rotateBy spinning
 * - delay + callFunc side-effects
 * - throttle persistent action
 * - CooldownBehavior + CooldownIcon UI
 */

import { Color, Vector2, Vector3 } from 'three';
import {
	createGame, createStage, createBox, createPlane, createSphere,
	moveBy, rotateBy, delay, callFunc,
	sequence, parallel, repeatForever,
	throttle,
	CooldownBehavior, createCooldownIcon,
	useArrowsForDirections,
} from '@zylem/game-lib';

import grassPath from '@zylem/assets/3d/textures/grass.jpg';
import woodPath from '@zylem/assets/3d/textures/wood-box.jpg';

// ─── Stage ───────────────────────────────────────────────────────────

const stage = createStage({
	gravity: new Vector3(0, -9.82, 0),
	inputs: { p1: ['gamepad-1', 'keyboard-1'] },
	backgroundColor: new Color(0x222233),
}).onSetup(({ camera }: any) => {
	(camera as any)?.camera.position.set(0, 12, 30);
	(camera as any)?.camera.lookAt(0, 3, 0);
});

stage.setInputConfiguration(
	useArrowsForDirections('p1'),
);

// ─── Ground ──────────────────────────────────────────────────────────

const ground = createPlane({
	tile: new Vector2(100, 100),
	collision: { static: true },
	material: { path: grassPath, repeat: new Vector2(10, 10) },
});

// ─── Patrol box (repeatForever + sequence + moveBy) ──────────────────

const patrolBox = createBox({
	size: new Vector3(1.5, 1.5, 1.5),
	position: { x: -8, y: 2, z: 0 },
	collision: { static: false },
	material: { path: woodPath },
});

// Patrol back and forth forever
patrolBox.runAction(
	repeatForever(
		sequence(
			moveBy({ x: 6, duration: 2000 }),
			delay(300),
			moveBy({ x: -6, duration: 2000 }),
			delay(300),
		),
	),
);

// ─── Spinning sphere (rotateBy) ──────────────────────────────────────

const spinner = createSphere({
	size: new Vector3(1.5, 1.5, 1.5),
	position: { x: 0, y: 4, z: -5 },
	collision: { static: true },
	color: new Color(0x44aaff),
});

spinner.runAction(
	repeatForever(rotateBy({ y: 360, duration: 3000 })),
);

// ─── Choreography box (sequence of moves + callFunc) ─────────────────

const choreographyBox = createBox({
	size: new Vector3(1, 1, 1),
	position: { x: 6, y: 2, z: 0 },
	collision: { static: false },
	color: new Color(0xff6644),
});

choreographyBox.runAction(
	sequence(
		moveBy({ y: 5, duration: 1000 }),
		delay(500),
		parallel(
			moveBy({ x: -4, duration: 1000 }),
			rotateBy({ z: 180, duration: 1000 }),
		),
		moveBy({ x: 4, duration: 1500 }),
		callFunc(() => console.log('[actions-test] choreography complete!')),
	),
);

// ─── Player box with cooldown + throttle ─────────────────────────────

const player = createBox({
	size: new Vector3(2, 2, 2),
	position: { x: 0, y: 2, z: 5 },
	collision: { static: false },
	color: new Color(0x44ff44),
});

// Cooldown behavior: attack on 5s cooldown, dash on 2s, moveLeft on 3s
const cd = player.use(CooldownBehavior, {
	cooldowns: {
		attack: { duration: 5 },
		dashRight: { duration: 2 },
		dashLeft: { duration: 3 },
	},
});

// Throttle: can only move every 100ms
const moveThrottle = player.action(throttle({ duration: 100 }));

player.onUpdate(({ me, inputs }: any) => {
	const { p1 } = inputs;

	// WASD / arrow movement via throttle
	if (moveThrottle.ready) {
		const speed = 8;
		if (p1.directions.up?.held > 0) me.moveZ(-speed);
		if (p1.directions.down?.held > 0) me.moveZ(speed);
		if (p1.directions.left?.held > 0) me.moveX(-speed);
		if (p1.directions.right?.held > 0) me.moveX(speed);
		moveThrottle.consume();
	}

	// Attack (A / space)
	if (cd.isReady('attack') && p1.buttons?.A?.pressed) {
		cd.fire('attack');
		console.log('[actions-test] Attack!');
		me.runAction(
			sequence(
				moveBy({ y: 3, duration: 150 }),
				moveBy({ y: -3, duration: 150 }),
			),
		);
	}

	// Dash (B / shift)
	if (cd.isReady('dashRight') && p1.buttons?.B?.pressed) {
		cd.fire('dashRight');
		console.log('[actions-test] Dash Right!');
		me.runAction(moveBy({ x: 1, duration: 200 }));
	}

	// Move left (X / ctrl)
	if (cd.isReady('dashLeft') && p1.buttons?.X?.pressed) {
		cd.fire('dashLeft');
		console.log('[actions-test] Dash left!');
		me.runAction(moveBy({ x: -1, duration: 200 }));
	}
});

// ─── Cooldown Icons (WoW-style UI) ──────────────────────────────────

const attackIcon = createCooldownIcon({
	cooldown: 'attack',
	fillColor: '#cc3333',
	screenAnchor: 'top-center',
	screenPosition: { x: 0, y: 10 },
	iconSize: 'sm',
	showTimer: true,
});

const dashIcon = createCooldownIcon({
	cooldown: 'dashRight',
	fillColor: '#3366cc',
	screenAnchor: 'top-center',
	screenPosition: { x: 15, y: 10 },
	iconSize: 'sm',
	showTimer: true,
});

const moveLeftIcon = createCooldownIcon({
	cooldown: 'dashLeft',
	fillColor: '#33cc44',
	screenAnchor: 'top-center',
	screenPosition: { x: -15, y: 10 },
	iconSize: 'sm',
	showTimer: true,
});

// ─── Game ────────────────────────────────────────────────────────────

const actionsDemo = createGame(
	{ id: 'actions-test', debug: true },
	stage,
	ground,
	patrolBox,
	spinner,
	choreographyBox,
	player,
	attackIcon,
	dashIcon,
	moveLeftIcon,
);

export default actionsDemo;
