import {
	addZylemRuntimeStaticHeightfieldCollider,
	bootstrapZylemRuntimeGameplay3D,
	createZylemRuntimeSession,
	getZylemRuntimeGameplay3DDebugRender,
	getZylemRuntimeGameplay3DState,
	setZylemRuntimeGameplay3DSlotPosition,
	ZylemRuntimePlatformer3DFsmState,
	type StageRuntimeAdapter,
	type StageRuntimeContext,
	type StageRuntimeStepContext,
	type ZylemRuntimeBufferViews,
	type ZylemRuntimeGameplay3DConfig,
	type ZylemRuntimePlatformer3DConfig,
	type ZylemRuntimeStaticBoxCollider,
} from '@zylem/game-lib/runtime';

import runtimeWasmUrl from '../../../zylem-runtime/target/wasm32-unknown-unknown/release/zylem_runtime.wasm?url';

/**
 * Static heightfield mirror for the wasm KCC. Pulled out of a
 * `ZylemPlane` entity's mesh builder via `buildPlatformerGroundHeightfield`.
 */
export interface PlatformerRuntimeHeightfield {
	rows: number;
	cols: number;
	heights: Float32Array;
	scale: [number, number, number];
	translation: [number, number, number];
	friction: number;
	restitution: number;
}

/** Capsule shape + spawn for the wasm-driven local player. */
export interface PlatformerRuntimeCapsule {
	position: [number, number, number];
	halfHeight: number;
	radius: number;
}

/**
 * Demo-friendly subset of the per-slot platformer config. Anything not
 * specified falls back to the third-person test's tuning, which mirrors
 * the legacy `Platformer3DBehavior` defaults.
 */
export type PlatformerRuntimeOpts = Partial<
	Omit<ZylemRuntimePlatformer3DConfig, 'slot'>
>;

const DEFAULT_PLATFORMER: Required<PlatformerRuntimeOpts> = {
	walkSpeed: 10,
	runSpeed: 20,
	jumpForce: 16,
	maxJumps: 4,
	gravity: 9.82,
	coyoteTime: 0.1,
	jumpBufferTime: 0.1,
	jumpCutMultiplier: 0.5,
	multiJumpWindow: 0.15,
	maxSlopeDeg: 50,
	autostepHeight: 0.3,
	snapToGround: 0.2,
};

/** Loose alias \u2014 demo player entities come back from `playgroundActor` / `createCharacterActor` typed as `any`. */
export type PlatformerRuntimePlayer = any;

export interface Platformer3DRuntimeAdapterOptions {
	/**
	 * The local player entity to drive. May be `null` at construction
	 * time (multi-player demos that spawn the local player lazily after
	 * lobby / network resolution). Wire it in later via
	 * {@link Platformer3DRuntimeAdapter.setPlayer}.
	 */
	player: PlatformerRuntimePlayer | null;
	capsule: PlatformerRuntimeCapsule;
	platformer?: PlatformerRuntimeOpts;
	staticColliders?: ZylemRuntimeStaticBoxCollider[];
	heightfield?: PlatformerRuntimeHeightfield | null;
}

/**
 * Player-only adapter that drives a single capsule body through the wasm
 * runtime's Gameplay3D mode. Static scenery (heightfield + boxes) is
 * mirrored into the wasm world so the KCC collides with the same shapes
 * the renderer shows.
 *
 * Networked demos keep remote players on TS Rapier (their poses are
 * driven by network setTranslation) \u2014 this adapter only owns the *local*
 * player.
 */
export class Platformer3DRuntimeAdapter implements StageRuntimeAdapter {
	private buffers: ZylemRuntimeBufferViews | null = null;
	private rotationY = 0;
	private player: PlatformerRuntimePlayer | null;
	private readonly capsule: PlatformerRuntimeCapsule;
	private readonly platformer: Required<PlatformerRuntimeOpts>;
	private readonly staticColliders: ZylemRuntimeStaticBoxCollider[];
	private readonly heightfield: PlatformerRuntimeHeightfield | null;

	constructor(opts: Platformer3DRuntimeAdapterOptions) {
		this.player = opts.player;
		this.capsule = opts.capsule;
		this.platformer = { ...DEFAULT_PLATFORMER, ...(opts.platformer ?? {}) };
		this.staticColliders = opts.staticColliders ?? [];
		this.heightfield = opts.heightfield ?? null;
	}

	/**
	 * Late-bind the local player after stage init. Networked demos use
	 * this when the local actor is only known once SpacetimeDB has
	 * confirmed the join. Calling more than once swaps the owned entity;
	 * the wasm session itself is not re-bootstrapped.
	 */
	setPlayer(player: PlatformerRuntimePlayer | null): void {
		this.player = player;
		if (player) {
			player.physicsAttached = false;
		}
	}

	ownsEntity(entity: PlatformerRuntimePlayer): boolean {
		return this.player !== null && entity === this.player;
	}

	rendersEntity(_entity: PlatformerRuntimePlayer): boolean {
		// FBX skinned mesh + animations render normally; only the *physics*
		// body is owned by the wasm runtime.
		return false;
	}

	registerEntity(entity: PlatformerRuntimePlayer): void {
		if (entity === this.player) {
			entity.physicsAttached = false;
		}
	}

	unregisterEntity(_entity: PlatformerRuntimePlayer): void {}

	async init(_context: StageRuntimeContext): Promise<void> {
		const buffers = await createZylemRuntimeSession(runtimeWasmUrl, 1, 1);

		if (this.heightfield) {
			addZylemRuntimeStaticHeightfieldCollider(
				buffers.exports,
				buffers.exports.memory,
				{
					rows: this.heightfield.rows,
					cols: this.heightfield.cols,
					heights: this.heightfield.heights,
					scale: this.heightfield.scale,
					translation: this.heightfield.translation,
					friction: this.heightfield.friction,
					restitution: this.heightfield.restitution,
				},
			);
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
					...this.platformer,
				},
			],
			staticColliders: this.staticColliders,
		};

		this.buffers = bootstrapZylemRuntimeGameplay3D(buffers, config);
		this.syncPlayerGroup();
	}

	getDebugRender(): { vertices: Float32Array; colors: Float32Array } | null {
		const buffers = this.buffers;
		if (!buffers) return null;
		const result = getZylemRuntimeGameplay3DDebugRender(
			buffers.exports,
			buffers.exports.memory,
		);
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

	/** Called from the player's `onUpdate` (which runs *before* `step`). */
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
	 * Visual yaw set by the demo. Stored separately so the next
	 * `syncPlayerGroup` applies it to `group.rotation.y` even when there
	 * is no movement input this frame.
	 */
	setFacing(yawRadians: number): void {
		this.rotationY = -yawRadians;
	}

	/**
	 * Teleport the slot to a world-space position. Used for fall-respawn
	 * in the arena demo and for placing the capsule when network state
	 * arrives after the adapter has already booted.
	 */
	teleport(x: number, y: number, z: number): void {
		const buffers = this.buffers;
		if (!buffers) return;
		setZylemRuntimeGameplay3DSlotPosition(buffers, 0, x, y, z);
	}

	/**
	 * Capsule centre position in world space, taken from the wasm input
	 * buffer (where the runtime mirrors `slot.position` after each step).
	 * Returns `null` until `init()` has bootstrapped the session.
	 */
	worldPosition(): { x: number; y: number; z: number } | null {
		const buffers = this.buffers;
		if (!buffers) return null;
		return {
			x: buffers.inputView[0]!,
			y: buffers.inputView[1]!,
			z: buffers.inputView[2]!,
		};
	}

	/**
	 * Reads the slot's position from the input buffer and applies it to
	 * the player entity's Three.js group along with the demo-tracked yaw.
	 *
	 * Rapier's capsule `position` is the *center* of the capsule, but FBX
	 * actor meshes have their origin at the feet. We shift the visual
	 * group down by `halfHeight + radius` so the rendered feet line up
	 * with the bottom of the collider.
	 */
	private syncPlayerGroup(): void {
		const buffers = this.buffers;
		const player = this.player;
		const group = player?.group;
		if (!buffers || !group) return;
		const x = buffers.inputView[0]!;
		const yCenter = buffers.inputView[1]!;
		const z = buffers.inputView[2]!;
		const yFeet = yCenter - (this.capsule.halfHeight + this.capsule.radius);
		group.position.set(x, yFeet, z);
		group.rotation.y = this.rotationY;
	}
}

/**
 * Extract a wasm heightfield from a `createPlane({ heightMap2D, ... })` or
 * `createPlane({ randomizeHeight: true, ... })` entity. Returns `null` if
 * the plane's mesh builder hasn't populated `heightData` yet (e.g. wrong
 * entity type) or if the flattened buffer doesn't match the resolved
 * subdivisions.
 */
export function buildPlatformerGroundHeightfield(
	groundPlane: any,
	overrides: { friction?: number; restitution?: number } = {},
): PlatformerRuntimeHeightfield | null {
	const builders = (groundPlane.options as any)?._builders;
	const meshBuilder = builders?.meshBuilder;
	const heights: Float32Array | undefined = meshBuilder?.heightData;
	if (!heights || heights.length === 0) return null;

	const planePos = groundPlane.options.position ?? { x: 0, y: 0, z: 0 };
	const planeTile = groundPlane.options.tile ?? { x: 100, y: 100 };

	// `PlaneMeshBuilder.postBuild` flattens heights as
	// `heights[xIdx * (subdivisionsZ + 1) + zIdx]` (outer X, inner Z).
	const subdivisionsX =
		meshBuilder?.subdivisionsX ?? Math.sqrt(heights.length) - 1;
	const subdivisionsZ =
		meshBuilder?.subdivisionsZ ?? Math.sqrt(heights.length) - 1;
	const expected = (subdivisionsX + 1) * (subdivisionsZ + 1);
	if (expected !== heights.length) return null;

	return {
		rows: subdivisionsX,
		cols: subdivisionsZ,
		// Snapshot so the wasm side has a stable copy independent of any
		// future builder rebuild.
		heights: new Float32Array(heights),
		scale: [planeTile.x, 1, planeTile.y],
		translation: [planePos.x, planePos.y, planePos.z],
		friction: overrides.friction ?? 0.95,
		restitution: overrides.restitution ?? 0,
	};
}

/**
 * Mirror a `createBox({ position, size, ... })` or
 * `createSphere({ position, radius, ... })` (or any entity exposing
 * `options.position` + either `options.size` or `options.radius`) into
 * the wasm static-box collider format.
 *
 * Spheres are approximated by their axis-aligned bounding box. This is
 * intentionally conservative \u2014 the KCC bumps off the corners of the
 * cube slightly outside the visual sphere \u2014 but it's good enough for
 * demo-quality static obstacles and avoids needing a sphere primitive
 * in the wasm runtime.
 *
 * Returns `null` if neither size nor radius is present.
 */
export function staticBoxFromEntity(
	entity: any,
	overrides: { friction?: number; restitution?: number } = {},
): ZylemRuntimeStaticBoxCollider | null {
	const pos = entity?.options?.position;
	if (!pos) return null;
	const size = entity?.options?.size;
	const radius = entity?.options?.radius;
	let halfExtents: [number, number, number];
	if (size) {
		halfExtents = [size.x / 2, size.y / 2, size.z / 2];
	} else if (typeof radius === 'number') {
		halfExtents = [radius, radius, radius];
	} else {
		return null;
	}
	return {
		center: [pos.x, pos.y, pos.z],
		halfExtents,
		friction: overrides.friction ?? 0.95,
		restitution: overrides.restitution,
	};
}

/**
 * Convenience wrapper for the demos: build a list of static box colliders
 * by calling {@link staticBoxFromEntity} on each entry and dropping
 * anything that returned `null`.
 */
export function staticBoxesFromEntities(
	entities: any[],
	overrides: { friction?: number; restitution?: number } = {},
): ZylemRuntimeStaticBoxCollider[] {
	const colliders: ZylemRuntimeStaticBoxCollider[] = [];
	for (const e of entities) {
		const c = staticBoxFromEntity(e, overrides);
		if (c) colliders.push(c);
	}
	return colliders;
}
