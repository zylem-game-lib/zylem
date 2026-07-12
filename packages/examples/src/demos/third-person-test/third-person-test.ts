import { Vector3 } from 'three';
import {
	createCamera,
	createGame,
	createStage,
	type StageEntity,
	type UpdateContext,
} from '@zylem/game-lib/core';
import { createZone } from '@zylem/game-lib/entity';
import { useArrowsForAxes } from '@zylem/game-lib/input';
import { Platformer3DBehavior, Platformer3DState } from '@zylem/game-lib/behavior';
import {
	playgroundPlane,
	playgroundActor,
	playgroundPlatforms,
} from '../../utils';
import { demoAsset } from '../../assets/manifest';

const skybox = demoAsset('general/skybox-default.png');

/**
 * Loose alias for the player entity in this demo. The actor returned by
 * `playgroundActor` is typed `any`; we intentionally avoid importing the
 * internal `GameEntity` class.
 */
type DemoPlayer = any;

export default function createDemo() {
	const groundPlane = playgroundPlane('dirt');
	const player = playgroundActor('player') as DemoPlayer & StageEntity;

	const platforms = playgroundPlatforms();

	const camera = createCamera({
		position: { x: 0, y: 8, z: 7 },
		perspective: 'third-person',
	});

	// The platformer controller (KCC + jump FSM) runs inside the wasm runtime;
	// this attaches it to the actor's simulation body.
	const platformer = player.use(Platformer3DBehavior, {
		walkSpeed: 6,
		runSpeed: 12,
		jumpForce: 12,
		maxJumps: 2,
		gravity: 9.82,
	});

	const stage = createStage(
		{
			gravity: new Vector3(0, -9.82, 0),
			backgroundImage: skybox,
		},
		camera,
	).setInputConfiguration(useArrowsForAxes('p1'));

	const startingZone = createZone({
		position: { x: 0, y: 0, z: 0 },
		size: { x: 10, y: 10, z: 10 },
		onEnter: ({ self, visitor, globals }) => { },
		onExit: ({ self, visitor, globals }) => { },
	});

	const endingZone = createZone({
		position: { x: 0, y: 30, z: 0 },
		size: { x: 10, y: 10, z: 10 },
		onEnter: ({ self, visitor, globals }) => { },
		onExit: ({ self, visitor, globals }) => { },
	});

	stage.add(startingZone);
	stage.add(endingZone);
	stage.add(groundPlane);
	stage.add(player);
	stage.add(...platforms);

	const game = createGame(
		{
			id: 'behaviors-test',
			debug: true,
			resolution: {
				width: 800,
				height: 600,
			},
		},
		stage,
	);

	const lastMovement = new Vector3();
	player.onSetup(({ me }: { me: DemoPlayer }) => {
		camera.cameraRef.target = me;
	});

	player.onUpdate(({ inputs, me }: UpdateContext<any>) => {
		const { p1 } = inputs;

		const horizontal = p1.axes.Horizontal.value;
		const vertical = p1.axes.Vertical.value;
		const jumpHeld = p1.buttons.A.held > 0;
		const runHeld = p1.shoulders.LTrigger.held > 0;

		if (me.$platformer) {
			me.$platformer.moveX = horizontal;
			me.$platformer.moveZ = vertical;
			me.$platformer.jump = jumpHeld;
			me.$platformer.run = runHeld;
		}

		// Drive the actor's facing visually — the wasm capsule is upright-only.
		if (Math.abs(horizontal) > 0.2 || Math.abs(vertical) > 0.2) {
			lastMovement.set(horizontal, 0, vertical);
		}
		if (lastMovement.lengthSq() > 0) {
			const yaw = Math.atan2(-lastMovement.x, lastMovement.z);
			me.setRotationY(yaw);
		}

		// FSM state comes from the previous wasm step's snapshot buffer.
		// One-frame animation lag is negligible.
		const state = platformer.getState();
		switch (state) {
			case Platformer3DState.Running:
				me.playAnimation({ key: 'running' });
				break;
			case Platformer3DState.Walking:
				me.playAnimation({ key: 'walking' });
				break;
			case Platformer3DState.Jumping:
				me.playAnimation({ key: 'jumping-up', pauseAtEnd: true });
				break;
			case Platformer3DState.Falling:
				me.playAnimation({ key: 'jumping-up', pauseAtEnd: true });
				break;
			case Platformer3DState.Landing:
				me.playAnimation({ key: 'jumping-down', pauseAtEnd: true });
				break;
			case Platformer3DState.Idle:
			default:
				me.playAnimation({ key: 'idle' });
				break;
		}
	});

	return game;
}
