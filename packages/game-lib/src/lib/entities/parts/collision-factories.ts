import {
	StageBodyKind,
	type SimulationBodyDefinition,
	type SimulationColliderDefinition,
} from '@zylem/behaviors/core';
import {
	VEC3_ONE,
	VEC3_ZERO,
	type Vec2Input,
	type Vec3Input,
	normalizeVec2,
	normalizeVec3,
} from '../../core/vector';
import {
	normalizeLockAxes,
	packCollisionGroups,
	type CollisionOptions,
	type LockAxesInput,
} from '../../collision/collision-builder';
import { deepCloneValue } from '../../core/clone-utils';

// ─────────────────────────────────────────────────────────────────────────────
// CollisionComponent type returned by all collision factories
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A built collision component containing plain body and collider definitions
 * for the behaviors `Simulation`. Returned by collision factory functions
 * (boxCollision, sphereCollision, etc.) and consumed by GameEntity.add().
 */
export interface CollisionComponent {
	__kind: 'collision';
	bodyDesc: SimulationBodyDefinition;
	colliderDesc: SimulationColliderDefinition;
	cloneComponent: () => CollisionComponent;
}

/**
 * Type guard for CollisionComponent.
 */
export function isCollisionComponent(obj: any): obj is CollisionComponent {
	return obj && obj.__kind === 'collision';
}

export function cloneCollisionComponent(component: CollisionComponent): CollisionComponent {
	return component.cloneComponent();
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

interface BaseCollisionOptions {
	/** Whether the body is static (fixed) or dynamic */
	static?: boolean;
	/** Whether this collider is a sensor */
	sensor?: boolean;
	/** Allow the body to sleep when at rest (recommended for bulk dynamic scenes) */
	canSleep?: boolean;
	/** Continuous collision detection (expensive at scale; disable for small boxes) */
	ccdEnabled?: boolean;
	/** Position offset relative to the entity origin */
	offset?: Vec3Input;
	/** Collision type string for group filtering */
	collisionType?: string;
	/** Allowed collision types for filtering */
	collisionFilter?: string[];
	/** Gravity scale applied at body spawn (no live setter FFI; default 1). */
	gravityScale?: number;
	/** Lock rotation axes at body spawn: `true` for all, or per-axis tuple. */
	lockRotations?: LockAxesInput;
	/** Lock translation axes at body spawn: `true` for all, or per-axis tuple. */
	lockTranslations?: LockAxesInput;
}

function buildBodyDef(isStatic: boolean, opts: BaseCollisionOptions): SimulationBodyDefinition {
	const def: SimulationBodyDefinition = {
		kind: isStatic ? StageBodyKind.Static : StageBodyKind.Dynamic,
		position: [0, 0, 0],
		gravityScale: opts.gravityScale ?? 1,
		canSleep: opts.canSleep ?? false,
		ccdEnabled: opts.ccdEnabled ?? true,
	};
	const lockRotation = normalizeLockAxes(opts.lockRotations);
	if (lockRotation) {
		def.lockRotation = lockRotation;
	}
	const lockTranslation = normalizeLockAxes(opts.lockTranslations);
	if (lockTranslation) {
		def.lockTranslation = lockTranslation;
	}
	return def;
}

function applyCollisionOptions(
	colliderDef: SimulationColliderDefinition,
	opts: BaseCollisionOptions,
): void {
	if (opts.offset) {
		const offset = normalizeVec3(opts.offset, VEC3_ZERO);
		colliderDef.offset = [offset.x, offset.y, offset.z];
	}
	if (opts.sensor) {
		colliderDef.sensor = true;
	}
	if (opts.collisionType) {
		colliderDef.collisionGroups = packCollisionGroups(
			opts.collisionType,
			opts.collisionFilter,
		);
	}
}

function makeComponent(
	colliderDef: SimulationColliderDefinition,
	opts: BaseCollisionOptions,
	cloneComponentFactory: () => CollisionComponent,
): CollisionComponent {
	applyCollisionOptions(colliderDef, opts);
	return {
		__kind: 'collision',
		bodyDesc: buildBodyDef(opts.static ?? false, opts),
		colliderDesc: colliderDef,
		cloneComponent: cloneComponentFactory,
	};
}

// ─────────────────────────────────────────────────────────────────────────────
// Box
// ─────────────────────────────────────────────────────────────────────────────

export interface BoxCollisionOptions extends BaseCollisionOptions {
	/** Box dimensions (default: 1x1x1) */
	size?: Vec3Input;
}

/**
 * Create a box (cuboid) collision component.
 */
export function boxCollision(opts: BoxCollisionOptions = {}): CollisionComponent {
	const size = normalizeVec3(opts.size, VEC3_ONE);
	const def: SimulationColliderDefinition = {
		shape: { type: 'box', halfExtents: [size.x / 2, size.y / 2, size.z / 2] },
	};
	const clonedOpts = deepCloneValue(opts);
	return makeComponent(def, opts, () => boxCollision(clonedOpts));
}

// ─────────────────────────────────────────────────────────────────────────────
// Sphere
// ─────────────────────────────────────────────────────────────────────────────

export interface SphereCollisionOptions extends BaseCollisionOptions {
	/** Sphere radius (default: 1) */
	radius?: number;
}

/**
 * Create a sphere (ball) collision component.
 */
export function sphereCollision(opts: SphereCollisionOptions = {}): CollisionComponent {
	const def: SimulationColliderDefinition = {
		shape: { type: 'sphere', radius: opts.radius ?? 1 },
	};
	const clonedOpts = deepCloneValue(opts);
	return makeComponent(def, opts, () => sphereCollision(clonedOpts));
}

// ─────────────────────────────────────────────────────────────────────────────
// Cone
// ─────────────────────────────────────────────────────────────────────────────

export interface ConeCollisionOptions extends BaseCollisionOptions {
	/** Base radius (default: 1) */
	radius?: number;
	/** Height (default: 2) */
	height?: number;
}

/**
 * Create a cone collision component.
 */
export function coneCollision(opts: ConeCollisionOptions = {}): CollisionComponent {
	const radius = opts.radius ?? 1;
	const height = opts.height ?? 2;
	const def: SimulationColliderDefinition = {
		shape: { type: 'cone', halfHeight: height / 2, radius },
	};
	const clonedOpts = deepCloneValue(opts);
	return makeComponent(def, opts, () => coneCollision(clonedOpts));
}

// ─────────────────────────────────────────────────────────────────────────────
// Pyramid (cone collider with 4-sided visual approximation)
// ─────────────────────────────────────────────────────────────────────────────

export interface PyramidCollisionOptions extends BaseCollisionOptions {
	/** Base radius (default: 1) */
	radius?: number;
	/** Height (default: 2) */
	height?: number;
}

/**
 * Create a pyramid collision component (approximated as a cone).
 */
export function pyramidCollision(opts: PyramidCollisionOptions = {}): CollisionComponent {
	const radius = opts.radius ?? 1;
	const height = opts.height ?? 2;
	const def: SimulationColliderDefinition = {
		shape: { type: 'cone', halfHeight: height / 2, radius },
	};
	const clonedOpts = deepCloneValue(opts);
	return makeComponent(def, opts, () => pyramidCollision(clonedOpts));
}

// ─────────────────────────────────────────────────────────────────────────────
// Cylinder
// ─────────────────────────────────────────────────────────────────────────────

export interface CylinderCollisionOptions extends BaseCollisionOptions {
	/** Top radius (default: 1) */
	radiusTop?: number;
	/** Bottom radius (default: 1) */
	radiusBottom?: number;
	/** Height (default: 2) */
	height?: number;
}

/**
 * Create a cylinder collision component.
 */
export function cylinderCollision(opts: CylinderCollisionOptions = {}): CollisionComponent {
	const radius = Math.max(opts.radiusTop ?? 1, opts.radiusBottom ?? 1);
	const height = opts.height ?? 2;
	const def: SimulationColliderDefinition = {
		shape: { type: 'cylinder', halfHeight: height / 2, radius },
	};
	const clonedOpts = deepCloneValue(opts);
	return makeComponent(def, opts, () => cylinderCollision(clonedOpts));
}

// ─────────────────────────────────────────────────────────────────────────────
// Pill (capsule)
// ─────────────────────────────────────────────────────────────────────────────

export interface PillCollisionOptions extends BaseCollisionOptions {
	/** Capsule hemisphere radius (default: 0.5) */
	radius?: number;
	/** Cylindrical section length (default: 1) */
	length?: number;
}

/**
 * Create a pill (capsule) collision component.
 */
export function pillCollision(opts: PillCollisionOptions = {}): CollisionComponent {
	const radius = opts.radius ?? 0.5;
	const length = opts.length ?? 1;
	const def: SimulationColliderDefinition = {
		shape: { type: 'capsule', halfHeight: length / 2, radius },
	};
	const clonedOpts = deepCloneValue(opts);
	return makeComponent(def, opts, () => pillCollision(clonedOpts));
}

// ─────────────────────────────────────────────────────────────────────────────
// Plane (heightfield)
// ─────────────────────────────────────────────────────────────────────────────

export interface PlaneCollisionOptions extends BaseCollisionOptions {
	/** Tile dimensions (default: 10x10) */
	tile?: Vec2Input;
	/** Number of subdivisions per axis (default: 10) */
	subdivisions?: number;
	/** Pre-computed height data for the heightfield */
	heightData?: Float32Array;
}

/**
 * Create a plane (heightfield) collision component.
 * For flat planes, pass no heightData — a zeroed heightfield is used.
 */
export function planeCollision(opts: PlaneCollisionOptions = {}): CollisionComponent {
	const tile = normalizeVec2(opts.tile, { x: 10, y: 10 });
	const subdivisions = opts.subdivisions ?? 10;

	const totalVerts = (subdivisions + 1) * (subdivisions + 1);
	const heightData = opts.heightData ?? new Float32Array(totalVerts);

	const def: SimulationColliderDefinition = {
		shape: {
			type: 'heightfield',
			rows: subdivisions,
			cols: subdivisions,
			heights: heightData,
			scale: [tile.x, 1, tile.y],
		},
	};

	const effectiveOpts = { ...opts, static: opts.static ?? true };
	const clonedOpts = deepCloneValue(effectiveOpts);
	return makeComponent(def, effectiveOpts, () => planeCollision(clonedOpts));
}

// ─────────────────────────────────────────────────────────────────────────────
// Zone (sensor cuboid)
// ─────────────────────────────────────────────────────────────────────────────

export interface ZoneCollisionOptions extends BaseCollisionOptions {
	/** Zone dimensions (default: 1x1x1) */
	size?: Vec3Input;
}

/**
 * Create a zone (sensor cuboid) collision component.
 * Always a sensor; static by default.
 */
export function zoneCollision(opts: ZoneCollisionOptions = {}): CollisionComponent {
	const size = normalizeVec3(opts.size, VEC3_ONE);
	const def: SimulationColliderDefinition = {
		shape: { type: 'box', halfExtents: [size.x / 2, size.y / 2, size.z / 2] },
		sensor: true,
	};
	const effectiveOpts = { ...opts, static: opts.static ?? true, sensor: true };
	const clonedOpts = deepCloneValue(effectiveOpts);
	return makeComponent(def, effectiveOpts, () => zoneCollision(clonedOpts));
}
