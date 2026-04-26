/**
 * Helpers for the `@zylem/runtime` wasm module: batched Float32 input/render/summary buffers.
 * Consumers bundle the `.wasm` file (e.g. Vite `?url`) and pass bytes or a fetch URL to {@link loadZylemRuntimeWasm}.
 */

/** Matches `INPUT_STRIDE` in `zylem-runtime` Rust. */
export const ZYLEM_RUNTIME_INPUT_STRIDE = 9;
/** Matches `RENDER_STRIDE` in `zylem-runtime` Rust. */
export const ZYLEM_RUNTIME_RENDER_STRIDE = 12;
/** Matches `SUMMARY_LEN` in `zylem-runtime` Rust. */
export const ZYLEM_RUNTIME_SUMMARY_LEN = 6;

export interface ZylemRuntimeExports {
	readonly memory: WebAssembly.Memory;
	zylem_runtime_init(capacity: number, initialActive: number): number;
	zylem_runtime_clear_static_box_colliders(): void;
	zylem_runtime_add_static_box_collider(
		centerX: number,
		centerY: number,
		centerZ: number,
		halfExtentX: number,
		halfExtentY: number,
		halfExtentZ: number,
		friction: number,
		restitution: number,
	): void;
	zylem_runtime_bootstrap_instancing(
		halfExtentX: number,
		halfExtentY: number,
		halfExtentZ: number,
	): number;
	zylem_runtime_gameplay2d_clear_config(): void;
	zylem_runtime_gameplay2d_set_world_bounds(
		left: number,
		right: number,
		bottom: number,
		top: number,
	): void;
	zylem_runtime_configure_dynamic_circle_body2d(
		slot: number,
		radius: number,
		initialVelocityX: number,
		initialVelocityY: number,
		minSpeed: number,
		maxSpeed: number,
		speedMultiplier: number,
		maxAngleDeg: number,
		reflectionMode: number,
		usesBoundary2d: number,
		usesRicochet2d: number,
	): number;
	zylem_runtime_configure_kinematic_aabb_body2d(
		slot: number,
		playerIndex: number,
		speed: number,
		halfWidth: number,
		halfHeight: number,
	): number;
	zylem_runtime_gameplay2d_add_trigger_aabb(
		triggerId: number,
		centerX: number,
		centerY: number,
		centerZ: number,
		halfWidth: number,
		halfHeight: number,
	): void;
	zylem_runtime_bootstrap_gameplay2d(): number;
	zylem_runtime_gameplay2d_set_input_axis(playerIndex: number, vertical: number): void;
	zylem_runtime_gameplay2d_set_slot_position(slot: number, x: number, y: number, z: number): void;
	zylem_runtime_gameplay2d_set_slot_velocity(slot: number, x: number, y: number): void;
	zylem_runtime_step(dt: number): number;
	zylem_runtime_active_count(): number;
	zylem_runtime_tick_count(): number;
	zylem_runtime_activate_next(): number;
	zylem_runtime_input_stride(): number;
	zylem_runtime_render_stride(): number;
	zylem_runtime_summary_len(): number;
	zylem_runtime_input_ptr(): number;
	zylem_runtime_input_len(): number;
	zylem_runtime_render_ptr(): number;
	zylem_runtime_render_len(): number;
	zylem_runtime_summary_ptr(): number;
	zylem_runtime_summary_buffer_len(): number;
	zylem_runtime_event_stride(): number;
	zylem_runtime_event_ptr(): number;
	zylem_runtime_event_len(): number;
	zylem_runtime_event_count(): number;
	zylem_runtime_gameplay3d_clear_config(): void;
	zylem_runtime_configure_platformer_capsule_body3d(
		slot: number,
		halfHeight: number,
		radius: number,
	): number;
	zylem_runtime_configure_platformer_3d(
		slot: number,
		walkSpeed: number,
		runSpeed: number,
		jumpForce: number,
		maxJumps: number,
		gravity: number,
		coyoteTime: number,
		jumpBufferTime: number,
		jumpCutMultiplier: number,
		multiJumpWindow: number,
		maxSlopeDeg: number,
		autostepHeight: number,
		snapToGround: number,
	): number;
	zylem_runtime_bootstrap_gameplay3d(): number;
	zylem_runtime_gameplay3d_set_input_axes(slot: number, moveX: number, moveZ: number): void;
	zylem_runtime_gameplay3d_set_input_buttons(slot: number, jump: number, run: number): void;
	zylem_runtime_gameplay3d_set_slot_position(slot: number, x: number, y: number, z: number): void;
	zylem_runtime_gameplay3d_grounded(slot: number): number;
	zylem_runtime_gameplay3d_jump_count(slot: number): number;
	zylem_runtime_gameplay3d_state(slot: number): number;
	zylem_runtime_gameplay3d_event_ptr(): number;
	zylem_runtime_gameplay3d_event_len(): number;
	zylem_runtime_gameplay3d_event_count(): number;
	zylem_runtime_heightfield_scratch_ptr(): number;
	zylem_runtime_heightfield_scratch_capacity(): number;
	zylem_runtime_clear_static_heightfield_colliders(): void;
	zylem_runtime_add_static_heightfield_collider(
		rows: number,
		cols: number,
		heightsLen: number,
		scaleX: number,
		scaleY: number,
		scaleZ: number,
		translationX: number,
		translationY: number,
		translationZ: number,
		friction: number,
		restitution: number,
	): number;
	zylem_runtime_gameplay3d_debug_render(): number;
	zylem_runtime_gameplay3d_debug_vertices_ptr(): number;
	zylem_runtime_gameplay3d_debug_colors_ptr(): number;
}

export interface ZylemRuntimeBufferViews {
	readonly exports: ZylemRuntimeExports;
	/** Input slot buffer (host → Rust), length `inputLen` floats. */
	inputView: Float32Array;
	/** Render slot buffer (Rust → host), length `renderLen` floats. */
	renderView: Float32Array;
	/** Aggregates (Rust → host), length `summaryLen` floats. */
	summaryView: Float32Array;
	inputStride: number;
	renderStride: number;
	summaryLen: number;
	inputLen: number;
	renderLen: number;
	eventStride: number;
	eventView: Float32Array;
	eventLen: number;
	/**
	 * Gameplay3D event buffer view. Backed by `zylem_runtime_gameplay3d_event_*`
	 * exports. Populated only after the runtime switches into Gameplay3D mode.
	 */
	gameplay3dEventView: Float32Array;
	gameplay3dEventLen: number;
	/**
	 * Recreate typed views after init or if `memory.buffer` was resized.
	 * Call after {@link ZylemRuntimeExports.zylem_runtime_init} and whenever the wasm memory grows.
	 */
	refreshViews(): void;
}

export interface ZylemRuntimeStaticBoxCollider {
	center: readonly [number, number, number];
	halfExtents: readonly [number, number, number];
	friction?: number;
	restitution?: number;
}

export interface ZylemRuntimeGameplay2DWorldBounds {
	left: number;
	right: number;
	bottom: number;
	top: number;
}

export interface ZylemRuntimeDynamicCircleBody2DConfig {
	slot: number;
	position: readonly [number, number, number];
	radius: number;
	initialVelocity: readonly [number, number];
	minSpeed: number;
	maxSpeed: number;
	speedMultiplier: number;
	maxAngleDeg: number;
	reflectionMode: 'simple' | 'angled';
	/** Enables top/bottom boundary reflection in gameplay2d. */
	usesBoundary2d: boolean;
	/** Enables circle-vs-kinematic-AABB ricochet. */
	usesRicochet2d: boolean;
}

export interface ZylemRuntimeKinematicAabbBody2DConfig {
	slot: number;
	position: readonly [number, number, number];
	playerIndex: number;
	speed: number;
	halfExtents: readonly [number, number];
}

/** World-space trigger strip in XY (gameplay2d); does not consume a body slot. */
export interface ZylemRuntimeGameplay2DTriggerAabb {
	/** Stable id returned on {@link ZylemRuntimeEventType.RegionEntered} as `secondarySlot` (keep small integers for f32 event buffers). */
	triggerId: number;
	position: readonly [number, number, number];
	halfExtents: readonly [number, number];
}

export interface ZylemRuntimeGameplay2DConfig {
	bounds: ZylemRuntimeGameplay2DWorldBounds;
	dynamicCircles: ReadonlyArray<ZylemRuntimeDynamicCircleBody2DConfig>;
	kinematicAabbs: ReadonlyArray<ZylemRuntimeKinematicAabbBody2DConfig>;
	/** Optional sensor regions: wasm emits {@link ZylemRuntimeEventType.RegionEntered} when the dynamic circle enters (edge-triggered). Game rules stay in TS. */
	triggerAabbs?: ReadonlyArray<ZylemRuntimeGameplay2DTriggerAabb>;
}

export const ZYLEM_RUNTIME_EVENT_STRIDE = 4;

export const enum ZylemRuntimeEventType {
	BoundaryBounce = 1,
	ColliderBounce = 2,
	RegionEntered = 3,
	/** Platformer3D applied a jump impulse. `secondarySlot` is `jumpCount`. */
	JumpStarted = 4,
	/** Platformer3D landed (was airborne, now grounded). */
	Landed = 5,
}

export interface ZylemRuntimeEvent {
	type: ZylemRuntimeEventType;
	primarySlot: number;
	secondarySlot: number;
	aux: number;
}

export interface ZylemRuntimeInstancedBatchConfig {
	positions: ReadonlyArray<readonly [number, number, number]>;
	halfExtents: readonly [number, number, number];
	staticColliders?: ReadonlyArray<ZylemRuntimeStaticBoxCollider>;
}

/** Capsule shape config for a Gameplay3D platformer body. */
export interface ZylemRuntimePlatformerCapsuleConfig {
	slot: number;
	position: readonly [number, number, number];
	halfHeight: number;
	radius: number;
}

/**
 * Tunable platformer movement parameters. Maps 1:1 to Rust's
 * `Platformer3DConfig`. All time values are in seconds.
 */
export interface ZylemRuntimePlatformer3DConfig {
	slot: number;
	walkSpeed: number;
	runSpeed: number;
	jumpForce: number;
	maxJumps: number;
	gravity: number;
	coyoteTime: number;
	jumpBufferTime: number;
	jumpCutMultiplier: number;
	multiJumpWindow: number;
	maxSlopeDeg: number;
	autostepHeight: number;
	snapToGround: number;
}

export interface ZylemRuntimeGameplay3DConfig {
	capsules: ReadonlyArray<ZylemRuntimePlatformerCapsuleConfig>;
	platformers: ReadonlyArray<ZylemRuntimePlatformer3DConfig>;
	staticColliders?: ReadonlyArray<ZylemRuntimeStaticBoxCollider>;
}

/**
 * Instantiates the zylem-runtime wasm module.
 */
export async function loadZylemRuntimeWasm(
	source: RequestInfo | URL | ArrayBuffer,
	imports: WebAssembly.Imports = {},
): Promise<{ instance: WebAssembly.Instance; exports: ZylemRuntimeExports }> {
	let bytes: ArrayBuffer;
	if (source instanceof ArrayBuffer) {
		bytes = source;
	} else {
		const response = await fetch(source);
		bytes = await response.arrayBuffer();
	}

	const { instance } = await WebAssembly.instantiate(bytes, imports);
	const exports = instance.exports as unknown as ZylemRuntimeExports;
	return { instance, exports };
}

/**
 * Wraps buffer pointer/length exports as {@link Float32Array} views. Strides are read from the module after init.
 */
export function attachZylemRuntimeBufferViews(exports: ZylemRuntimeExports): ZylemRuntimeBufferViews {
	const inputStride = exports.zylem_runtime_input_stride();
	const renderStride = exports.zylem_runtime_render_stride();
	const summaryLen = exports.zylem_runtime_summary_len();

	let inputView!: Float32Array;
	let renderView!: Float32Array;
	let summaryView!: Float32Array;
	let inputLen = 0;
	let renderLen = 0;
	let eventView = new Float32Array(0);
	let eventLen = 0;
	let gameplay3dEventView = new Float32Array(0);
	let gameplay3dEventLen = 0;
	const eventStride = exports.zylem_runtime_event_stride();

	function refreshViews(): void {
		const buffer = exports.memory.buffer;
		const inPtr = exports.zylem_runtime_input_ptr();
		const inLen = exports.zylem_runtime_input_len();
		const rPtr = exports.zylem_runtime_render_ptr();
		const rLen = exports.zylem_runtime_render_len();
		const sPtr = exports.zylem_runtime_summary_ptr();
		const sBufLen = exports.zylem_runtime_summary_buffer_len();
		const ePtr = exports.zylem_runtime_event_ptr();
		const eLen = exports.zylem_runtime_event_len();
		const e3Ptr = exports.zylem_runtime_gameplay3d_event_ptr();
		const e3Len = exports.zylem_runtime_gameplay3d_event_len();

		inputLen = inLen;
		renderLen = rLen;
		eventLen = eLen;
		gameplay3dEventLen = e3Len;
		inputView = new Float32Array(buffer, inPtr, inLen);
		renderView = new Float32Array(buffer, rPtr, rLen);
		summaryView = new Float32Array(buffer, sPtr, sBufLen);
		eventView = eLen > 0 ? new Float32Array(buffer, ePtr, eLen) : new Float32Array(0);
		gameplay3dEventView =
			e3Len > 0 ? new Float32Array(buffer, e3Ptr, e3Len) : new Float32Array(0);
	}

	refreshViews();

	return {
		exports,
		get inputView() {
			return inputView;
		},
		get renderView() {
			return renderView;
		},
		get summaryView() {
			return summaryView;
		},
		inputStride,
		renderStride,
		summaryLen,
		get inputLen() {
			return inputLen;
		},
		get renderLen() {
			return renderLen;
		},
		eventStride,
		get eventView() {
			return eventView;
		},
		get eventLen() {
			return eventLen;
		},
		get gameplay3dEventView() {
			return gameplay3dEventView;
		},
		get gameplay3dEventLen() {
			return gameplay3dEventLen;
		},
		refreshViews,
	};
}

/**
 * Writes one input slot: position (3), rotation (4), contacts (1), speed (1).
 * `values` must have length 9 (or use {@link writeInputSlotFromParts}).
 */
export function writeInputSlot(
	view: Float32Array,
	stride: number,
	slotIndex: number,
	values: readonly number[],
): void {
	const base = slotIndex * stride;
	if (values.length < stride) {
		throw new Error(`writeInputSlot: expected at least ${stride} values, got ${values.length}`);
	}
	for (let i = 0; i < stride; i++) {
		view[base + i] = values[i]!;
	}
}

export function writeInputSlotFromParts(
	view: Float32Array,
	stride: number,
	slotIndex: number,
	parts: {
		position: readonly [number, number, number];
		rotation: readonly [number, number, number, number];
		contacts: number;
		speed: number;
	},
): void {
	const base = slotIndex * stride;
	view[base] = parts.position[0]!;
	view[base + 1] = parts.position[1]!;
	view[base + 2] = parts.position[2]!;
	view[base + 3] = parts.rotation[0]!;
	view[base + 4] = parts.rotation[1]!;
	view[base + 5] = parts.rotation[2]!;
	view[base + 6] = parts.rotation[3]!;
	view[base + 7] = parts.contacts;
	view[base + 8] = parts.speed;
}

export interface ZylemRenderSlot {
	position: [number, number, number];
	rotation: [number, number, number, number];
	scaleMultiplier: number;
	contactCount: number;
	heat: number;
	speed: number;
}

/**
 * Reads one render slot from the post-step render buffer.
 */
export function readRenderSlot(view: Float32Array, stride: number, slotIndex: number): ZylemRenderSlot {
	const base = slotIndex * stride;
	return {
		position: [view[base]!, view[base + 1]!, view[base + 2]!],
		rotation: [view[base + 3]!, view[base + 4]!, view[base + 5]!, view[base + 6]!],
		scaleMultiplier: view[base + 7]!,
		contactCount: view[base + 8]!,
		heat: view[base + 9]!,
		speed: view[base + 10]!,
	};
}

export interface ZylemSummarySnapshot {
	entityCount: number;
	collidingEntities: number;
	totalContacts: number;
	averageHeat: number;
	maxHeat: number;
	maxContacts: number;
}

/**
 * Reads the summary buffer (6 floats).
 */
export function readSummary(view: Float32Array): ZylemSummarySnapshot {
	return {
		entityCount: view[0]!,
		collidingEntities: view[1]!,
		totalContacts: view[2]!,
		averageHeat: view[3]!,
		maxHeat: view[4]!,
		maxContacts: view[5]!,
	};
}

/**
 * Initializes wasm, runs `zylem_runtime_init`, and returns typed exports plus buffer views.
 */
export async function createZylemRuntimeSession(
	source: RequestInfo | URL | ArrayBuffer,
	capacity: number,
	initialActive: number,
	imports?: WebAssembly.Imports,
): Promise<ZylemRuntimeBufferViews> {
	const { exports } = await loadZylemRuntimeWasm(source, imports);
	if (capacity === 0) {
		throw new Error('createZylemRuntimeSession: capacity must be > 0');
	}
	exports.zylem_runtime_init(capacity, initialActive);
	const buffers = attachZylemRuntimeBufferViews(exports);
	buffers.refreshViews();
	if (buffers.inputLen === 0) {
		throw new Error('zylem_runtime_init did not allocate buffers');
	}
	return buffers;
}

export function configureZylemRuntimeGameplay2D(
	buffers: ZylemRuntimeBufferViews,
	config: ZylemRuntimeGameplay2DConfig,
): void {
	buffers.exports.zylem_runtime_gameplay2d_clear_config();
	buffers.exports.zylem_runtime_gameplay2d_set_world_bounds(
		config.bounds.left,
		config.bounds.right,
		config.bounds.bottom,
		config.bounds.top,
	);

	for (const body of config.dynamicCircles) {
		buffers.exports.zylem_runtime_configure_dynamic_circle_body2d(
			body.slot,
			body.radius,
			body.initialVelocity[0],
			body.initialVelocity[1],
			body.minSpeed,
			body.maxSpeed,
			body.speedMultiplier,
			body.maxAngleDeg,
			body.reflectionMode === 'angled' ? 1 : 0,
			body.usesBoundary2d ? 1 : 0,
			body.usesRicochet2d ? 1 : 0,
		);
	}

	for (const body of config.kinematicAabbs) {
		buffers.exports.zylem_runtime_configure_kinematic_aabb_body2d(
			body.slot,
			body.playerIndex,
			body.speed,
			body.halfExtents[0],
			body.halfExtents[1],
		);
	}

	for (const trigger of config.triggerAabbs ?? []) {
		buffers.exports.zylem_runtime_gameplay2d_add_trigger_aabb(
			trigger.triggerId >>> 0,
			trigger.position[0],
			trigger.position[1],
			trigger.position[2],
			trigger.halfExtents[0],
			trigger.halfExtents[1],
		);
	}

}

export function bootstrapZylemRuntimeGameplay2D(
	buffers: ZylemRuntimeBufferViews,
	config: ZylemRuntimeGameplay2DConfig,
): ZylemRuntimeBufferViews {
	buffers.inputView.fill(0);
	for (const body of config.dynamicCircles) {
		const base = body.slot * buffers.inputStride;
		buffers.inputView[base] = body.position[0];
		buffers.inputView[base + 1] = body.position[1];
		buffers.inputView[base + 2] = body.position[2];
		buffers.inputView[base + 6] = 1;
		buffers.inputView[base + 7] = body.radius;
		buffers.inputView[base + 8] = body.radius;
	}
	for (const body of config.kinematicAabbs) {
		const base = body.slot * buffers.inputStride;
		buffers.inputView[base] = body.position[0];
		buffers.inputView[base + 1] = body.position[1];
		buffers.inputView[base + 2] = body.position[2];
		buffers.inputView[base + 6] = 1;
		buffers.inputView[base + 7] = body.halfExtents[0];
		buffers.inputView[base + 8] = body.halfExtents[1];
	}
	configureZylemRuntimeGameplay2D(buffers, config);
	buffers.exports.zylem_runtime_bootstrap_gameplay2d();
	buffers.exports.zylem_runtime_step(0);
	buffers.refreshViews();
	return buffers;
}

export async function createZylemRuntimeGameplay2DSession(
	source: RequestInfo | URL | ArrayBuffer,
	capacity: number,
	config: ZylemRuntimeGameplay2DConfig,
	imports?: WebAssembly.Imports,
): Promise<ZylemRuntimeBufferViews> {
	const buffers = await createZylemRuntimeSession(source, capacity, capacity, imports);
	return bootstrapZylemRuntimeGameplay2D(buffers, config);
}

export function setZylemRuntimeGameplay2DInputAxis(
	buffers: ZylemRuntimeBufferViews,
	playerIndex: number,
	vertical: number,
): void {
	buffers.exports.zylem_runtime_gameplay2d_set_input_axis(playerIndex, vertical);
}

export function setZylemRuntimeGameplay2DSlotPosition(
	buffers: ZylemRuntimeBufferViews,
	slot: number,
	x: number,
	y: number,
	z: number,
): void {
	buffers.exports.zylem_runtime_gameplay2d_set_slot_position(slot, x, y, z);
}

export function setZylemRuntimeGameplay2DSlotVelocity(
	buffers: ZylemRuntimeBufferViews,
	slot: number,
	x: number,
	y: number,
): void {
	buffers.exports.zylem_runtime_gameplay2d_set_slot_velocity(slot, x, y);
}

export function readZylemRuntimeEvents(buffers: ZylemRuntimeBufferViews): ZylemRuntimeEvent[] {
	const eventCount = buffers.exports.zylem_runtime_event_count();
	const events: ZylemRuntimeEvent[] = [];
	for (let index = 0; index < eventCount; index++) {
		const base = index * buffers.eventStride;
		events.push({
			type: buffers.eventView[base] as ZylemRuntimeEventType,
			primarySlot: buffers.eventView[base + 1]!,
			secondarySlot: buffers.eventView[base + 2]!,
			aux: buffers.eventView[base + 3]!,
		});
	}
	return events;
}

/**
 * Writes initial positions to the input buffer and boots the runtime into instancing mode.
 */
export function bootstrapZylemRuntimeInstancing(
	buffers: ZylemRuntimeBufferViews,
	config: ZylemRuntimeInstancedBatchConfig,
): ZylemRuntimeBufferViews {
	if (config.positions.length === 0) {
		throw new Error('bootstrapZylemRuntimeInstancing: positions must not be empty');
	}
	if (buffers.inputStride < ZYLEM_RUNTIME_INPUT_STRIDE) {
		throw new Error('bootstrapZylemRuntimeInstancing: input stride is smaller than expected');
	}
	if (buffers.inputLen < config.positions.length * buffers.inputStride) {
		throw new Error('bootstrapZylemRuntimeInstancing: input buffer is too small for positions');
	}

	buffers.inputView.fill(0);
	for (let index = 0; index < config.positions.length; index++) {
		const base = index * buffers.inputStride;
		const position = config.positions[index]!;
		buffers.inputView[base] = position[0]!;
		buffers.inputView[base + 1] = position[1]!;
		buffers.inputView[base + 2] = position[2]!;
		buffers.inputView[base + 6] = 1;
	}

	buffers.exports.zylem_runtime_clear_static_box_colliders();
	for (const collider of config.staticColliders ?? []) {
		buffers.exports.zylem_runtime_add_static_box_collider(
			collider.center[0]!,
			collider.center[1]!,
			collider.center[2]!,
			collider.halfExtents[0]!,
			collider.halfExtents[1]!,
			collider.halfExtents[2]!,
			collider.friction ?? 0.95,
			collider.restitution ?? 0.05,
		);
	}

	buffers.exports.zylem_runtime_bootstrap_instancing(
		config.halfExtents[0]!,
		config.halfExtents[1]!,
		config.halfExtents[2]!,
	);
	buffers.exports.zylem_runtime_step(0);
	buffers.refreshViews();
	return buffers;
}

/**
 * Creates a runtime session configured from a set of explicit instanced entity positions.
 */
export async function createZylemRuntimeInstancedBatchSession(
	source: RequestInfo | URL | ArrayBuffer,
	config: ZylemRuntimeInstancedBatchConfig,
	imports?: WebAssembly.Imports,
): Promise<ZylemRuntimeBufferViews> {
	const buffers = await createZylemRuntimeSession(
		source,
		config.positions.length,
		config.positions.length,
		imports,
	);
	return bootstrapZylemRuntimeInstancing(buffers, config);
}

/**
 * Pushes capsule + platformer config to wasm. Does NOT switch the simulation
 * mode — call {@link bootstrapZylemRuntimeGameplay3D} after writing initial
 * positions to the input buffer.
 */
export function configureZylemRuntimePlatformer3D(
	buffers: ZylemRuntimeBufferViews,
	config: ZylemRuntimeGameplay3DConfig,
): void {
	buffers.exports.zylem_runtime_gameplay3d_clear_config();
	for (const capsule of config.capsules) {
		buffers.exports.zylem_runtime_configure_platformer_capsule_body3d(
			capsule.slot,
			Math.max(capsule.halfHeight, 0.01),
			Math.max(capsule.radius, 0.01),
		);
	}
	for (const platformer of config.platformers) {
		buffers.exports.zylem_runtime_configure_platformer_3d(
			platformer.slot,
			platformer.walkSpeed,
			platformer.runSpeed,
			platformer.jumpForce,
			platformer.maxJumps >>> 0,
			platformer.gravity,
			platformer.coyoteTime,
			platformer.jumpBufferTime,
			platformer.jumpCutMultiplier,
			platformer.multiJumpWindow,
			platformer.maxSlopeDeg,
			platformer.autostepHeight,
			platformer.snapToGround,
		);
	}
}

/**
 * Writes initial capsule positions to the input buffer, registers static box
 * colliders, configures platformer/capsule bodies, and switches the runtime
 * into Gameplay3D mode. Returns the same buffers with views refreshed.
 */
export function bootstrapZylemRuntimeGameplay3D(
	buffers: ZylemRuntimeBufferViews,
	config: ZylemRuntimeGameplay3DConfig,
): ZylemRuntimeBufferViews {
	if (config.capsules.length === 0) {
		throw new Error('bootstrapZylemRuntimeGameplay3D: at least one capsule must be provided');
	}
	if (buffers.inputStride < ZYLEM_RUNTIME_INPUT_STRIDE) {
		throw new Error('bootstrapZylemRuntimeGameplay3D: input stride is smaller than expected');
	}

	buffers.inputView.fill(0);
	for (const capsule of config.capsules) {
		const base = capsule.slot * buffers.inputStride;
		buffers.inputView[base] = capsule.position[0]!;
		buffers.inputView[base + 1] = capsule.position[1]!;
		buffers.inputView[base + 2] = capsule.position[2]!;
		buffers.inputView[base + 6] = 1;
	}

	buffers.exports.zylem_runtime_clear_static_box_colliders();
	for (const collider of config.staticColliders ?? []) {
		buffers.exports.zylem_runtime_add_static_box_collider(
			collider.center[0]!,
			collider.center[1]!,
			collider.center[2]!,
			collider.halfExtents[0]!,
			collider.halfExtents[1]!,
			collider.halfExtents[2]!,
			collider.friction ?? 0.95,
			collider.restitution ?? 0.0,
		);
	}

	configureZylemRuntimePlatformer3D(buffers, config);
	buffers.exports.zylem_runtime_bootstrap_gameplay3d();
	buffers.exports.zylem_runtime_step(0);
	buffers.refreshViews();
	return buffers;
}

/**
 * Convenience wrapper that loads wasm, sizes the runtime to fit the provided
 * capsules, and bootstraps Gameplay3D in one call.
 */
export async function createZylemRuntimeGameplay3DSession(
	source: RequestInfo | URL | ArrayBuffer,
	config: ZylemRuntimeGameplay3DConfig,
	imports?: WebAssembly.Imports,
): Promise<ZylemRuntimeBufferViews> {
	const capacity = Math.max(...config.capsules.map((c) => c.slot)) + 1;
	const buffers = await createZylemRuntimeSession(source, capacity, capacity, imports);
	return bootstrapZylemRuntimeGameplay3D(buffers, config);
}

export function setZylemRuntimeGameplay3DInputAxes(
	buffers: ZylemRuntimeBufferViews,
	slot: number,
	moveX: number,
	moveZ: number,
): void {
	buffers.exports.zylem_runtime_gameplay3d_set_input_axes(slot, moveX, moveZ);
}

export function setZylemRuntimeGameplay3DInputButtons(
	buffers: ZylemRuntimeBufferViews,
	slot: number,
	jump: boolean,
	run: boolean,
): void {
	buffers.exports.zylem_runtime_gameplay3d_set_input_buttons(
		slot,
		jump ? 1 : 0,
		run ? 1 : 0,
	);
}

export function setZylemRuntimeGameplay3DSlotPosition(
	buffers: ZylemRuntimeBufferViews,
	slot: number,
	x: number,
	y: number,
	z: number,
): void {
	buffers.exports.zylem_runtime_gameplay3d_set_slot_position(slot, x, y, z);
}

export function getZylemRuntimeGameplay3DGrounded(
	buffers: ZylemRuntimeBufferViews,
	slot: number,
): boolean {
	return buffers.exports.zylem_runtime_gameplay3d_grounded(slot) !== 0;
}

export function getZylemRuntimeGameplay3DJumpCount(
	buffers: ZylemRuntimeBufferViews,
	slot: number,
): number {
	return buffers.exports.zylem_runtime_gameplay3d_jump_count(slot) >>> 0;
}

/**
 * Animation-facing platformer states surfaced from the wasm runtime FSM.
 * Discriminants are stable and match `Platformer3DFsmState` in
 * `packages/zylem-runtime/src/runtime/behaviors/platformer_3d/fsm.rs` —
 * never reorder.
 */
export enum ZylemRuntimePlatformer3DFsmState {
	Idle = 0,
	Walking = 1,
	Running = 2,
	Jumping = 3,
	Falling = 4,
	Landing = 5,
}

/**
 * Reads the current animation FSM state for a Gameplay3D platformer slot.
 * Returns {@link ZylemRuntimePlatformer3DFsmState.Idle} when the simulation
 * is not in Gameplay3D mode or the slot is out of range.
 */
export function getZylemRuntimeGameplay3DState(
	buffers: ZylemRuntimeBufferViews,
	slot: number,
): ZylemRuntimePlatformer3DFsmState {
	const raw = buffers.exports.zylem_runtime_gameplay3d_state(slot) >>> 0;
	switch (raw) {
		case ZylemRuntimePlatformer3DFsmState.Walking:
		case ZylemRuntimePlatformer3DFsmState.Running:
		case ZylemRuntimePlatformer3DFsmState.Jumping:
		case ZylemRuntimePlatformer3DFsmState.Falling:
		case ZylemRuntimePlatformer3DFsmState.Landing:
			return raw;
		default:
			return ZylemRuntimePlatformer3DFsmState.Idle;
	}
}

/**
 * Configuration for a static heightfield collider passed to the wasm
 * runtime. Mirrors the TS Rapier plane layout used by `playgroundPlane`
 * (see `PlaneMeshBuilder.postBuild`):
 *
 *   - `rows` is the number of X subdivisions (so the X vertex count is
 *     `rows + 1`).
 *   - `cols` is the number of Z subdivisions.
 *   - `heights` must have exactly `(rows + 1) * (cols + 1)` entries laid
 *     out outer-x, inner-z, i.e. `heights[xIdx * (cols + 1) + zIdx]`.
 *   - `scale` is `[tileX, heightScale, tileZ]`.
 *   - `translation` shifts the heightfield in world space (heightfield
 *     vertex y=0 maps to `translation[1]`).
 */
export interface ZylemRuntimeStaticHeightfieldCollider {
	rows: number;
	cols: number;
	heights: Float32Array;
	scale: readonly [number, number, number];
	translation: readonly [number, number, number];
	friction?: number;
	restitution?: number;
}

/**
 * Stages `cfg.heights` into the wasm heightfield scratch buffer and
 * registers a pending heightfield collider. Must be called after wasm
 * `init` and before `zylem_runtime_bootstrap_gameplay3d`. Throws if the
 * heights array exceeds the scratch capacity or its length doesn't match
 * `(rows + 1) * (cols + 1)`.
 */
export function addZylemRuntimeStaticHeightfieldCollider(
	exports: ZylemRuntimeExports,
	memory: WebAssembly.Memory,
	cfg: ZylemRuntimeStaticHeightfieldCollider,
): void {
	const expected = (cfg.rows + 1) * (cfg.cols + 1);
	if (cfg.heights.length !== expected) {
		throw new Error(
			`addZylemRuntimeStaticHeightfieldCollider: heights length ${cfg.heights.length} != expected ${expected} for rows=${cfg.rows} cols=${cfg.cols}`,
		);
	}
	const capacity = exports.zylem_runtime_heightfield_scratch_capacity();
	if (cfg.heights.length > capacity) {
		throw new Error(
			`addZylemRuntimeStaticHeightfieldCollider: heights length ${cfg.heights.length} exceeds wasm scratch capacity ${capacity}`,
		);
	}
	const ptr = exports.zylem_runtime_heightfield_scratch_ptr();
	const scratch = new Float32Array(memory.buffer, ptr, capacity);
	scratch.set(cfg.heights);

	const ok = exports.zylem_runtime_add_static_heightfield_collider(
		cfg.rows >>> 0,
		cfg.cols >>> 0,
		cfg.heights.length >>> 0,
		cfg.scale[0],
		cfg.scale[1],
		cfg.scale[2],
		cfg.translation[0],
		cfg.translation[1],
		cfg.translation[2],
		cfg.friction ?? 1.0,
		cfg.restitution ?? 0.0,
	);
	if (ok === 0) {
		throw new Error(
			'addZylemRuntimeStaticHeightfieldCollider: wasm rejected the heightfield (rows/cols/length mismatch)',
		);
	}
}

/**
 * Result of a Gameplay3D debug-render snapshot. Both views are fresh
 * `Float32Array`s over the wasm memory, sliced to the populated prefix.
 *
 * - `vertices` is `vertexCount * 3` floats laid out as
 *   `[x, y, z, x, y, z, ...]` with consecutive *pairs* forming line
 *   segments (matching the layout of TS Rapier's `world.debugRender()`).
 * - `colors` is `vertexCount * 4` floats laid out as
 *   `[r, g, b, a, r, g, b, a, ...]` already converted from rapier's HSLA
 *   palette so it can be fed directly into a `LineBasicMaterial` with
 *   `vertexColors: true`.
 */
export interface ZylemRuntimeGameplay3DDebugRender {
	vertices: Float32Array;
	colors: Float32Array;
	vertexCount: number;
}

/**
 * Refreshes the wasm Gameplay3D debug-render buffers from the current
 * Rapier world, then returns fresh `Float32Array` views over them.
 * Returns `null` when the simulation is not in Gameplay3D mode or there
 * are no lines to draw. Views are always reconstructed from the current
 * `memory.buffer` so they stay valid across wasm memory growth.
 */
export function getZylemRuntimeGameplay3DDebugRender(
	exports: ZylemRuntimeExports,
	memory: WebAssembly.Memory,
): ZylemRuntimeGameplay3DDebugRender | null {
	const vertexCount = exports.zylem_runtime_gameplay3d_debug_render() >>> 0;
	if (vertexCount === 0) {
		return null;
	}
	const vPtr = exports.zylem_runtime_gameplay3d_debug_vertices_ptr();
	const cPtr = exports.zylem_runtime_gameplay3d_debug_colors_ptr();
	if (vPtr === 0 || cPtr === 0) {
		return null;
	}
	const vertices = new Float32Array(memory.buffer, vPtr, vertexCount * 3);
	const colors = new Float32Array(memory.buffer, cPtr, vertexCount * 4);
	return { vertices, colors, vertexCount };
}

/**
 * Reads the Gameplay3D event buffer (JumpStarted / Landed) for the most
 * recent step. Mirrors {@link readZylemRuntimeEvents} but pulls from the
 * dedicated 3D buffer; refreshes views first in case wasm memory grew.
 */
export function readZylemRuntimeGameplay3DEvents(
	buffers: ZylemRuntimeBufferViews,
): ZylemRuntimeEvent[] {
	const eventCount = buffers.exports.zylem_runtime_gameplay3d_event_count();
	if (eventCount === 0) {
		return [];
	}
	buffers.refreshViews();
	const view = buffers.gameplay3dEventView;
	const events: ZylemRuntimeEvent[] = [];
	for (let index = 0; index < eventCount; index++) {
		const base = index * buffers.eventStride;
		events.push({
			type: view[base] as ZylemRuntimeEventType,
			primarySlot: view[base + 1]!,
			secondarySlot: view[base + 2]!,
			aux: view[base + 3]!,
		});
	}
	return events;
}
