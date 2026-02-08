import {
	ActiveCollisionTypes,
	ColliderDesc,
	RigidBodyDesc,
	RigidBodyType,
} from '@dimforge/rapier3d-compat';
import { Vector3 } from 'three';
import type { Vec3 } from '../../core/vector';
import {
	getOrCreateCollisionGroupId,
	createCollisionFilter,
	type CollisionOptions,
} from '../../collision/collision-builder';

// ─────────────────────────────────────────────────────────────────────────────
// CollisionComponent type returned by all collision factories
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A built collision component containing a rigid body description and collider description.
 * Returned by collision factory functions (boxCollision, sphereCollision, etc.)
 * and consumed by GameEntity.add().
 */
export interface CollisionComponent {
	__kind: 'collision';
	bodyDesc: RigidBodyDesc;
	colliderDesc: ColliderDesc;
}

/**
 * Type guard for CollisionComponent.
 */
export function isCollisionComponent(obj: any): obj is CollisionComponent {
	return obj && obj.__kind === 'collision';
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

interface BaseCollisionOptions {
	/** Whether the body is static (fixed) or dynamic */
	static?: boolean;
	/** Whether this collider is a sensor */
	sensor?: boolean;
	/** Position offset relative to the entity origin */
	offset?: Vec3;
	/** Collision type string for group filtering */
	collisionType?: string;
	/** Allowed collision types for filtering */
	collisionFilter?: string[];
}

function buildBodyDesc(isStatic: boolean): RigidBodyDesc {
	const type = isStatic ? RigidBodyType.Fixed : RigidBodyType.Dynamic;
	return new RigidBodyDesc(type)
		.setTranslation(0, 0, 0)
		.setGravityScale(1.0)
		.setCanSleep(false)
		.setCcdEnabled(true);
}

function applyCollisionOptions(
	colliderDesc: ColliderDesc,
	opts: BaseCollisionOptions,
): void {
	if (opts.offset) {
		colliderDesc.setTranslation(opts.offset.x, opts.offset.y, opts.offset.z);
	}
	if (opts.sensor) {
		colliderDesc.setSensor(true);
		colliderDesc.activeCollisionTypes = ActiveCollisionTypes.KINEMATIC_FIXED;
	}
	if (opts.collisionType) {
		const groupId = getOrCreateCollisionGroupId(opts.collisionType);
		let filter = 0b1111111111111111;
		if (opts.collisionFilter) {
			filter = createCollisionFilter(opts.collisionFilter);
		}
		colliderDesc.setCollisionGroups((groupId << 16) | filter);
	}
}

function makeComponent(
	colliderDesc: ColliderDesc,
	opts: BaseCollisionOptions,
): CollisionComponent {
	applyCollisionOptions(colliderDesc, opts);
	return {
		__kind: 'collision',
		bodyDesc: buildBodyDesc(opts.static ?? false),
		colliderDesc,
	};
}

// ─────────────────────────────────────────────────────────────────────────────
// Box
// ─────────────────────────────────────────────────────────────────────────────

export interface BoxCollisionOptions extends BaseCollisionOptions {
	/** Box dimensions (default: 1x1x1) */
	size?: Vec3;
}

/**
 * Create a box (cuboid) collision component.
 */
export function boxCollision(opts: BoxCollisionOptions = {}): CollisionComponent {
	const size = opts.size ?? { x: 1, y: 1, z: 1 };
	const desc = ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2);
	return makeComponent(desc, opts);
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
	const desc = ColliderDesc.ball(opts.radius ?? 1);
	return makeComponent(desc, opts);
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
	const desc = ColliderDesc.cone(height / 2, radius);
	return makeComponent(desc, opts);
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
	const desc = ColliderDesc.cone(height / 2, radius);
	return makeComponent(desc, opts);
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
	const desc = ColliderDesc.cylinder(height / 2, radius);
	return makeComponent(desc, opts);
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
	const desc = ColliderDesc.capsule(length / 2, radius);
	return makeComponent(desc, opts);
}

// ─────────────────────────────────────────────────────────────────────────────
// Plane (heightfield)
// ─────────────────────────────────────────────────────────────────────────────

export interface PlaneCollisionOptions extends BaseCollisionOptions {
	/** Tile dimensions (default: 10x10) */
	tile?: { x: number; y: number };
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
	const tile = opts.tile ?? { x: 10, y: 10 };
	const subdivisions = opts.subdivisions ?? 10;
	const size = new Vector3(tile.x, 1, tile.y);

	const totalVerts = (subdivisions + 1) * (subdivisions + 1);
	const heightData = opts.heightData ?? new Float32Array(totalVerts);

	const desc = ColliderDesc.heightfield(
		subdivisions,
		subdivisions,
		heightData,
		size,
	);

	return makeComponent(desc, { ...opts, static: opts.static ?? true });
}

// ─────────────────────────────────────────────────────────────────────────────
// Zone (sensor cuboid)
// ─────────────────────────────────────────────────────────────────────────────

export interface ZoneCollisionOptions extends BaseCollisionOptions {
	/** Zone dimensions (default: 1x1x1) */
	size?: Vec3;
}

/**
 * Create a zone (sensor cuboid) collision component.
 * Always a sensor; static by default.
 */
export function zoneCollision(opts: ZoneCollisionOptions = {}): CollisionComponent {
	const size = opts.size ?? { x: 1, y: 1, z: 1 };
	const desc = ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2);
	desc.setSensor(true);
	desc.activeCollisionTypes = ActiveCollisionTypes.KINEMATIC_FIXED;
	return makeComponent(desc, { ...opts, static: opts.static ?? true, sensor: true });
}
