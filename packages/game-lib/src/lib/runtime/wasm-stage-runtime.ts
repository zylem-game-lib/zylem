/**
 * `WasmStageRuntime` — owns one wasm `WebAssembly.Instance` of `@zylem/runtime`
 * and exposes the unified-Stage FFI as a set of typed TypeScript methods.
 * Replaces the legacy {@link ZylemRuntimeStageAdapter} + {@link ZylemWorld}
 * pair; every `ZylemStage` instantiates exactly one `WasmStageRuntime`.
 *
 * The runtime is the single source of truth for per-frame physics state.
 * TS-side behaviors and visual layers (destructible-3d, particle-emitter,
 * screen-visibility) read transforms from the render buffer; sim-only
 * behaviors push their attach/query payload through the per-behavior
 * helpers exposed here.
 */

/** Sentinel handle for "no entity / failed allocation". Mirrors `INVALID_SLOT` in Rust. */
export const STAGE_INVALID_SLOT = 0xffffffff;

/** Fixed render-buffer stride in floats. Must match `STAGE_RENDER_STRIDE` in Rust. */
export const STAGE_RENDER_STRIDE = 12;

/** Fixed event-buffer stride in floats. Must match `STAGE_EVENT_STRIDE` in Rust. */
export const STAGE_EVENT_STRIDE = 6;

/** Fixed pose-scratch stride in floats. Must match `POSE_SCRATCH_LEN` in Rust. */
export const STAGE_POSE_LEN = 7;

export const enum StageBodyKind {
	Dynamic = 0,
	Static = 1,
	KinematicPosition = 2,
	KinematicVelocity = 3,
}

export const enum StageBoundaryDim {
	Two = 2,
	Three = 3,
}

export const enum StageRicochetDim {
	Two = 2,
	Three = 3,
}

export const enum StageRicochetReflection {
	Mirror = 0,
	Angled = 1,
}

export const enum StageTopDownPlane {
	Xy = 0,
	Xz = 1,
}

export const enum StageEventType {
	CollisionStarted = 1,
	CollisionStopped = 2,
	BoundaryHit = 3,
	Ricochet = 4,
	RegionEntered = 5,
	JumpStarted = 6,
	Landed = 7,
	Wrapped = 8,
	CooldownFired = 9,
}

export interface StageEvent {
	type: StageEventType;
	primarySlot: number | null;
	secondarySlot: number | null;
	payload: [number, number, number];
}

export interface StagePose {
	position: [number, number, number];
	rotation: [number, number, number, number];
}

/**
 * Decoded view of one entity's slot in the unified render buffer.
 *
 * Mirrors the `STAGE_RENDER_STRIDE` (12-float) packing documented in
 * `runtime/stage/render.rs`:
 * `[0..3]` position, `[3..7]` rotation xyzw, `[7]` uniform scale,
 * `[8..12]` custom0..custom3 (per-behavior shading hints).
 */
export interface StageRenderSlot {
	position: [number, number, number];
	rotation: [number, number, number, number];
	scale: number;
	custom: [number, number, number, number];
}

/**
 * Read a single entity slot out of a unified-Stage render buffer view.
 *
 * @param view   The `Float32Array` over wasm memory (e.g. `WasmStageRuntime.render`).
 * @param slot   The entity's wasm slot id (its `runtimeHandle`).
 * @param out    Optional target object to write into (avoids per-call allocation).
 * @returns The decoded slot, or `null` when the slot is out of range.
 */
export function readStageRenderSlot(
	view: Float32Array,
	slot: number,
	out?: StageRenderSlot,
): StageRenderSlot | null {
	const base = slot * STAGE_RENDER_STRIDE;
	if (slot < 0 || base + STAGE_RENDER_STRIDE > view.length) {
		return null;
	}
	const result: StageRenderSlot = out ?? {
		position: [0, 0, 0],
		rotation: [0, 0, 0, 1],
		scale: 1,
		custom: [0, 0, 0, 0],
	};
	result.position[0] = view[base]!;
	result.position[1] = view[base + 1]!;
	result.position[2] = view[base + 2]!;
	result.rotation[0] = view[base + 3]!;
	result.rotation[1] = view[base + 4]!;
	result.rotation[2] = view[base + 5]!;
	result.rotation[3] = view[base + 6]!;
	// A freshly-zeroed slot reports scale 0; treat that as the identity scale so
	// entities aren't collapsed before the runtime writes a real value.
	const scale = view[base + 7]!;
	result.scale = scale === 0 ? 1 : scale;
	result.custom[0] = view[base + 8]!;
	result.custom[1] = view[base + 9]!;
	result.custom[2] = view[base + 10]!;
	result.custom[3] = view[base + 11]!;
	return result;
}

export interface StageBodyConfig {
	kind: StageBodyKind;
	position: readonly [number, number, number];
	rotation: readonly [number, number, number, number];
	linearDamping: number;
	angularDamping: number;
	gravityScale: number;
	canSleep: boolean;
	ccdEnabled: boolean;
	lockRotation: readonly [boolean, boolean, boolean];
	lockTranslation: readonly [boolean, boolean, boolean];
}

export type StageColliderShape =
	| { type: 'box'; halfExtents: readonly [number, number, number] }
	| { type: 'sphere'; radius: number }
	| { type: 'capsule'; halfHeight: number; radius: number }
	| { type: 'cylinder'; halfHeight: number; radius: number }
	| { type: 'convexHull'; vertices: Float32Array }
	| { type: 'trimesh'; vertices: Float32Array; indices: Uint32Array }
	| {
		type: 'heightfield';
		rows: number;
		cols: number;
		scale: readonly [number, number, number];
		heights: Float32Array;
	};

export interface StageColliderConfig {
	shape: StageColliderShape;
	offset: readonly [number, number, number];
	friction: number;
	restitution: number;
	sensor: boolean;
	/** Packed Rapier interaction-groups: high 16 bits = membership, low 16 bits = filter. */
	collisionGroups: number;
}

/** Minimal exports surface used by `WasmStageRuntime`. Mirrors `stage_ffi.rs`. */
export interface StageWasmExports {
	readonly memory: WebAssembly.Memory;
	zylem_stage_create(initialCapacity: number): number;
	zylem_stage_destroy(): void;
	zylem_stage_set_gravity(x: number, y: number, z: number): void;
	zylem_stage_step(dt: number): number;
	zylem_stage_active_count(): number;
	zylem_stage_capacity(): number;
	zylem_stage_tick_count(): number;

	zylem_stage_create_entity(): number;
	zylem_stage_destroy_entity(slot: number): number;

	zylem_stage_attach_body(
		slot: number,
		kind: number,
		px: number, py: number, pz: number,
		rx: number, ry: number, rz: number, rw: number,
		linearDamping: number,
		angularDamping: number,
		gravityScale: number,
		canSleep: number,
		ccdEnabled: number,
		lockRotX: number, lockRotY: number, lockRotZ: number,
		lockTransX: number, lockTransY: number, lockTransZ: number,
	): number;

	zylem_stage_add_collider_box(
		slot: number,
		hx: number, hy: number, hz: number,
		ox: number, oy: number, oz: number,
		friction: number, restitution: number,
		sensor: number, collisionGroups: number,
	): number;
	zylem_stage_add_collider_sphere(
		slot: number,
		radius: number,
		ox: number, oy: number, oz: number,
		friction: number, restitution: number,
		sensor: number, collisionGroups: number,
	): number;
	zylem_stage_add_collider_capsule(
		slot: number,
		halfHeight: number, radius: number,
		ox: number, oy: number, oz: number,
		friction: number, restitution: number,
		sensor: number, collisionGroups: number,
	): number;
	zylem_stage_add_collider_cylinder(
		slot: number,
		halfHeight: number, radius: number,
		ox: number, oy: number, oz: number,
		friction: number, restitution: number,
		sensor: number, collisionGroups: number,
	): number;
	zylem_stage_add_collider_convex_hull(
		slot: number,
		vertexOffset: number, vertexCount: number,
		ox: number, oy: number, oz: number,
		friction: number, restitution: number,
		sensor: number, collisionGroups: number,
	): number;
	zylem_stage_add_collider_trimesh(
		slot: number,
		vertexOffset: number, vertexCount: number,
		indexOffset: number, indexCount: number,
		ox: number, oy: number, oz: number,
		friction: number, restitution: number,
		sensor: number, collisionGroups: number,
	): number;
	zylem_stage_add_collider_heightfield(
		slot: number,
		rows: number, cols: number,
		sx: number, sy: number, sz: number,
		heightOffset: number,
		px: number, py: number, pz: number,
		friction: number, restitution: number,
		collisionGroups: number,
	): number;

	zylem_stage_get_pose(slot: number): number;
	zylem_stage_pose_ptr(): number;
	zylem_stage_pose_len(): number;
	zylem_stage_set_position(slot: number, x: number, y: number, z: number): number;
	zylem_stage_set_rotation(slot: number, x: number, y: number, z: number, w: number): number;
	zylem_stage_set_linvel(slot: number, x: number, y: number, z: number): number;
	zylem_stage_get_linvel(slot: number): number;
	zylem_stage_set_angvel(slot: number, x: number, y: number, z: number): number;
	zylem_stage_apply_impulse(slot: number, x: number, y: number, z: number): number;
	zylem_stage_vec3_ptr(): number;

	zylem_stage_render_ptr(): number;
	zylem_stage_render_len(): number;
	zylem_stage_render_stride(): number;

	zylem_stage_event_ptr(): number;
	zylem_stage_event_len(): number;
	zylem_stage_event_count(): number;
	zylem_stage_event_stride(): number;

	zylem_stage_query_ptr(): number;
	zylem_stage_query_len(): number;

	zylem_stage_scratch_ptr(): number;
	zylem_stage_scratch_capacity(): number;

	// Behavior-specific
	zylem_stage_attach_cooldown(slot: number): number;
	zylem_stage_cooldown_register(slot: number, id: number, duration: number, immediate: number): number;
	zylem_stage_cooldown_fire(slot: number, id: number): number;
	zylem_stage_cooldown_reset(slot: number, id: number): number;
	zylem_stage_cooldown_remaining(slot: number, id: number): number;

	zylem_stage_attach_world_boundary(
		slot: number, dim: number,
		top: number, bottom: number, left: number, right: number,
		front: number, back: number, padding: number,
	): number;
	zylem_stage_query_world_boundary(slot: number): number;

	zylem_stage_attach_screen_wrap(
		slot: number, width: number, height: number,
		centerX: number, centerY: number, edgeThreshold: number,
	): number;
	zylem_stage_query_screen_wrap(slot: number): number;

	zylem_stage_attach_ricochet(
		slot: number, dim: number,
		minSpeed: number, maxSpeed: number, speedMultiplier: number,
		maxAngleDeg: number, reflectionMode: number,
	): number;
	zylem_stage_query_ricochet(slot: number): number;

	zylem_stage_attach_thruster(
		slot: number, maxSpeed: number, acceleration: number,
		turnRateRadS: number, linearDamping: number,
	): number;
	zylem_stage_set_thruster_input(slot: number, thrust: number, turn: number): void;
	zylem_stage_query_thruster(slot: number): number;

	zylem_stage_attach_top_down(slot: number, plane: number, speed: number, faceMovement: number): number;
	zylem_stage_set_top_down_input(slot: number, a: number, b: number): void;

	zylem_stage_attach_jumper_2d(
		slot: number, jumpForce: number, maxJumps: number,
		jumpBufferTime: number, coyoteTime: number, gravity: number,
	): number;
	zylem_stage_set_jumper_2d_input(slot: number, jumpPressed: number): void;
	zylem_stage_query_jumper_2d(slot: number): number;

	zylem_stage_attach_jumper_3d(slot: number, jumpForce: number, maxJumps: number, gravity: number): number;
	zylem_stage_set_jumper_3d_input(slot: number, jump: number): void;
	zylem_stage_query_jumper_3d(slot: number): number;

	zylem_stage_attach_shooter_2d(
		slot: number, fireRateHz: number,
		muzzleOffsetX: number, muzzleOffsetY: number, muzzleSpeed: number,
	): number;
	zylem_stage_shooter_2d_fire(slot: number, x: number, y: number, z: number, yaw: number): number;
	zylem_stage_query_shooter_2d(slot: number): number;

	zylem_stage_attach_platformer_3d(
		slot: number, halfHeight: number, radius: number,
		walkSpeed: number, runSpeed: number, jumpForce: number,
		maxJumps: number, gravity: number,
	): number;
	zylem_stage_set_platformer_3d_input_axes(slot: number, moveX: number, moveZ: number): void;
	zylem_stage_set_platformer_3d_input_buttons(slot: number, jump: number, run: number): void;
	zylem_stage_query_platformer_3d(slot: number): number;

	zylem_stage_attach_first_person(
		slot: number, walkSpeed: number, runSpeed: number,
		eyeHeight: number, lookSensitivity: number,
	): number;
	zylem_stage_set_first_person_input(
		slot: number, moveX: number, moveZ: number,
		lookYaw: number, lookPitch: number, run: number,
	): void;
	zylem_stage_query_first_person(slot: number): number;

	zylem_stage_invalid_slot(): number;
}

/** Default options for `createWasmStageRuntime`. */
export interface WasmStageRuntimeOptions {
	initialCapacity?: number;
	gravity?: readonly [number, number, number];
	imports?: WebAssembly.Imports;
}

/**
 * Owns the wasm instance plus the live float-views over its render / event /
 * pose / scratch buffers. The instance is per-`ZylemStage`; each stage gets
 * its own `WebAssembly.Instance` so the singleton inside `stage_ffi.rs`
 * stays single-stage scoped (today's `thread_local!` contract).
 */
export class WasmStageRuntime {
	readonly exports: StageWasmExports;
	private readonly memory: WebAssembly.Memory;
	private renderView: Float32Array = new Float32Array(0);
	private eventView: Float32Array = new Float32Array(0);
	private poseView: Float32Array = new Float32Array(0);
	private vec3View: Float32Array = new Float32Array(0);
	private queryView: Float32Array = new Float32Array(0);
	private scratchView: Float32Array = new Float32Array(0);

	constructor(exports: StageWasmExports, options: WasmStageRuntimeOptions = {}) {
		this.exports = exports;
		this.memory = exports.memory;
		const capacity = Math.max(options.initialCapacity ?? 64, 8);
		exports.zylem_stage_create(capacity);
		if (options.gravity) {
			exports.zylem_stage_set_gravity(
				options.gravity[0],
				options.gravity[1],
				options.gravity[2],
			);
		}
		this.refreshViews();
	}

	/** Recreate typed views over wasm memory. Call after step() or whenever memory may have grown. */
	refreshViews(): void {
		const buffer = this.memory.buffer;
		const renderPtr = this.exports.zylem_stage_render_ptr();
		const renderLen = this.exports.zylem_stage_render_len();
		const eventPtr = this.exports.zylem_stage_event_ptr();
		const eventLen = this.exports.zylem_stage_event_len();
		const posePtr = this.exports.zylem_stage_pose_ptr();
		const poseLen = this.exports.zylem_stage_pose_len();
		const vec3Ptr = this.exports.zylem_stage_vec3_ptr();
		const queryPtr = this.exports.zylem_stage_query_ptr();
		const queryLen = this.exports.zylem_stage_query_len();
		const scratchPtr = this.exports.zylem_stage_scratch_ptr();
		const scratchCap = this.exports.zylem_stage_scratch_capacity();

		this.renderView = renderLen > 0 ? new Float32Array(buffer, renderPtr, renderLen) : new Float32Array(0);
		this.eventView = eventLen > 0 ? new Float32Array(buffer, eventPtr, eventLen) : new Float32Array(0);
		this.poseView = poseLen > 0 ? new Float32Array(buffer, posePtr, poseLen) : new Float32Array(0);
		this.vec3View = vec3Ptr !== 0 ? new Float32Array(buffer, vec3Ptr, 3) : new Float32Array(0);
		this.queryView = queryLen > 0 ? new Float32Array(buffer, queryPtr, queryLen) : new Float32Array(0);
		this.scratchView = scratchCap > 0 ? new Float32Array(buffer, scratchPtr, scratchCap) : new Float32Array(0);
	}

	/** Step the simulation by `dt` seconds. Refreshes views afterwards. */
	step(dt: number): number {
		const active = this.exports.zylem_stage_step(dt);
		this.refreshViews();
		return active;
	}

	dispose(): void {
		this.exports.zylem_stage_destroy();
	}

	get tickCount(): number {
		return this.exports.zylem_stage_tick_count() >>> 0;
	}

	get activeCount(): number {
		return this.exports.zylem_stage_active_count() >>> 0;
	}

	setGravity(x: number, y: number, z: number): void {
		this.exports.zylem_stage_set_gravity(x, y, z);
	}

	// ─── Entity lifecycle ───────────────────────────────────────────────

	createEntity(): number {
		const slot = this.exports.zylem_stage_create_entity() >>> 0;
		// The wasm may have grown memory while resizing the slot table; refresh views.
		this.refreshViews();
		return slot;
	}

	destroyEntity(slot: number): boolean {
		return this.exports.zylem_stage_destroy_entity(slot) !== 0;
	}

	// ─── Body / collider attach ────────────────────────────────────────

	attachBody(slot: number, config: StageBodyConfig): boolean {
		const ok = this.exports.zylem_stage_attach_body(
			slot,
			config.kind,
			config.position[0], config.position[1], config.position[2],
			config.rotation[0], config.rotation[1], config.rotation[2], config.rotation[3],
			config.linearDamping,
			config.angularDamping,
			config.gravityScale,
			config.canSleep ? 1 : 0,
			config.ccdEnabled ? 1 : 0,
			config.lockRotation[0] ? 1 : 0, config.lockRotation[1] ? 1 : 0, config.lockRotation[2] ? 1 : 0,
			config.lockTranslation[0] ? 1 : 0, config.lockTranslation[1] ? 1 : 0, config.lockTranslation[2] ? 1 : 0,
		);
		return ok !== 0;
	}

	addCollider(slot: number, config: StageColliderConfig): boolean {
		const offset = config.offset;
		const sensor = config.sensor ? 1 : 0;
		const groups = config.collisionGroups >>> 0;
		const friction = config.friction;
		const restitution = config.restitution;
		switch (config.shape.type) {
			case 'box': {
				const [hx, hy, hz] = config.shape.halfExtents;
				return (
					this.exports.zylem_stage_add_collider_box(
						slot, hx, hy, hz, offset[0], offset[1], offset[2],
						friction, restitution, sensor, groups,
					) !== 0
				);
			}
			case 'sphere': {
				return (
					this.exports.zylem_stage_add_collider_sphere(
						slot, config.shape.radius, offset[0], offset[1], offset[2],
						friction, restitution, sensor, groups,
					) !== 0
				);
			}
			case 'capsule': {
				return (
					this.exports.zylem_stage_add_collider_capsule(
						slot, config.shape.halfHeight, config.shape.radius,
						offset[0], offset[1], offset[2], friction, restitution, sensor, groups,
					) !== 0
				);
			}
			case 'cylinder': {
				return (
					this.exports.zylem_stage_add_collider_cylinder(
						slot, config.shape.halfHeight, config.shape.radius,
						offset[0], offset[1], offset[2], friction, restitution, sensor, groups,
					) !== 0
				);
			}
			case 'convexHull': {
				const verts = config.shape.vertices;
				if (verts.length % 3 !== 0) return false;
				const offsetFloats = this.stageScratch(verts);
				return (
					this.exports.zylem_stage_add_collider_convex_hull(
						slot, offsetFloats, verts.length / 3,
						offset[0], offset[1], offset[2], friction, restitution, sensor, groups,
					) !== 0
				);
			}
			case 'trimesh': {
				const verts = config.shape.vertices;
				const indices = config.shape.indices;
				if (verts.length % 3 !== 0 || indices.length % 3 !== 0) return false;
				const vertOffset = this.stageScratch(verts);
				const indexOffset = this.stageScratchIndices(indices, vertOffset + verts.length);
				return (
					this.exports.zylem_stage_add_collider_trimesh(
						slot, vertOffset, verts.length / 3, indexOffset, indices.length,
						offset[0], offset[1], offset[2], friction, restitution, sensor, groups,
					) !== 0
				);
			}
			case 'heightfield': {
				const heights = config.shape.heights;
				const heightOffset = this.stageScratch(heights);
				return (
					this.exports.zylem_stage_add_collider_heightfield(
						slot, config.shape.rows, config.shape.cols,
						config.shape.scale[0], config.shape.scale[1], config.shape.scale[2],
						heightOffset, offset[0], offset[1], offset[2],
						friction, restitution, groups,
					) !== 0
				);
			}
			default: {
				const _exhaustive: never = config.shape;
				void _exhaustive;
				return false;
			}
		}
	}

	private stageScratch(values: Float32Array, baseOffset = 0): number {
		this.scratchView.set(values, baseOffset);
		return baseOffset;
	}

	private stageScratchIndices(indices: Uint32Array, baseOffset: number): number {
		for (let i = 0; i < indices.length; i++) {
			this.scratchView[baseOffset + i] = indices[i]!;
		}
		return baseOffset;
	}

	// ─── Pose / velocity ───────────────────────────────────────────────

	getPose(slot: number, out?: StagePose): StagePose | null {
		const ok = this.exports.zylem_stage_get_pose(slot) !== 0;
		if (!ok) return null;
		const v = this.poseView;
		const result: StagePose = out ?? {
			position: [0, 0, 0],
			rotation: [0, 0, 0, 1],
		};
		result.position[0] = v[0]!;
		result.position[1] = v[1]!;
		result.position[2] = v[2]!;
		result.rotation[0] = v[3]!;
		result.rotation[1] = v[4]!;
		result.rotation[2] = v[5]!;
		result.rotation[3] = v[6]!;
		return result;
	}

	setPosition(slot: number, x: number, y: number, z: number): boolean {
		return this.exports.zylem_stage_set_position(slot, x, y, z) !== 0;
	}

	setRotation(slot: number, x: number, y: number, z: number, w: number): boolean {
		return this.exports.zylem_stage_set_rotation(slot, x, y, z, w) !== 0;
	}

	setLinearVelocity(slot: number, x: number, y: number, z: number): boolean {
		return this.exports.zylem_stage_set_linvel(slot, x, y, z) !== 0;
	}

	getLinearVelocity(slot: number, out?: [number, number, number]): [number, number, number] | null {
		if (this.exports.zylem_stage_get_linvel(slot) === 0) return null;
		const v = this.vec3View;
		const result = out ?? ([0, 0, 0] as [number, number, number]);
		result[0] = v[0]!;
		result[1] = v[1]!;
		result[2] = v[2]!;
		return result;
	}

	setAngularVelocity(slot: number, x: number, y: number, z: number): boolean {
		return this.exports.zylem_stage_set_angvel(slot, x, y, z) !== 0;
	}

	applyImpulse(slot: number, x: number, y: number, z: number): boolean {
		return this.exports.zylem_stage_apply_impulse(slot, x, y, z) !== 0;
	}

	// ─── Render / event reads ──────────────────────────────────────────

	/** Read-only view over the render buffer; one slot occupies {@link STAGE_RENDER_STRIDE} floats. */
	get render(): Float32Array {
		return this.renderView;
	}

	get renderStride(): number {
		return STAGE_RENDER_STRIDE;
	}

	/**
	 * Decode a single entity slot from the live render buffer. Convenience
	 * wrapper over {@link readStageRenderSlot} bound to this runtime's view.
	 */
	readRenderSlot(slot: number, out?: StageRenderSlot): StageRenderSlot | null {
		return readStageRenderSlot(this.renderView, slot, out);
	}

	/** Drain the wasm event buffer into a fresh array of typed events. */
	drainEvents(): StageEvent[] {
		const count = this.exports.zylem_stage_event_count() >>> 0;
		if (count === 0) return [];
		const view = this.eventView;
		const events: StageEvent[] = new Array(count);
		for (let i = 0; i < count; i++) {
			const base = i * STAGE_EVENT_STRIDE;
			const primaryRaw = view[base + 1]!;
			const secondaryRaw = view[base + 2]!;
			events[i] = {
				type: (view[base]! | 0) as StageEventType,
				primarySlot: Number.isNaN(primaryRaw) ? null : primaryRaw >>> 0,
				secondarySlot: Number.isNaN(secondaryRaw) ? null : secondaryRaw >>> 0,
				payload: [view[base + 3]!, view[base + 4]!, view[base + 5]!],
			};
		}
		return events;
	}

	// ─── Behavior helpers ─────────────────────────────────────────────

	get queryScratch(): Float32Array {
		return this.queryView;
	}

	attachCooldown(slot: number): boolean {
		return this.exports.zylem_stage_attach_cooldown(slot) !== 0;
	}

	registerCooldown(slot: number, id: number, durationSeconds: number, immediate = false): boolean {
		return (
			this.exports.zylem_stage_cooldown_register(slot, id >>> 0, durationSeconds, immediate ? 1 : 0) !== 0
		);
	}

	fireCooldown(slot: number, id: number): boolean {
		return this.exports.zylem_stage_cooldown_fire(slot, id >>> 0) !== 0;
	}

	resetCooldown(slot: number, id: number): boolean {
		return this.exports.zylem_stage_cooldown_reset(slot, id >>> 0) !== 0;
	}

	cooldownRemaining(slot: number, id: number): number {
		return this.exports.zylem_stage_cooldown_remaining(slot, id >>> 0);
	}

	attachWorldBoundary(
		slot: number,
		dim: StageBoundaryDim,
		bounds: { top: number; bottom: number; left: number; right: number; front: number; back: number; padding?: number },
	): boolean {
		return (
			this.exports.zylem_stage_attach_world_boundary(
				slot,
				dim,
				bounds.top, bounds.bottom, bounds.left, bounds.right,
				bounds.front, bounds.back, bounds.padding ?? 0,
			) !== 0
		);
	}

	queryWorldBoundary(slot: number): { hits: number; clamped: [number, number, number] } | null {
		if (this.exports.zylem_stage_query_world_boundary(slot) === 0) return null;
		const v = this.queryView;
		return {
			hits: v[0]! | 0,
			clamped: [v[1]!, v[2]!, v[3]!],
		};
	}

	attachScreenWrap(
		slot: number,
		opts: { width: number; height: number; centerX?: number; centerY?: number; edgeThreshold?: number },
	): boolean {
		return (
			this.exports.zylem_stage_attach_screen_wrap(
				slot, opts.width, opts.height,
				opts.centerX ?? 0, opts.centerY ?? 0, opts.edgeThreshold ?? 0,
			) !== 0
		);
	}

	queryScreenWrap(slot: number): { fsm: number; lastWrappedAxes: number } | null {
		if (this.exports.zylem_stage_query_screen_wrap(slot) === 0) return null;
		const v = this.queryView;
		return { fsm: v[0]! | 0, lastWrappedAxes: v[1]! | 0 };
	}

	attachRicochet(
		slot: number,
		dim: StageRicochetDim,
		opts: { minSpeed: number; maxSpeed: number; speedMultiplier: number; maxAngleDeg: number; reflectionMode: StageRicochetReflection },
	): boolean {
		return (
			this.exports.zylem_stage_attach_ricochet(
				slot, dim, opts.minSpeed, opts.maxSpeed, opts.speedMultiplier,
				opts.maxAngleDeg, opts.reflectionMode,
			) !== 0
		);
	}

	queryRicochet(slot: number): { bounces: number; lastKind: number } | null {
		if (this.exports.zylem_stage_query_ricochet(slot) === 0) return null;
		const v = this.queryView;
		return { bounces: v[0]! | 0, lastKind: v[1]! | 0 };
	}

	attachThruster(
		slot: number,
		opts: { maxSpeed: number; acceleration: number; turnRateRadPerSec: number; linearDamping: number },
	): boolean {
		return (
			this.exports.zylem_stage_attach_thruster(
				slot, opts.maxSpeed, opts.acceleration, opts.turnRateRadPerSec, opts.linearDamping,
			) !== 0
		);
	}

	setThrusterInput(slot: number, thrust: number, turn: number): void {
		this.exports.zylem_stage_set_thruster_input(slot, thrust, turn);
	}

	queryThruster(slot: number): { headingRad: number; speed: number } | null {
		if (this.exports.zylem_stage_query_thruster(slot) === 0) return null;
		const v = this.queryView;
		return { headingRad: v[0]!, speed: v[1]! };
	}

	attachTopDown(slot: number, opts: { plane: StageTopDownPlane; speed: number; faceMovement?: boolean }): boolean {
		return this.exports.zylem_stage_attach_top_down(slot, opts.plane, opts.speed, opts.faceMovement ? 1 : 0) !== 0;
	}

	setTopDownInput(slot: number, axisA: number, axisB: number): void {
		this.exports.zylem_stage_set_top_down_input(slot, axisA, axisB);
	}

	attachJumper2D(
		slot: number,
		opts: { jumpForce: number; maxJumps: number; jumpBufferTime: number; coyoteTime: number; gravity: number },
	): boolean {
		return (
			this.exports.zylem_stage_attach_jumper_2d(
				slot, opts.jumpForce, opts.maxJumps >>> 0,
				opts.jumpBufferTime, opts.coyoteTime, opts.gravity,
			) !== 0
		);
	}

	setJumper2DInput(slot: number, jumpPressed: boolean): void {
		this.exports.zylem_stage_set_jumper_2d_input(slot, jumpPressed ? 1 : 0);
	}

	queryJumper2D(slot: number): { grounded: boolean; jumpCount: number; coyote: number; jumpBuffer: number } | null {
		if (this.exports.zylem_stage_query_jumper_2d(slot) === 0) return null;
		const v = this.queryView;
		return {
			grounded: v[0]! > 0.5,
			jumpCount: v[1]! | 0,
			coyote: v[2]!,
			jumpBuffer: v[3]!,
		};
	}

	attachJumper3D(slot: number, opts: { jumpForce: number; maxJumps: number; gravity: number }): boolean {
		return this.exports.zylem_stage_attach_jumper_3d(slot, opts.jumpForce, opts.maxJumps >>> 0, opts.gravity) !== 0;
	}

	setJumper3DInput(slot: number, jump: boolean): void {
		this.exports.zylem_stage_set_jumper_3d_input(slot, jump ? 1 : 0);
	}

	queryJumper3D(slot: number): { grounded: boolean; jumpCount: number; verticalVelocity: number } | null {
		if (this.exports.zylem_stage_query_jumper_3d(slot) === 0) return null;
		const v = this.queryView;
		return { grounded: v[0]! > 0.5, jumpCount: v[1]! | 0, verticalVelocity: v[2]! };
	}

	attachShooter2D(
		slot: number,
		opts: { fireRateHz: number; muzzleOffsetX: number; muzzleOffsetY: number; muzzleSpeed: number },
	): boolean {
		return (
			this.exports.zylem_stage_attach_shooter_2d(
				slot, opts.fireRateHz, opts.muzzleOffsetX, opts.muzzleOffsetY, opts.muzzleSpeed,
			) !== 0
		);
	}

	fireShooter2D(slot: number, x: number, y: number, z: number, yaw: number): boolean {
		return this.exports.zylem_stage_shooter_2d_fire(slot, x, y, z, yaw) !== 0;
	}

	queryShooter2D(slot: number): { cooldown: number; firedCount: number } | null {
		if (this.exports.zylem_stage_query_shooter_2d(slot) === 0) return null;
		const v = this.queryView;
		return { cooldown: v[0]!, firedCount: v[1]! | 0 };
	}

	attachPlatformer3D(
		slot: number,
		opts: { halfHeight: number; radius: number; walkSpeed: number; runSpeed: number; jumpForce: number; maxJumps: number; gravity: number },
	): boolean {
		return (
			this.exports.zylem_stage_attach_platformer_3d(
				slot, opts.halfHeight, opts.radius,
				opts.walkSpeed, opts.runSpeed, opts.jumpForce,
				opts.maxJumps >>> 0, opts.gravity,
			) !== 0
		);
	}

	setPlatformer3DInputAxes(slot: number, moveX: number, moveZ: number): void {
		this.exports.zylem_stage_set_platformer_3d_input_axes(slot, moveX, moveZ);
	}

	setPlatformer3DInputButtons(slot: number, jump: boolean, run: boolean): void {
		this.exports.zylem_stage_set_platformer_3d_input_buttons(slot, jump ? 1 : 0, run ? 1 : 0);
	}

	queryPlatformer3D(slot: number): { grounded: boolean; jumpCount: number; fsmState: number; speed: number } | null {
		if (this.exports.zylem_stage_query_platformer_3d(slot) === 0) return null;
		const v = this.queryView;
		return {
			grounded: v[0]! > 0.5,
			jumpCount: v[1]! | 0,
			fsmState: v[2]! | 0,
			speed: v[3]!,
		};
	}

	attachFirstPerson(
		slot: number,
		opts: { walkSpeed: number; runSpeed: number; eyeHeight: number; lookSensitivity: number },
	): boolean {
		return (
			this.exports.zylem_stage_attach_first_person(
				slot, opts.walkSpeed, opts.runSpeed, opts.eyeHeight, opts.lookSensitivity,
			) !== 0
		);
	}

	setFirstPersonInput(
		slot: number,
		opts: { moveX: number; moveZ: number; lookYawDelta: number; lookPitchDelta: number; run: boolean },
	): void {
		this.exports.zylem_stage_set_first_person_input(
			slot, opts.moveX, opts.moveZ, opts.lookYawDelta, opts.lookPitchDelta, opts.run ? 1 : 0,
		);
	}

	queryFirstPerson(slot: number): { yaw: number; pitch: number; speed: number; eyeHeight: number } | null {
		if (this.exports.zylem_stage_query_first_person(slot) === 0) return null;
		const v = this.queryView;
		return { yaw: v[0]!, pitch: v[1]!, speed: v[2]!, eyeHeight: v[3]! };
	}
}

/** Loads + instantiates a wasm module and constructs a `WasmStageRuntime`. */
export async function createWasmStageRuntime(
	source: RequestInfo | URL | ArrayBuffer,
	options: WasmStageRuntimeOptions = {},
): Promise<WasmStageRuntime> {
	let bytes: ArrayBuffer;
	if (source instanceof ArrayBuffer) {
		bytes = source;
	} else {
		const response = await fetch(source);
		bytes = await response.arrayBuffer();
	}
	const { instance } = await WebAssembly.instantiate(bytes, options.imports ?? {});
	const exports = instance.exports as unknown as StageWasmExports;
	return new WasmStageRuntime(exports, options);
}
