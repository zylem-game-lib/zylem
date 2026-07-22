import { Euler, Vector3 } from 'three';
import { createGame, createStage, createCamera, gameConfig, Perspectives, FirstPersonPerspective } from '@zylem/game-lib/core';
import { createActor } from '@zylem/game-lib/entity';
import { useWASDForAxes, useScreenCenterLook, screenCenterLookDeltas } from '@zylem/game-lib/input';
import { FirstPersonShooterCoordinator, FirstPersonBehavior, Jumper3DBehavior } from '@zylem/game-lib/behavior';

import { createFloor, createArenaLevel } from './level';

import { demoAsset } from '../../assets/manifest';

const pistolGlb = demoAsset('general/player-gun.glb');
const skybox = demoAsset('general/skybox-default.png');

const LOOK_SENSITIVITY = 2;
const MAX_LOOK_DEGREES = 180;

export default function createDemo() {
	// --- Camera ---

	const fpsCamera = createCamera({
		perspective: Perspectives.FirstPerson,
		position: { x: 0, y: 2.85, z: 5 },
		target: { x: 0, y: 1.9, z: 0 },
		name: 'fps',
		damping: 1,
		skipDebugOrbit: true,
	});

	fpsCamera.setPerspective(Perspectives.FirstPerson, {
		initialPosition: { x: 0, y: 2.85, z: 5 },
		initialLookAt: { x: 0, y: 1.9, z: 0 },
		pitchLimit: Math.PI,
	});

	const fps = fpsCamera.getPerspective<FirstPersonPerspective>();

	// --- Player (invisible physics capsule) ---

	const player = createActor({
		name: 'player',
		collision: {
			static: false,
			size: { x: 1.6, y: 1.8, z: 0.6 },
		},
		position: { x: 0, y: 0.9, z: 5 },
	});

	// --- Pistol viewmodel (visual only — no physics body; parented to camera) ---

	const pistol = createActor({
		name: 'pistol',
		models: [pistolGlb],
		scale: { x: 0.42, y: 0.42, z: 0.42 },
		position: { x: 0, y: 0, z: 0 },
	});

	// --- Behaviors ---

	const fpsController = player.use(FirstPersonBehavior, {
		perspective: fps,
		walkSpeed: 8,
		runSpeed: 16,
		lookSensitivity: LOOK_SENSITIVITY,
		eyeHeight: 1.95,
		viewmodel: {
			entity: pistol,
			// Camera-local: +X right, +Y up, −Z forward
			offset: { x: 0.25, y: -0.52, z: -0.40 },
			rotation: new Euler(0, -1.6, -0.08),
			cameraObject: fpsCamera.cameraRef.camera,
		},
	});

	const jumper = player.use(Jumper3DBehavior, {
		jumpHeight: 2.5,
		gravity: 20,
		maxJumps: 2,
		coyoteTimeMs: 100,
		jumpBufferMs: 80,
		snapToGroundDistance: 0.15,
		variableJump: { enabled: true, cutGravityMultiplier: 3 },
		fall: { fallGravityMultiplier: 1.5 },
	});

	const fpsShooter = new FirstPersonShooterCoordinator(
		player as any,
		fpsController,
		jumper,
	);

	// --- Stage + input ---

	const stage = createStage(
		{
			gravity: { x: 0, y: -20, z: 0 },
			backgroundImage: skybox,
		},
		fpsCamera,
	);

	stage.setInputConfiguration(
		useWASDForAxes('p1'),
		useScreenCenterLook('p1', {
			maxLookDegrees: MAX_LOOK_DEGREES,
			lookSensitivity: LOOK_SENSITIVITY,
		}),
		{
		p1: {
			key: {
				' ': ['buttons.a'],
			},
		},
	});

	// --- Entities ---

	const floor = createFloor();
	const walls = createArenaLevel();

	// --- Game ---

	const myGameConfig = gameConfig({
		id: 'fps-demo',
		debug: true,
		bodyBackground: '#1a1a1a',
		resolution: {
			width: 800,
			height: 600,
		},
	});

	fpsCamera.addTarget(player);

	const game = createGame(
		myGameConfig,
		stage,
		floor,
		...walls,
		player,
		pistol,
	).onUpdate(({ inputs }) => {
		const { p1 } = inputs;
		const pointer = p1.pointer ?? { centerX: 0, centerY: 0 };
		const { lookX, lookY } = screenCenterLookDeltas(
			pointer.centerX,
			pointer.centerY,
			fpsController.getYaw(),
			fpsController.getPitch(),
			{ maxLookDegrees: MAX_LOOK_DEGREES, lookSensitivity: LOOK_SENSITIVITY },
		);

		fpsShooter.update({
			moveX: p1.axes.Horizontal.value,
			moveZ: -p1.axes.Vertical.value,
			lookX,
			lookY,
			sprint: p1.shoulders.LTrigger.held > 0,
			jumpPressed: p1.buttons.A.pressed,
			jumpHeld: p1.buttons.A.held > 0,
			jumpReleased: p1.buttons.A.released,
		});
	});

	return game;
}
