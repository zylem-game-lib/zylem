import type { RigidBodyDesc, ColliderDesc } from '@dimforge/rapier3d-compat';
import { RigidBodyType } from '@dimforge/rapier3d-compat';
import type {
	SerializableBodyDesc,
	SerializableBodyType,
	SerializableColliderDesc,
	ColliderShapeKind,
	SerializableCharacterController,
} from './physics-protocol';

/**
 * Convert a Rapier RigidBodyDesc to a plain serializable object.
 *
 * Rapier descriptors are WASM-backed class instances that cannot cross
 * the postMessage boundary. This extracts the relevant data into a
 * JSON-safe format that the worker can reconstruct.
 */
export function serializeBodyDesc(desc: RigidBodyDesc): SerializableBodyDesc {
	const status = (desc as any).status as number;
	let type: SerializableBodyType = 'dynamic';
	if (status === RigidBodyType.Fixed) type = 'fixed';
	else if (status === RigidBodyType.KinematicPositionBased) type = 'kinematicPositionBased';
	else if (status === RigidBodyType.KinematicVelocityBased) type = 'kinematicVelocityBased';

	const t = (desc as any).translation ?? { x: 0, y: 0, z: 0 };

	return {
		type,
		translation: [t.x ?? 0, t.y ?? 0, t.z ?? 0],
		gravityScale: (desc as any).gravityScale ?? 1,
		canSleep: (desc as any).canSleep ?? false,
		ccdEnabled: (desc as any).ccdEnabled ?? true,
	};
}

/**
 * Convert a Rapier ColliderDesc to a plain serializable object.
 *
 * Because Rapier's ColliderDesc uses opaque shape enums and internal
 * buffers, we infer the shape from the descriptor's internal type tag
 * and extract the numeric dimensions.
 */
export function serializeColliderDesc(desc: ColliderDesc): SerializableColliderDesc {
	const internal = desc as any;
	const shapeType = internal.shape?.type ?? internal.shapeType ?? 0;

	const { shape, dimensions, heightfieldMeta } = extractShapeData(shapeType, internal);

	const result: SerializableColliderDesc = {
		shape,
		dimensions,
	};

	const t = internal.translation;
	if (t && (t.x !== 0 || t.y !== 0 || t.z !== 0)) {
		result.translation = [t.x, t.y, t.z];
	}

	if (internal.isSensor) {
		result.sensor = true;
	}

	if (internal.collisionGroups !== undefined && internal.collisionGroups !== 0xFFFFFFFF) {
		result.collisionGroups = internal.collisionGroups;
	}

	if (internal.activeCollisionTypes !== undefined) {
		result.activeCollisionTypes = internal.activeCollisionTypes;
	}

	if (heightfieldMeta) {
		result.heightfieldMeta = heightfieldMeta;
	}

	return result;
}

/**
 * Create a serializable character controller descriptor.
 */
export function serializeCharacterController(): SerializableCharacterController {
	return {
		offset: 0.01,
		maxSlopeClimbAngle: 45 * Math.PI / 180,
		minSlopeSlideAngle: 30 * Math.PI / 180,
		snapToGroundDistance: 0.01,
		slideEnabled: true,
		applyImpulsesToDynamic: true,
		characterMass: 1,
	};
}

// ─── Shape Extraction ──────────────────────────────────────────────────────

/**
 * Rapier shape type enum values (from rapier internals):
 *   0 = Ball, 1 = Cuboid, 2 = Capsule, 6 = Cone, 7 = Cylinder,
 *   11 = HeightField
 */
function extractShapeData(
	shapeType: number,
	internal: any,
): { shape: ColliderShapeKind; dimensions: number[]; heightfieldMeta?: { nrows: number; ncols: number } } {
	switch (shapeType) {
		case 0: // Ball
			return {
				shape: 'ball',
				dimensions: [internal.shape?.radius ?? internal.halfExtents?.x ?? 1],
			};
		case 1: // Cuboid
			return {
				shape: 'cuboid',
				dimensions: [
					internal.shape?.halfExtents?.x ?? internal.halfExtents?.x ?? 0.5,
					internal.shape?.halfExtents?.y ?? internal.halfExtents?.y ?? 0.5,
					internal.shape?.halfExtents?.z ?? internal.halfExtents?.z ?? 0.5,
				],
			};
		case 2: // Capsule
			return {
				shape: 'capsule',
				dimensions: [
					internal.shape?.halfHeight ?? 0.5,
					internal.shape?.radius ?? 0.5,
				],
			};
		case 6: // Cone
			return {
				shape: 'cone',
				dimensions: [
					internal.shape?.halfHeight ?? 1,
					internal.shape?.radius ?? 1,
				],
			};
		case 7: // Cylinder
			return {
				shape: 'cylinder',
				dimensions: [
					internal.shape?.halfHeight ?? 1,
					internal.shape?.radius ?? 1,
				],
			};
		case 11: { // HeightField
			const nrows = internal.shape?.nrows ?? 10;
			const ncols = internal.shape?.ncols ?? 10;
			const heights = internal.shape?.heights;
			return {
				shape: 'heightfield',
				dimensions: heights ? Array.from(heights) : [],
				heightfieldMeta: { nrows, ncols },
			};
		}
		default:
			return { shape: 'cuboid', dimensions: [0.5, 0.5, 0.5] };
	}
}
