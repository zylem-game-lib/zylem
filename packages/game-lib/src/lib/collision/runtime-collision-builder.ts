/**
 * Runtime-side collision builder. Emits plain `BodyConfig` + `ColliderConfig`
 * shapes ready to be uploaded to the wasm `StageSimulation` via
 * {@link WasmStageRuntime}. **No** Rapier types appear in this module — that's
 * the entire point: `@zylem/game-lib` should not depend on
 * `@dimforge/rapier3d-compat` once the migration is complete.
 *
 * The TS-side `CollisionBuilder` (in `collision-builder.ts`) is being phased
 * out in favor of these helpers; mirror its public surface (cuboid /
 * sphere / capsule / cylinder / convex hull / trimesh) so existing entity
 * factories can swap their implementation 1:1.
 */

import {
	StageBodyKind,
	type StageBodyConfig,
	type StageBodyKindValue,
	type StageColliderConfig,
	type StageColliderShape,
} from '@zylem/behaviors/core';
import { Vec3Input, normalizeVec3, VEC3_ZERO, VEC3_ONE } from '../core/vector';
import { packCollisionGroups } from './collision-builder';

export { packCollisionGroups };

/** Body-level options the host can override per entity. */
export interface RuntimeBodyOptions {
	kind?: StageBodyKindValue;
	position?: Vec3Input;
	rotation?: readonly [number, number, number, number];
	linearDamping?: number;
	angularDamping?: number;
	gravityScale?: number;
	canSleep?: boolean;
	ccdEnabled?: boolean;
	lockRotation?: readonly [boolean, boolean, boolean];
	lockTranslation?: readonly [boolean, boolean, boolean];
}

/** Collider-level options forwarded as-is from the legacy `CollisionOptions`. */
export interface RuntimeColliderOptions {
	offset?: Vec3Input;
	friction?: number;
	restitution?: number;
	sensor?: boolean;
	collisionType?: string;
	collisionFilter?: string[];
}

const DEFAULT_BODY: StageBodyConfig = {
	kind: StageBodyKind.Dynamic,
	position: [0, 0, 0],
	rotation: [0, 0, 0, 1],
	linearDamping: 0,
	angularDamping: 0,
	gravityScale: 1,
	canSleep: false,
	ccdEnabled: true,
	lockRotation: [false, false, false],
	lockTranslation: [false, false, false],
};

export function buildRuntimeBody(options: RuntimeBodyOptions = {}): StageBodyConfig {
	const position = normalizeVec3(options.position, VEC3_ZERO);
	return {
		kind: options.kind ?? DEFAULT_BODY.kind,
		position: [position.x, position.y, position.z],
		rotation: options.rotation ?? DEFAULT_BODY.rotation,
		linearDamping: options.linearDamping ?? DEFAULT_BODY.linearDamping,
		angularDamping: options.angularDamping ?? DEFAULT_BODY.angularDamping,
		gravityScale: options.gravityScale ?? DEFAULT_BODY.gravityScale,
		canSleep: options.canSleep ?? DEFAULT_BODY.canSleep,
		ccdEnabled: options.ccdEnabled ?? DEFAULT_BODY.ccdEnabled,
		lockRotation: options.lockRotation ?? DEFAULT_BODY.lockRotation,
		lockTranslation: options.lockTranslation ?? DEFAULT_BODY.lockTranslation,
	};
}

function buildCollider(shape: StageColliderShape, options: RuntimeColliderOptions): StageColliderConfig {
	const offset = normalizeVec3(options.offset, VEC3_ZERO);
	return {
		shape,
		offset: [offset.x, offset.y, offset.z],
		friction: options.friction ?? 0.5,
		restitution: options.restitution ?? 0,
		sensor: options.sensor ?? false,
		collisionGroups: packCollisionGroups(options.collisionType, options.collisionFilter),
	};
}

/** Cuboid collider sized as `size.xyz` (full extents — half-extents are computed). */
export function buildBoxCollider(size: Vec3Input, options: RuntimeColliderOptions = {}): StageColliderConfig {
	const s = normalizeVec3(size, VEC3_ONE);
	return buildCollider(
		{ type: 'box', halfExtents: [s.x / 2, s.y / 2, s.z / 2] },
		options,
	);
}

export function buildSphereCollider(radius: number, options: RuntimeColliderOptions = {}): StageColliderConfig {
	return buildCollider({ type: 'sphere', radius }, options);
}

export function buildCapsuleCollider(
	halfHeight: number,
	radius: number,
	options: RuntimeColliderOptions = {},
): StageColliderConfig {
	return buildCollider({ type: 'capsule', halfHeight, radius }, options);
}

export function buildCylinderCollider(
	halfHeight: number,
	radius: number,
	options: RuntimeColliderOptions = {},
): StageColliderConfig {
	return buildCollider({ type: 'cylinder', halfHeight, radius }, options);
}

export function buildConvexHullCollider(
	vertices: Float32Array,
	options: RuntimeColliderOptions = {},
): StageColliderConfig {
	return buildCollider({ type: 'convexHull', vertices }, options);
}

export function buildTrimeshCollider(
	vertices: Float32Array,
	indices: Uint32Array,
	options: RuntimeColliderOptions = {},
): StageColliderConfig {
	return buildCollider({ type: 'trimesh', vertices, indices }, options);
}

export function buildHeightfieldCollider(
	rows: number,
	cols: number,
	heights: Float32Array,
	scale: readonly [number, number, number],
	options: RuntimeColliderOptions = {},
): StageColliderConfig {
	return buildCollider(
		{ type: 'heightfield', rows, cols, heights, scale },
		options,
	);
}

/** Convenience: bundle a body + a list of colliders, the shape entity factories want. */
export interface RuntimeCollisionBundle {
	body: StageBodyConfig;
	colliders: StageColliderConfig[];
}

export function bundleRuntimeCollision(
	body: StageBodyConfig,
	colliders: StageColliderConfig[],
): RuntimeCollisionBundle {
	return { body, colliders };
}
