import { Material, Mesh, Object3D } from 'three';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';

/**
 * Clone a model hierarchy with independent mesh resources.
 *
 * SkeletonUtils preserves skinned mesh bindings, then we deep-clone
 * geometry/material so per-instance overrides and disposal are safe.
 */
export function cloneModelObject(object: Object3D): Object3D {
	const clonedObject = cloneSkeleton(object);
	const originalNodes: Object3D[] = [];
	const clonedNodes: Object3D[] = [];

	object.traverse((node) => originalNodes.push(node));
	clonedObject.traverse((node) => clonedNodes.push(node));

	for (let i = 0; i < originalNodes.length; i++) {
		const originalNode = originalNodes[i];
		const clonedNode = clonedNodes[i];
		if (!(originalNode instanceof Mesh) || !(clonedNode instanceof Mesh)) {
			continue;
		}

		if (originalNode.geometry?.clone) {
			clonedNode.geometry = originalNode.geometry.clone();
		}

		if (!originalNode.material) {
			continue;
		}

		clonedNode.material = Array.isArray(originalNode.material)
			? originalNode.material.map((material: Material) => material.clone())
			: originalNode.material.clone();
	}

	return clonedObject;
}
