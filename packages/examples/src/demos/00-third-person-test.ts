/// <reference types="@zylem/assets" />

import { Vector3 } from 'three';
import {
	createGame,
	createStage,
	createZone,
	useArrowsForAxes,
} from '@zylem/game-lib';
import {
	addZylemRuntimeStaticHeightfieldCollider,
	bootstrapZylemRuntimeGameplay3D,
	createZylemRuntimeSession,
	getZylemRuntimeGameplay3DDebugRender,
	getZylemRuntimeGameplay3DState,
	ZylemRuntimePlatformer3DFsmState,
	type StageRuntimeAdapter,
	type StageRuntimeContext,
	type StageRuntimeStepContext,
	type ZylemRuntimeBufferViews,
	type ZylemRuntimeGameplay3DConfig,
	type ZylemRuntimeStaticBoxCollider,
} from '@zylem/game-lib/runtime';
import {
	playgroundPlane,
	playgroundActor,
	playgroundPlatforms,
} from '../utils';
import skybox from '@zylem/assets/3d/skybox/default.png';
import { UpdateContext } from '@zylem/game-lib';
import { createCamera } from '@zylem/game-lib';
import { StageEntity } from '@zylem/game-lib';

/**
 * Loose alias for the player entity in this demo. The actor returned by
 * `playgroundActor` is typed `any`, and the platformer adapter only needs
 * `group`, `options`, and `physicsAttached` from it; we intentionally avoid
 * importing the internal `GameEntity` class.
 */
type DemoPlayer = any;

import runtimeWasmUrl from '../../../zylem-runtime/target/wasm32-unknown-unknown/release/zylem_runtime.wasm?url';

/**
 * Static heightfield mirror passed in from the demo so the KCC can walk on
 * the same randomized ground as the visual mesh. Pulled out of
 * `playgroundPlane`'s `PlaneMeshBuilder` after the entity is created.
 */
interface DemoHeightfield {
	rows: number;
	cols: number;
	heights: Float32Array;
	scale: [number, number, number];
	translation: [number, number, number];
	friction: number;
	restitution: number;
}

/**
 * Player-only adapter that drives a single capsule body through the wasm
 * runtime's Gameplay3D mode. The rest of the scene (ground plane, platforms,
 * zones) stays on the TS-side Rapier world; we mirror the platforms as
 * static box colliders and the ground plane as a real heightfield so the
 * KCC walks on the same bumps the player sees.
 *
 * Lifecycle:
 *   - `init`: load wasm, build a 1-slot session, register static colliders
 *     for platforms + ground heightfield, configure the player capsule +
 *     platformer.
 *   - `step` (called by `ZylemStage._update` after entity updates and the
 *     transform system): tick the wasm runtime, then write the slot's pose
 *     into `player.group` so the third-person camera + scene render see it.
 *
 * Contract with the rest of the demo: the host pushes input axes/buttons via
 * `pushInput()` from the player's `onUpdate` (which runs *before* this
 * adapter's step) and reads the FSM state via `currentState()` to drive
 * animations.
 */
class Platformer3DRuntimeAdapter implements StageRuntimeAdapter {
	private buffers: ZylemRuntimeBufferViews | null = null;
	private rotationY = 0;

	constructor(
		private readonly player: DemoPlayer,
		private readonly staticColliders: ZylemRuntimeStaticBoxCollider[],
		private readonly capsule: {
			position: [number, number, number];
			halfHeight: number;
			radius: number;
		},
		private readonly heightfield: DemoHeightfield | null,
	) { }

	ownsEntity(entity: DemoPlayer): boolean {
		return entity === this.player;
	}

	rendersEntity(_entity: DemoPlayer): boolean {
		// We want the FBX skinned mesh + animations to render normally — only
		// the *physics* body is owned by the wasm runtime.
		return false;
	}

	registerEntity(entity: DemoPlayer): void {
		if (entity === this.player) {
			entity.physicsAttached = false;
		}
	}

	unregisterEntity(_entity: DemoPlayer): void { }

	async init(_context: StageRuntimeContext): Promise<void> {
		const buffers = await createZylemRuntimeSession(runtimeWasmUrl, 1, 1);

		if (this.heightfield) {
			addZylemRuntimeStaticHeightfieldCollider(buffers.exports, buffers.exports.memory, {
				rows: this.heightfield.rows,
				cols: this.heightfield.cols,
				heights: this.heightfield.heights,
				scale: this.heightfield.scale,
				translation: this.heightfield.translation,
				friction: this.heightfield.friction,
				restitution: this.heightfield.restitution,
			});
		}

		const config: ZylemRuntimeGameplay3DConfig = {
			capsules: [
				{
					slot: 0,
					position: this.capsule.position,
					halfHeight: this.capsule.halfHeight,
					radius: this.capsule.radius,
				},
			],
			platformers: [
				{
					slot: 0,
					walkSpeed: 10,
					runSpeed: 20,
					jumpForce: 16,
					// Double jump matches the original demo intent.
					maxJumps: 4,
					gravity: 9.82,
					coyoteTime: 0.1,
					jumpBufferTime: 0.1,
					jumpCutMultiplier: 0.5,
					multiJumpWindow: 0.15,
					maxSlopeDeg: 50,
					autostepHeight: 0.3,
					snapToGround: 0.2,
				},
			],
			staticColliders: this.staticColliders,
		};

		this.buffers = bootstrapZylemRuntimeGameplay3D(buffers, config);
		this.syncPlayerGroup();
	}

	/**
	 * Snapshot the wasm Gameplay3D Rapier world's debug lines so the stage
	 * debug delegate can render them alongside the TS Rapier overlay.
	 * Returning `null` (no buffers yet, or empty render) hides the second
	 * line set this frame.
	 */
	getDebugRender(): { vertices: Float32Array; colors: Float32Array } | null {
		const buffers = this.buffers;
		if (!buffers) return null;
		const result = getZylemRuntimeGameplay3DDebugRender(buffers.exports, buffers.exports.memory);
		if (!result) return null;
		return { vertices: result.vertices, colors: result.colors };
	}

	step(context: StageRuntimeStepContext): void {
		const buffers = this.buffers;
		if (!buffers) return;

		buffers.exports.zylem_runtime_step(context.delta);
		this.syncPlayerGroup();
	}

	destroy(_context: StageRuntimeContext | null): void {
		this.buffers = null;
	}

	/**
	 * Push per-frame input + facing into the runtime. Called from the player's
	 * `onUpdate`, which runs *before* `step` in the same frame, so the wasm
	 * tick consumes this frame's inputs.
	 */
	pushInput(moveX: number, moveZ: number, jump: boolean, run: boolean): void {
		const buffers = this.buffers;
		if (!buffers) return;
		buffers.exports.zylem_runtime_gameplay3d_set_input_axes(0, moveX, moveZ);
		buffers.exports.zylem_runtime_gameplay3d_set_input_buttons(
			0,
			jump ? 1 : 0,
			run ? 1 : 0,
		);
	}

	/** Animation-facing FSM state from the most recent step. */
	currentState(): ZylemRuntimePlatformer3DFsmState {
		const buffers = this.buffers;
		if (!buffers) return ZylemRuntimePlatformer3DFsmState.Idle;
		return getZylemRuntimeGameplay3DState(buffers, 0);
	}

	/**
	 * Visual-only rotation set by the demo whenever movement input is
	 * non-zero. Stored here so we can apply it consistently each frame
	 * (including when input is zero, to preserve last-known facing).
	 */
	setFacing(yawRadians: number): void {
		this.rotationY = -yawRadians;
	}

	/**
	 * Reads the slot's position from the input buffer (where the runtime
	 * mirrors slot.position back after each step) and applies it to the
	 * player entity's Three.js group along with the demo-tracked yaw.
	 *
	 * Rapier's capsule `position` is the *center* of the capsule (midpoint
	 * of the segment between the two hemisphere centers), but FBX actor
	 * meshes have their origin at the feet. To keep the rendered feet
	 * aligned with the bottom of the collider we shift the visual group
	 * down by `halfHeight + radius`. Without this the mesh sits at the
	 * capsule center and roughly half the collider sticks out below the
	 * feet.
	 */
	private syncPlayerGroup(): void {
		const buffers = this.buffers;
		const group = this.player.group;
		if (!buffers || !group) return;
		// Slot 0 lives at the head of the input buffer because the runtime
		// mirrors slot.position back to it after every step (see
		// `runtime.rs::sync_gameplay3d`).
		const x = buffers.inputView[0]!;
		const yCenter = buffers.inputView[1]!;
		const z = buffers.inputView[2]!;
		const yFeet = yCenter - (this.capsule.halfHeight + this.capsule.radius);
		group.position.set(x, yFeet, z);
		group.rotation.y = this.rotationY;
	}
}

/**
 * Mirror the demo's static scenery (platforms only) into wasm static box
 * colliders. The ground plane is registered separately as a heightfield so
 * the KCC walks on the same bumps the visual mesh shows.
 */
function buildStaticColliders(platforms: any[]): ZylemRuntimeStaticBoxCollider[] {
	const colliders: ZylemRuntimeStaticBoxCollider[] = [];

	for (const platform of platforms) {
		const pos = platform.options.position;
		const size = platform.options.size;
		if (!pos || !size) continue;
		colliders.push({
			center: [pos.x, pos.y, pos.z],
			halfExtents: [size.x / 2, size.y / 2, size.z / 2],
			friction: 0.95,
		});
	}

	return colliders;
}

/**
 * Extract the randomized heightfield from `playgroundPlane`'s mesh builder
 * so the wasm KCC sees the same terrain the renderer draws. The TS plane
 * collision uses the same `heightData`/`tile` pair, with `scale.y = 1`
 * (heights are already in world-space units) and translation set to the
 * plane entity's position. Returns `null` if heights aren't available yet.
 */
function buildGroundHeightfield(groundPlane: any): DemoHeightfield | null {
	const builders = (groundPlane.options as any)?._builders;
	const meshBuilder = builders?.meshBuilder;
	const heights: Float32Array | undefined = meshBuilder?.heightData;
	if (!heights || heights.length === 0) return null;

	const planePos = groundPlane.options.position ?? { x: 0, y: -4, z: 0 };
	const planeTile = groundPlane.options.tile ?? { x: 100, y: 100 };

	// `PlaneMeshBuilder.postBuild` flattens heights as
	// `heights[xIdx * (subdivisionsZ + 1) + zIdx]` (outer X, inner Z).
	// Recover (subdivisionsX + 1) and (subdivisionsZ + 1) from the builder
	// so we don't have to re-derive them from sqrt(length).
	const subdivisionsX = meshBuilder?.subdivisionsX ?? Math.sqrt(heights.length) - 1;
	const subdivisionsZ = meshBuilder?.subdivisionsZ ?? Math.sqrt(heights.length) - 1;
	const expected = (subdivisionsX + 1) * (subdivisionsZ + 1);
	if (expected !== heights.length) {
		// If the builder didn't expose subdivisions or they don't match the
		// flattened buffer size, bail out — adapter falls back to "no ground"
		// which makes the issue obvious during demo testing.
		return null;
	}

	return {
		rows: subdivisionsX,
		cols: subdivisionsZ,
		// Snapshot the heights so the wasm side has a stable copy independent
		// of any future builder rebuild.
		heights: new Float32Array(heights),
		scale: [planeTile.x, 1, planeTile.y],
		translation: [planePos.x, planePos.y, planePos.z],
		friction: 0.95,
		restitution: 0.0,
	};
}

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

	const staticColliders = buildStaticColliders(platforms);
	const groundHeightfield = buildGroundHeightfield(groundPlane);
	const platformerAdapter = new Platformer3DRuntimeAdapter(
		player,
		staticColliders,
		{
			// Spawn well clear of the start platform so the initial fall settles
			// visibly. Capsule dimensions match the actor's collision spec
			// (size.y = 3.8 → halfHeight + radius = 1.9).
			position: [0, 5, 0],
			halfHeight: 1.4,
			radius: 0.5,
		},
		groundHeightfield,
	);

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
