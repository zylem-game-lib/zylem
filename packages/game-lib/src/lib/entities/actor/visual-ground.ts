import {
	Box3,
	Bone,
	BufferAttribute,
	Group,
	Matrix4,
	Object3D,
	SkinnedMesh,
	Vector3,
} from 'three';
import type { ZylemActorOptions } from './types';

/** Minimum feet offset (group-local Y) before applying a visual grounding correction. */
export const VISUAL_GROUND_EPSILON = 1e-4;

/** Mixamo-style foot bones (exclude toe bases — toe tips sit below the sole). */
const FOOT_BONE_PATTERN = /foot$/i;

const _visualGroundScratch = new Vector3();
const _visualGroundBoxCorner = new Vector3();
const _skinnedVertex = new Vector3();
const _skinnedWeighted = new Vector3();
const _skinnedBoneMatrix = new Matrix4();

/**
 * Lowest world-space Y among deformed skinned-mesh vertices (current pose).
 */
function computeSkinnedMeshesMinWorldY(modelRoot: Object3D): number | null {
	let minWorldY = Infinity;
	let foundSkinnedMesh = false;

	modelRoot.traverse((node) => {
		if (!(node as SkinnedMesh).isSkinnedMesh) {
			return;
		}

		const mesh = node as SkinnedMesh;
		const geometry = mesh.geometry;
		const position = geometry.attributes.position as BufferAttribute | undefined;
		const skinIndex = geometry.attributes.skinIndex as BufferAttribute | undefined;
		const skinWeight = geometry.attributes.skinWeight as BufferAttribute | undefined;
		const skeleton = mesh.skeleton;
		if (!position || !skinIndex || !skinWeight || !skeleton) {
			return;
		}

		foundSkinnedMesh = true;
		skeleton.update();
		mesh.updateMatrixWorld(true);

		const boneMatrices = skeleton.boneMatrices;
		if (!boneMatrices) {
			return;
		}
		for (let vertexIndex = 0; vertexIndex < position.count; vertexIndex++) {
			_skinnedVertex.fromBufferAttribute(position, vertexIndex).applyMatrix4(mesh.bindMatrix);
			_skinnedWeighted.set(0, 0, 0);

			for (let weightIndex = 0; weightIndex < 4; weightIndex++) {
				const weight = skinWeight.getComponent(vertexIndex, weightIndex);
				if (weight === 0) {
					continue;
				}

				const boneIndex = skinIndex.getComponent(vertexIndex, weightIndex);
				_skinnedBoneMatrix.fromArray(boneMatrices, boneIndex * 16);
				_skinnedWeighted.addScaledVector(
					_visualGroundBoxCorner.copy(_skinnedVertex).applyMatrix4(_skinnedBoneMatrix),
					weight,
				);
			}

			_skinnedWeighted
				.applyMatrix4(mesh.bindMatrixInverse)
				.applyMatrix4(mesh.matrixWorld);
			minWorldY = Math.min(minWorldY, _skinnedWeighted.y);
		}
	});

	if (!foundSkinnedMesh || !Number.isFinite(minWorldY)) {
		return null;
	}

	return minWorldY;
}

/**
 * Returns world-space gap between the feet and the group origin (body anchor).
 */
export function computeVisualFeetGapWorld(modelRoot: Object3D, group: Group): number | null {
	group.updateMatrixWorld(true);
	const groupWorldY = group.getWorldPosition(_visualGroundScratch).y;

	let minWorldY = computeSkinnedMeshesMinWorldY(modelRoot) ?? Infinity;

	modelRoot.traverse((node) => {
		if (!(node as Bone).isBone || !FOOT_BONE_PATTERN.test(node.name)) {
			return;
		}
		node.getWorldPosition(_visualGroundScratch);
		minWorldY = Math.min(minWorldY, _visualGroundScratch.y);
	});

	if (!Number.isFinite(minWorldY)) {
		modelRoot.traverse((node) => {
			if (!(node as SkinnedMesh).isSkinnedMesh) {
				return;
			}
			const mesh = node as SkinnedMesh;
			mesh.computeBoundingBox();
			if (!mesh.boundingBox) {
				return;
			}
			const { min, max } = mesh.boundingBox;
			for (const corner of [
				[min.x, min.y, min.z],
				[min.x, min.y, max.z],
				[min.x, max.y, min.z],
				[min.x, max.y, max.z],
				[max.x, min.y, min.z],
				[max.x, min.y, max.z],
				[max.x, max.y, min.z],
				[max.x, max.y, max.z],
			]) {
				_visualGroundBoxCorner.set(corner[0], corner[1], corner[2]);
				_visualGroundBoxCorner.applyMatrix4(mesh.matrixWorld);
				minWorldY = Math.min(minWorldY, _visualGroundBoxCorner.y);
			}
		});
	}

	if (!Number.isFinite(minWorldY)) {
		const worldBox = new Box3().setFromObject(modelRoot);
		if (worldBox.isEmpty()) {
			return null;
		}
		minWorldY = worldBox.min.y;
	}

	return minWorldY - groupWorldY;
}

export function shouldStripRootMotionForActor(
	options: ZylemActorOptions,
	modelFile: string | undefined,
	animationPaths: string[],
): boolean {
	if (options.stripRootMotionY !== undefined) {
		return options.stripRootMotionY;
	}
	return Boolean(modelFile && animationPaths.some((path) => path === modelFile));
}
