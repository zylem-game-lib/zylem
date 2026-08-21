/**
 * Geometry for the add tool's placement click.
 *
 * Split out from `StageDebugDelegate` because it is pure: rays and bounds in,
 * a position out, with no scene, world, or entity state involved. Placement is
 * also the part most worth pinning down — the fallback plane and the surface
 * offset are what make a click into empty space land somewhere sensible.
 */

import { Vector3 } from 'three';
import { snapVec3 } from '../core/transform-math';
import type { GizmoRay } from '../debug/transform-gizmo';

/** Height of the fallback construction plane. */
export const CONSTRUCTION_PLANE_Y = 0;

/** A ray/collider intersection, as reported by the physics world. */
export interface PlacementHit {
	distance: number;
	normal: [number, number, number];
}

export interface PlacementPoint {
	position: Vector3;
	/** Surface normal at the point; up when resolved against the plane. */
	normal: Vector3;
}

/**
 * Where a placement click lands, and the surface normal there.
 *
 * Two steps, because clicking into empty sky is the common case when building a
 * scene from nothing: a physics hit wins, so the entity lands on whatever it was
 * dropped onto, and otherwise the ray meets the y=0 construction plane.
 *
 * @returns `null` when the ray can never reach the plane — parallel to it, or
 * pointing away from it — where there is no sensible point to place at.
 */
export function resolvePlacementPoint(
	ray: GizmoRay,
	hit: PlacementHit | null,
): PlacementPoint | null {
	if (hit) {
		return {
			position: ray.origin.clone().add(ray.direction.clone().multiplyScalar(hit.distance)),
			normal: new Vector3(hit.normal[0], hit.normal[1], hit.normal[2]),
		};
	}

	if (Math.abs(ray.direction.y) < 1e-6) return null;
	const distance = (CONSTRUCTION_PLANE_Y - ray.origin.y) / ray.direction.y;
	if (distance < 0) return null;

	return {
		position: ray.origin.clone().add(ray.direction.clone().multiplyScalar(distance)),
		normal: new Vector3(0, 1, 0),
	};
}

/**
 * How far to push an entity of `size` out along `normal` so it rests on the
 * surface rather than sinking halfway into it.
 *
 * The extent is measured along the normal, so a flat plate dropped on the floor
 * lifts by its thin axis instead of its wide one.
 */
export function surfaceRestOffset(size: Vector3, normal: Vector3): number {
	if (normal.lengthSq() < 1e-8) return 0;
	const direction = normal.clone().normalize();
	return (
		(Math.abs(direction.x) * size.x
			+ Math.abs(direction.y) * size.y
			+ Math.abs(direction.z) * size.z) / 2
	);
}

/** The point an entity of `size` should sit at when placed on a surface. */
export function restPositionOnSurface(
	position: Vector3,
	size: Vector3,
	normal: Vector3,
): Vector3 {
	const offset = surfaceRestOffset(size, normal);
	if (offset <= 0) return position.clone();
	return position.clone().add(normal.clone().normalize().multiplyScalar(offset));
}

/** The translation half of the editor's snap settings. */
export interface PlacementSnap {
	enabled: boolean;
	/** World units per translation step. */
	translate: number;
}

/**
 * The full placement pipeline: where the ray lands, snapped to the lattice, then
 * lifted to rest on the surface.
 *
 * One function so the preview ghost and the click that spawns for real cannot
 * disagree. If they computed this separately, the ghost would drift from where
 * the entity actually lands and the preview would be a lie.
 *
 * `size` is the entity's world-space bounds, which only exist once it has a
 * mesh. The ghost measures its own; a real placement is lifted after spawn by
 * the same {@link restPositionOnSurface}. Omit it to get the un-lifted point.
 */
export function computePlacementPose(
	ray: GizmoRay,
	hit: PlacementHit | null,
	snap: PlacementSnap,
	size?: Vector3 | null,
): PlacementPoint | null {
	const resolved = resolvePlacementPoint(ray, hit);
	if (!resolved) return null;

	const { normal } = resolved;
	const lattice = snap.enabled
		? snapVec3(resolved.position, snap.translate)
		: resolved.position;
	const snapped = new Vector3(lattice.x, lattice.y, lattice.z);

	return {
		position: size ? restPositionOnSurface(snapped, size, normal) : snapped,
		normal,
	};
}
