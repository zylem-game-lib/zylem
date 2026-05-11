import type { ColliderDesc } from '@dimforge/rapier3d-compat';

/**
 * Subset of Rapier shape kinds that game-lib introspects for sizing decisions
 * (e.g. ground probes derive their cast box from the entity collider). Mirrors
 * the public Rapier shape vocabulary, kept as string literals so callers can
 * branch without depending on Rapier's internal shape enum.
 */
export type ColliderShapeKind =
	| 'ball'
	| 'cuboid'
	| 'capsule'
	| 'cone'
	| 'cylinder'
	| 'heightfield'
	| 'convexHull'
	| 'trimesh';

/**
 * Plain, runtime-agnostic snapshot of a {@link ColliderDesc}'s shape and
 * placement. Only contains the fields game-lib needs today; extend as new
 * call sites appear.
 *
 * - `shape` — discriminator for the underlying Rapier shape.
 * - `dimensions` — shape-specific numbers (see {@link inspectColliderDesc}).
 * - `translation` — local offset relative to the parent body, when set.
 * - `vertices` / `indices` — raw geometry payload for `convexHull` and
 *   `trimesh` shapes; tagged via `__zylemShapeData` at construction time.
 */
export interface ColliderDescInspection {
	shape: ColliderShapeKind;
	dimensions: number[];
	translation?: [number, number, number];
	vertices?: number[];
	indices?: number[];
}

/**
 * Read the shape kind, dimensions, and local translation off a Rapier
 * {@link ColliderDesc} without going through the WASM-backed accessors that
 * cannot cross worker boundaries.
 *
 * Layout per shape (matches Rapier's primitive constructors):
 * - `ball`        → `[radius]`
 * - `cuboid`      → `[halfX, halfY, halfZ]`
 * - `capsule`     → `[halfHeight, radius]`
 * - `cone`        → `[halfHeight, radius]`
 * - `cylinder`    → `[halfHeight, radius]`
 * - `heightfield` → flattened heights array
 * - `convexHull`  → flattened vertex array (set via the `__zylemShapeData` tag)
 * - `trimesh`     → flattened vertex array (indices ignored here)
 */
export function inspectColliderDesc(desc: ColliderDesc): ColliderDescInspection {
	const internal = desc as any;
	const customShapeData = internal.__zylemShapeData as
		| { shape: 'convexHull'; vertices: number[] }
		| { shape: 'trimesh'; vertices: number[]; indices: number[] }
		| undefined;

	if (customShapeData?.shape === 'convexHull') {
		const result = finalize('convexHull', [], internal);
		result.vertices = [...customShapeData.vertices];
		return result;
	}
	if (customShapeData?.shape === 'trimesh') {
		const result = finalize('trimesh', [], internal);
		result.vertices = [...customShapeData.vertices];
		result.indices = [...customShapeData.indices];
		return result;
	}

	const shapeType = internal.shape?.type ?? internal.shapeType ?? 0;
	const { shape, dimensions } = extractShapeData(shapeType, internal);
	return finalize(shape, dimensions, internal);
}

function finalize(
	shape: ColliderShapeKind,
	dimensions: number[],
	internal: any,
): ColliderDescInspection {
	const result: ColliderDescInspection = { shape, dimensions };
	const t = internal.translation;
	if (t && (t.x !== 0 || t.y !== 0 || t.z !== 0)) {
		result.translation = [t.x, t.y, t.z];
	}
	return result;
}

/**
 * Rapier shape type enum values (from rapier internals):
 *   0 = Ball, 1 = Cuboid, 2 = Capsule, 6 = Cone, 7 = Cylinder, 11 = HeightField
 */
function extractShapeData(
	shapeType: number,
	internal: any,
): { shape: ColliderShapeKind; dimensions: number[] } {
	switch (shapeType) {
		case 0:
			return {
				shape: 'ball',
				dimensions: [internal.shape?.radius ?? internal.halfExtents?.x ?? 1],
			};
		case 1:
			return {
				shape: 'cuboid',
				dimensions: [
					internal.shape?.halfExtents?.x ?? internal.halfExtents?.x ?? 0.5,
					internal.shape?.halfExtents?.y ?? internal.halfExtents?.y ?? 0.5,
					internal.shape?.halfExtents?.z ?? internal.halfExtents?.z ?? 0.5,
				],
			};
		case 2:
			return {
				shape: 'capsule',
				dimensions: [
					internal.shape?.halfHeight ?? 0.5,
					internal.shape?.radius ?? 0.5,
				],
			};
		case 6:
			return {
				shape: 'cone',
				dimensions: [
					internal.shape?.halfHeight ?? 1,
					internal.shape?.radius ?? 1,
				],
			};
		case 7:
			return {
				shape: 'cylinder',
				dimensions: [
					internal.shape?.halfHeight ?? 1,
					internal.shape?.radius ?? 1,
				],
			};
		case 11: {
			const heights = internal.shape?.heights;
			return {
				shape: 'heightfield',
				dimensions: heights ? Array.from(heights) : [],
			};
		}
		default:
			return { shape: 'cuboid', dimensions: [0.5, 0.5, 0.5] };
	}
}
