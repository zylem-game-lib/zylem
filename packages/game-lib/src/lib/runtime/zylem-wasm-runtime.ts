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

		inputLen = inLen;
		renderLen = rLen;
		eventLen = eLen;
		inputView = new Float32Array(buffer, inPtr, inLen);
		renderView = new Float32Array(buffer, rPtr, rLen);
		summaryView = new Float32Array(buffer, sPtr, sBufLen);
		eventView = eLen > 0 ? new Float32Array(buffer, ePtr, eLen) : new Float32Array(0);
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
