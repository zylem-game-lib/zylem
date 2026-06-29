/**
 * `StagePhysicsBridge` — the stage-level physics/WASM bridge.
 *
 * This is the single seam between TS-authored entities and the unified
 * {@link WasmStageRuntime} (Rust ECS + Rapier). It owns the wasm slot for each
 * entity, uploads body/collider configs on attach, steps the simulation with a
 * fixed-timestep accumulator, and exposes an interpolated per-entity transform
 * for the render layer to consume.
 *
 * It deliberately holds no Three.js references: WASM owns *where* an entity is,
 * the render layer (see `graphics/render-bundle-manager.ts`) owns *how* it is
 * drawn. The bridge is the hand-off point between them.
 */
import { Quaternion, Vector3 } from 'three';

import type { GameEntity } from '../entities/entity';
import { normalizeVec3, VEC3_ZERO, VEC3_ONE } from '../core/vector';
import {
	WasmStageRuntime,
	StageBodyKind,
	type StageBodyConfig,
	type StageColliderConfig,
	type StageColliderShape,
	type StageRenderSlot,
} from './wasm-stage-runtime';
import {
	buildRuntimeBody,
	buildBoxCollider,
	type RuntimeCollisionBundle,
} from '../collision/runtime-collision-builder';

/** Interpolated transform produced for the render layer. */
export interface BridgeTransform {
	position: [number, number, number];
	rotation: [number, number, number, number];
	scale: number;
	/** Per-behavior shading hints (heat / contacts / speed / fsm-state). */
	custom: [number, number, number, number];
}

/**
 * Line-segment debug geometry for the WASM-owned colliders, expressed in the
 * same `position`/`color` layout as Rapier's `world.debugRender()` so the
 * debug delegate can upload it straight into a `LineSegments`.
 */
export interface ColliderDebugRender {
	/** Flat `[x,y,z, x,y,z, ...]` line-segment endpoints (pairs form edges). */
	vertices: Float32Array;
	/** Flat `[r,g,b,a, ...]` per-vertex colors, matching {@link vertices}. */
	colors: Float32Array;
	/**
	 * `true` when {@link vertices} differ from the previous call (geometry moved
	 * or the collider set changed). Lets consumers skip GPU re-uploads while the
	 * scene is at rest — re-uploading this buffer is the overlay's dominant cost.
	 */
	changed: boolean;
}

/** Options controlling stepping cadence. */
export interface StagePhysicsBridgeOptions {
	/** Physics update rate in Hz. Defaults to 60. */
	physicsRate?: number;
	/** Maximum fixed substeps per frame (avoids spiral-of-death). Defaults to 5. */
	maxSubSteps?: number;
}

const _qa = new Quaternion();
const _qb = new Quaternion();
const _qr = new Quaternion();

/** Scratch reused while building collider debug geometry (no per-frame allocs). */
const _dbgTransform: BridgeTransform = {
	position: [0, 0, 0],
	rotation: [0, 0, 0, 1],
	scale: 1,
	custom: [0, 0, 0, 0],
};
const _dbgQuat = new Quaternion();
const _dbgCorner = new Vector3();

/** Unit box corners indexed as `(x>0?1:0) | (y>0?2:0) | (z>0?4:0)`. */
const BOX_CORNERS: ReadonlyArray<readonly [number, number, number]> = [
	[-1, -1, -1], [1, -1, -1], [-1, 1, -1], [1, 1, -1],
	[-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1],
];
/** The 12 box edges as pairs of {@link BOX_CORNERS} indices. */
const BOX_EDGES: ReadonlyArray<readonly [number, number]> = [
	[0, 1], [2, 3], [4, 5], [6, 7],
	[0, 2], [1, 3], [4, 6], [5, 7],
	[0, 4], [1, 5], [2, 6], [3, 7],
];
/** Floats emitted per box collider: 12 edges × 2 endpoints × 3 components. */
const FLOATS_PER_BOX = BOX_EDGES.length * 2 * 3;
/** Collider wireframe tint (magenta) — bright against most materials. */
const COLLIDER_DEBUG_COLOR: readonly [number, number, number, number] = [1, 0.25, 0.85, 1];
/**
 * Per-vertex movement (world units) below which the debug geometry is treated
 * as unchanged, so we skip the (expensive) GPU re-upload. Resting bodies still
 * jitter ~1e-3 from solver/interpolation noise; this keeps a settled overlay
 * cheap without visibly lagging real motion.
 */
const COLLIDER_DEBUG_EPSILON = 2e-3;

/**
 * Approximate any supported collider shape as a half-extent box so it can be
 * drawn as a wireframe. Returns `null` for mesh/heightfield shapes that have no
 * cheap box proxy (they're skipped from the debug overlay).
 */
function boxHalfExtentsForShape(shape: StageColliderShape): readonly [number, number, number] | null {
	switch (shape.type) {
		case 'box':
			return shape.halfExtents;
		case 'sphere':
			return [shape.radius, shape.radius, shape.radius];
		case 'capsule':
			return [shape.radius, shape.halfHeight + shape.radius, shape.radius];
		case 'cylinder':
			return [shape.radius, shape.halfHeight, shape.radius];
		default:
			return null;
	}
}

/**
 * Bridges TS entities to a single unified {@link WasmStageRuntime}.
 */
export class StagePhysicsBridge {
	private readonly runtime: WasmStageRuntime;
	private readonly fixedDt: number;
	private readonly maxSubSteps: number;

	/** Accumulated unsimulated time, in seconds. */
	private accumulator = 0;
	/** Interpolation factor in [0, 1] between {@link prev} and {@link curr}. */
	private alpha = 0;

	/** Double-buffered render-buffer snapshots for render interpolation. */
	private prev: Float32Array = new Float32Array(0);
	private curr: Float32Array = new Float32Array(0);
	private initialized = false;

	/** Live entities keyed by wasm slot, for diagnostics / reverse lookup. */
	private readonly slotToEntity = new Map<number, GameEntity<any>>();

	/** Resolved collider configs keyed by wasm slot, retained for debug drawing. */
	private readonly slotToColliders = new Map<number, StageColliderConfig[]>();

	/** Reused collider-debug buffers; reallocated only when the vertex count changes. */
	private dbgVertices: Float32Array = new Float32Array(0);
	private dbgColors: Float32Array = new Float32Array(0);
	/** Previous frame's vertices, for change detection (skip re-upload at rest). */
	private dbgPrev: Float32Array = new Float32Array(0);

	private readonly stride: number;

	constructor(runtime: WasmStageRuntime, options: StagePhysicsBridgeOptions = {}) {
		this.runtime = runtime;
		this.stride = runtime.renderStride;
		const rate = options.physicsRate && options.physicsRate > 0 ? options.physicsRate : 60;
		this.fixedDt = 1 / rate;
		this.maxSubSteps = options.maxSubSteps ?? 5;
	}

	/** Current interpolation factor (for diagnostics). */
	get interpolationAlpha(): number {
		return this.alpha;
	}

	/** The underlying runtime (for behaviors that need direct FFI access). */
	get wasm(): WasmStageRuntime {
		return this.runtime;
	}

	/**
	 * Attach an entity to the runtime: allocate a slot, store the handle on the
	 * entity, and upload its body + colliders. Idempotent — a re-attach is a
	 * no-op while the entity already holds a live handle.
	 *
	 * @param entity The entity to register.
	 * @param bundle Optional explicit collision config; auto-derived when omitted.
	 * @returns The allocated wasm slot handle, or -1 on failure.
	 */
	attachEntity(entity: GameEntity<any>, bundle?: RuntimeCollisionBundle): number {
		if (entity.runtimeAttached && entity.runtimeHandle >= 0) {
			return entity.runtimeHandle;
		}
		const handle = this.runtime.createEntity();
		if (handle < 0) {
			return -1;
		}
		const resolved = bundle ?? resolveEntityCollisionBundle(entity);
		this.runtime.attachBody(handle, resolved.body);
		for (const collider of resolved.colliders) {
			this.runtime.addCollider(handle, collider);
		}
		this.slotToColliders.set(handle, resolved.colliders);

		entity.runtimeHandle = handle;
		entity.runtimeSlot = handle;
		entity.runtimeAttached = true;
		entity.wasmStageRef = this.runtime;
		this.slotToEntity.set(handle, entity);
		return handle;
	}

	/** Detach an entity and free its wasm slot. */
	detachEntity(entity: GameEntity<any>): void {
		if (entity.runtimeHandle < 0) {
			return;
		}
		this.runtime.destroyEntity(entity.runtimeHandle);
		this.slotToEntity.delete(entity.runtimeHandle);
		this.slotToColliders.delete(entity.runtimeHandle);
		entity.runtimeHandle = -1;
		entity.runtimeSlot = -1;
		entity.runtimeAttached = false;
	}

	/** Resolve the entity bound to a wasm slot, if any. */
	getEntityForSlot(slot: number): GameEntity<any> | undefined {
		return this.slotToEntity.get(slot);
	}

	/** Forward gravity changes to the runtime. */
	setGravity(x: number, y: number, z: number): void {
		this.runtime.setGravity(x, y, z);
	}

	/**
	 * Advance the simulation using a fixed-timestep accumulator and refresh the
	 * interpolation snapshots. Mirrors the cadence of the legacy `ZylemWorld`
	 * so render interpolation stays smooth without any TS physics.
	 */
	step(delta: number): void {
		// Clamp pathological deltas (tab restore, breakpoints) so we don't try to
		// catch up with hundreds of substeps in a single frame.
		const clamped = Math.min(Math.max(delta, 0), this.fixedDt * this.maxSubSteps);
		this.accumulator += clamped;

		let steps = 0;
		const willStep = this.accumulator >= this.fixedDt;
		if (willStep) {
			this.ensureSnapshots();
			// Current becomes previous before we advance the sim.
			this.prev.set(this.curr);
		}
		while (this.accumulator >= this.fixedDt && steps < this.maxSubSteps) {
			this.runtime.step(this.fixedDt);
			this.accumulator -= this.fixedDt;
			steps++;
		}
		// Drop any residual we couldn't simulate this frame to avoid drift.
		if (steps >= this.maxSubSteps && this.accumulator > this.fixedDt) {
			this.accumulator = 0;
		}

		if (willStep) {
			this.ensureSnapshots();
			this.curr.set(this.runtime.render);
		} else if (!this.initialized) {
			// No step yet (e.g. paused) — still seed snapshots from the live buffer
			// so the very first frame renders at the spawn pose.
			this.ensureSnapshots();
			this.curr.set(this.runtime.render);
			this.prev.set(this.curr);
		}

		this.alpha = this.fixedDt > 0 ? Math.min(this.accumulator / this.fixedDt, 1) : 0;
	}

	/**
	 * Produce the interpolated transform for an entity slot. Returns `null`
	 * when the slot is out of range. `out` is mutated and returned to avoid
	 * per-entity allocation in the render loop.
	 */
	getTransform(handle: number, out: BridgeTransform): BridgeTransform | null {
		if (handle < 0) {
			return null;
		}
		const base = handle * this.stride;
		if (base + this.stride > this.curr.length) {
			return null;
		}
		const a = this.alpha;
		const inv = 1 - a;
		const p = this.prev;
		const c = this.curr;

		out.position[0] = p[base]! * inv + c[base]! * a;
		out.position[1] = p[base + 1]! * inv + c[base + 1]! * a;
		out.position[2] = p[base + 2]! * inv + c[base + 2]! * a;

		_qa.set(p[base + 3]!, p[base + 4]!, p[base + 5]!, p[base + 6]!);
		_qb.set(c[base + 3]!, c[base + 4]!, c[base + 5]!, c[base + 6]!);
		_qr.copy(_qa).slerp(_qb, a);
		out.rotation[0] = _qr.x;
		out.rotation[1] = _qr.y;
		out.rotation[2] = _qr.z;
		out.rotation[3] = _qr.w;

		const ps = p[base + 7]! === 0 ? 1 : p[base + 7]!;
		const cs = c[base + 7]! === 0 ? 1 : c[base + 7]!;
		out.scale = ps * inv + cs * a;

		// Custom channels are shading hints, not positions — take the latest.
		out.custom[0] = c[base + 8]!;
		out.custom[1] = c[base + 9]!;
		out.custom[2] = c[base + 10]!;
		out.custom[3] = c[base + 11]!;
		return out;
	}

	/** Read the raw (non-interpolated) latest slot, e.g. for queries/debug. */
	readSlot(handle: number, out?: StageRenderSlot): StageRenderSlot | null {
		return this.runtime.readRenderSlot(handle, out);
	}

	/**
	 * Build line-segment wireframes for every attached collider at its current
	 * *interpolated* transform. Because WASM owns physics in the bundle path,
	 * this is the only source that tracks bodies as they move — Rapier's
	 * `world.debugRender()` is empty here. Box-like shapes are drawn exactly;
	 * mesh/heightfield colliders are skipped.
	 *
	 * @returns Shared (reused) `vertices`/`colors` buffers; copy them if you
	 *   need to retain the data past the next call.
	 */
	getColliderDebugRender(): ColliderDebugRender {
		let boxCount = 0;
		for (const colliders of this.slotToColliders.values()) {
			for (const collider of colliders) {
				if (boxHalfExtentsForShape(collider.shape)) boxCount++;
			}
		}

		const vertexFloats = boxCount * FLOATS_PER_BOX;
		if (this.dbgVertices.length !== vertexFloats) {
			this.dbgVertices = new Float32Array(vertexFloats);
			this.dbgColors = new Float32Array(boxCount * BOX_EDGES.length * 2 * 4);
			// Colors are constant per vertex; fill once on (re)allocation.
			const [r, g, b, a] = COLLIDER_DEBUG_COLOR;
			for (let i = 0; i < this.dbgColors.length; i += 4) {
				this.dbgColors[i] = r;
				this.dbgColors[i + 1] = g;
				this.dbgColors[i + 2] = b;
				this.dbgColors[i + 3] = a;
			}
		}

		const verts = this.dbgVertices;
		let v = 0;
		for (const [handle, colliders] of this.slotToColliders) {
			const transform = this.getTransform(handle, _dbgTransform);
			if (!transform) continue;
			_dbgQuat.set(transform.rotation[0], transform.rotation[1], transform.rotation[2], transform.rotation[3]);
			const px = transform.position[0];
			const py = transform.position[1];
			const pz = transform.position[2];
			const s = transform.scale;

			for (const collider of colliders) {
				const half = boxHalfExtentsForShape(collider.shape);
				if (!half) continue;
				const ox = collider.offset[0];
				const oy = collider.offset[1];
				const oz = collider.offset[2];

				for (const [a, b] of BOX_EDGES) {
					const ca = BOX_CORNERS[a]!;
					const cb = BOX_CORNERS[b]!;
					v = this.writeCorner(verts, v, ca, half, ox, oy, oz, s, px, py, pz);
					v = this.writeCorner(verts, v, cb, half, ox, oy, oz, s, px, py, pz);
				}
			}
		}

		// Detect whether anything actually moved this frame; re-uploading the line
		// buffer to the GPU is the overlay's dominant cost, so we skip it at rest.
		let changed = this.dbgPrev.length !== verts.length;
		if (!changed) {
			for (let i = 0; i < verts.length; i++) {
				if (Math.abs(this.dbgPrev[i]! - verts[i]!) > COLLIDER_DEBUG_EPSILON) {
					changed = true;
					break;
				}
			}
		}
		if (changed) {
			if (this.dbgPrev.length !== verts.length) {
				this.dbgPrev = new Float32Array(verts.length);
			}
			this.dbgPrev.set(verts);
		}

		return { vertices: verts, colors: this.dbgColors, changed };
	}

	/** Transform one box corner into world space and append it to `verts`. */
	private writeCorner(
		verts: Float32Array,
		offset: number,
		corner: readonly [number, number, number],
		half: readonly [number, number, number],
		ox: number, oy: number, oz: number,
		scale: number,
		px: number, py: number, pz: number,
	): number {
		_dbgCorner.set(
			(ox + corner[0] * half[0]) * scale,
			(oy + corner[1] * half[1]) * scale,
			(oz + corner[2] * half[2]) * scale,
		);
		_dbgCorner.applyQuaternion(_dbgQuat);
		verts[offset] = _dbgCorner.x + px;
		verts[offset + 1] = _dbgCorner.y + py;
		verts[offset + 2] = _dbgCorner.z + pz;
		return offset + 3;
	}

	/** Release runtime resources. */
	dispose(): void {
		this.slotToEntity.clear();
		this.slotToColliders.clear();
		this.dbgVertices = new Float32Array(0);
		this.dbgColors = new Float32Array(0);
		this.dbgPrev = new Float32Array(0);
		this.prev = new Float32Array(0);
		this.curr = new Float32Array(0);
		this.initialized = false;
		this.runtime.dispose();
	}

	/** Grow/allocate the interpolation snapshots to match the live buffer. */
	private ensureSnapshots(): void {
		const len = this.runtime.render.length;
		if (this.curr.length === len) {
			if (!this.initialized) {
				this.curr.set(this.runtime.render);
				this.prev.set(this.curr);
				this.initialized = true;
			}
			return;
		}
		// Memory grew (new slots allocated) — preserve existing data where we can.
		const nextPrev = new Float32Array(len);
		const nextCurr = new Float32Array(len);
		nextPrev.set(this.prev.subarray(0, Math.min(this.prev.length, len)));
		nextCurr.set(this.curr.subarray(0, Math.min(this.curr.length, len)));
		// New tail comes straight from the live buffer so freshly attached
		// entities don't interpolate out of (0,0,0).
		if (len > this.curr.length) {
			const live = this.runtime.render;
			nextCurr.set(live.subarray(this.curr.length, len), this.curr.length);
			nextPrev.set(live.subarray(this.curr.length, len), this.prev.length);
		}
		this.prev = nextPrev;
		this.curr = nextCurr;
		this.initialized = true;
	}
}

/**
 * Derive a sensible default {@link RuntimeCollisionBundle} from an entity's
 * options when no explicit config is supplied. Defaults to a box collider
 * sized from `options.size`; the body kind follows `options.runtime.body`.
 *
 * Entity factories with non-box shapes can pass an explicit bundle to
 * {@link StagePhysicsBridge.attachEntity} instead.
 */
export function resolveEntityCollisionBundle(entity: GameEntity<any>): RuntimeCollisionBundle {
	const options = entity.options ?? {};
	const position = normalizeVec3(options.position, VEC3_ZERO);
	const size = normalizeVec3(options.size, VEC3_ONE);

	const bodyMode = options.runtime?.body ?? 'dynamic';
	let kind: StageBodyKind;
	if (bodyMode === 'static') {
		kind = StageBodyKind.Static;
	} else if (bodyMode === 'none') {
		// Movable-but-not-dynamic: lets setPosition drive it without gravity.
		kind = StageBodyKind.KinematicPosition;
	} else {
		kind = StageBodyKind.Dynamic;
	}

	const controlledRotation = (entity as { controlledRotation?: boolean }).controlledRotation === true;
	const lockAllRotation: readonly [boolean, boolean, boolean] = controlledRotation
		? [true, true, true]
		: [false, false, false];

	const body: StageBodyConfig = buildRuntimeBody({
		kind,
		position: [position.x, position.y, position.z],
		lockRotation: lockAllRotation,
	});

	const collider: StageColliderConfig = buildBoxCollider([size.x, size.y, size.z], {
		collisionType: options.collisionType,
		collisionFilter: options.collisionFilter,
	});

	return { body, colliders: [collider] };
}
