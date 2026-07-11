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
import { ZylemRuntimePlatformer3DFsmState } from '@zylem/game-lib/runtime';
import {
	playgroundPlane,
	playgroundActor,
	playgroundPlatforms,
} from '../../utils';
import { demoAsset } from '../../assets/manifest';
import {
	Platformer3DRuntimeAdapter,
	buildPlatformerGroundHeightfield,
	staticBoxesFromEntities,
} from '../_shared/platformer-3d-runtime';

const skybox = demoAsset('general/skybox-default.png');

/**
 * Loose alias for the player entity in this demo. The actor returned by
 * `playgroundActor` is typed `any`, and the platformer adapter only needs
 * `group`, `options`, and `physicsAttached` from it; we intentionally avoid
 * importing the internal `GameEntity` class.
 */
type DemoPlayer = any;

export default function createDemo() {
	const groundPlane = playgroundPlane('dirt');
	const player = playgroundActor('player') as DemoPlayer & StageEntity;
	// Mark the player as runtime-owned so the stage-entity-delegate skips
	// creating a TS Rapier body for it (we drive its pose from wasm).
	(player.options as any).runtime = { simulation: 'runtime' };

	const platforms = playgroundPlatforms();

	const camera = createCamera({
		position: { x: 0, y: 8, z: 7 },
		perspective: 'third-person',
	});

	const platformerAdapter = new Platformer3DRuntimeAdapter({
		player,
		capsule: {
			// Spawn well clear of the start platform so the initial fall settles
			// visibly. Capsule dimensions match the actor's collision spec
			// (size.y = 3.8 → halfHeight + radius = 1.9).
			position: [0, 5, 0],
			halfHeight: 1.4,
			radius: 0.5,
		},
		staticColliders: staticBoxesFromEntities(platforms),
		heightfield: buildPlatformerGroundHeightfield(groundPlane),
	});

	const stage = createStage(
		{
			gravity: new Vector3(0, -9.82, 0),
			backgroundImage: skybox,
			runtimeAdapter: platformerAdapter,
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

		platformerAdapter.pushInput(horizontal, vertical, jumpHeld, runHeld);

		// Drive the actor's facing visually. The wasm capsule is upright-only;
		// there's no rotation FFI yet, so we track yaw demo-side.
		if (Math.abs(horizontal) > 0.2 || Math.abs(vertical) > 0.2) {
			lastMovement.set(horizontal, 0, vertical);
		}
		if (lastMovement.lengthSq() > 0) {
			const yaw = Math.atan2(-lastMovement.x, lastMovement.z);
			platformerAdapter.setFacing(yaw);
		}

		// Read FSM state from the previous step (pushInput above feeds the
		// *next* step). One-frame animation lag is negligible.
		const state = platformerAdapter.currentState();
		switch (state) {
			case ZylemRuntimePlatformer3DFsmState.Running:
				me.playAnimation({ key: 'running' });
				break;
			case ZylemRuntimePlatformer3DFsmState.Walking:
				me.playAnimation({ key: 'walking' });
				break;
			case ZylemRuntimePlatformer3DFsmState.Jumping:
				me.playAnimation({ key: 'jumping-up', pauseAtEnd: true });
				break;
			case ZylemRuntimePlatformer3DFsmState.Falling:
				me.playAnimation({ key: 'jumping-up', pauseAtEnd: true });
				break;
			case ZylemRuntimePlatformer3DFsmState.Landing:
				me.playAnimation({ key: 'jumping-down', pauseAtEnd: true });
				break;
			case ZylemRuntimePlatformer3DFsmState.Idle:
			default:
				me.playAnimation({ key: 'idle' });
				break;
		}
	});

	return game;
}
