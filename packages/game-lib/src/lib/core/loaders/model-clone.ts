import { BufferGeometry, Material, Mesh, Object3D, Points } from 'three';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { isGaussianSplatNode } from './gaussian-model';

type GaussianSplatNode = Mesh & {
	isGaussianSplat?: boolean;
	splatGeometry?: BufferGeometry;
	autoSort?: boolean;
};

const SPLAT_SOURCE_KEY = '__zylemSplatSource';

/**
 * Clone a model hierarchy with independent mesh resources.
 *
 * SkeletonUtils preserves skinned mesh bindings, then we deep-clone
 * geometry/material so per-instance overrides and disposal are safe.
 * GaussianSplat cannot use Object3D.clone() (its constructor requires the
 * capture geometry), so those nodes are swapped out and rebuilt from
 * `splatGeometry`.
 */
export function cloneModelObject(object: Object3D): Object3D {
	if (isGaussianSplatNode(object)) {
		return cloneGaussianNode(object as GaussianSplatNode);
	}

	const sources: GaussianSplatNode[] = [];
	const swaps: Array<{ parent: Object3D; index: number; splat: GaussianSplatNode; placeholder: Object3D }> = [];
	object.traverse((node) => {
		if (isGaussianSplatNode(node)) {
			sources.push(node as GaussianSplatNode);
		}
	});

	for (const splat of sources) {
		const parent = splat.parent;
		if (!parent) {
			continue;
		}
		const index = parent.children.indexOf(splat);
		const placeholder = new Object3D();
		placeholder.name = splat.name;
		placeholder.position.copy(splat.position);
		placeholder.quaternion.copy(splat.quaternion);
		placeholder.scale.copy(splat.scale);
		placeholder.userData[SPLAT_SOURCE_KEY] = sources.indexOf(splat);
		parent.children[index] = placeholder;
		placeholder.parent = parent;
		splat.parent = null;
		swaps.push({ parent, index, splat, placeholder });
	}

	try {
		const clonedObject = cloneRenderableHierarchy(object);
		replaceSplatPlaceholders(clonedObject, sources);
		return clonedObject;
	} finally {
		for (const swap of swaps) {
			swap.parent.children[swap.index] = swap.splat;
			swap.splat.parent = swap.parent;
			swap.placeholder.parent = null;
		}
	}
}

function cloneGaussianNode(source: GaussianSplatNode): Object3D {
	const geometry = source.splatGeometry;
	if (!geometry) {
		throw new Error('Cannot clone a Gaussian splat that has no capture geometry.');
	}
	const SplatConstructor = source.constructor as new (
		splatGeometry: BufferGeometry,
		options?: { autoSort?: boolean },
	) => GaussianSplatNode;
	const cloned = new SplatConstructor(geometry.clone(), { autoSort: source.autoSort !== false });
	cloned.name = source.name;
	cloned.visible = source.visible;
	cloned.position.copy(source.position);
	cloned.quaternion.copy(source.quaternion);
	cloned.scale.copy(source.scale);
	cloned.userData = { ...source.userData };
	for (const child of source.children) {
		cloned.add(cloneModelObject(child));
	}
	return cloned;
}

function replaceSplatPlaceholders(root: Object3D, sources: GaussianSplatNode[]): void {
	const placeholders: Object3D[] = [];
	root.traverse((node) => {
		if (typeof node.userData[SPLAT_SOURCE_KEY] === 'number') {
			placeholders.push(node);
		}
	});
	for (const placeholder of placeholders) {
		const parent = placeholder.parent;
		const source = sources[placeholder.userData[SPLAT_SOURCE_KEY] as number];
		if (!parent || !source) {
			continue;
		}
		const index = parent.children.indexOf(placeholder);
		const cloned = cloneGaussianNode(source);
		parent.remove(placeholder);
		parent.children.splice(index, 0, cloned);
		cloned.parent = parent;
	}
}

function cloneRenderableHierarchy(object: Object3D): Object3D {
	const clonedObject = cloneSkeleton(object);
	const originalNodes: Object3D[] = [];
	const clonedNodes: Object3D[] = [];

	object.traverse((node) => originalNodes.push(node));
	clonedObject.traverse((node) => clonedNodes.push(node));

	for (let i = 0; i < originalNodes.length; i++) {
		const originalNode = originalNodes[i];
		const clonedNode = clonedNodes[i];
		if (originalNodes.length !== clonedNodes.length) {
			break;
		}
		copyIndependentGeometry(originalNode, clonedNode);
	}

	return clonedObject;
}

function copyIndependentGeometry(originalNode: Object3D, clonedNode: Object3D): void {
	const originalRenderable = renderableOf(originalNode);
	const clonedRenderable = renderableOf(clonedNode);
	if (!originalRenderable || !clonedRenderable) {
		return;
	}

	if (originalRenderable.geometry?.clone) {
		clonedRenderable.geometry = originalRenderable.geometry.clone();
	}

	if (!originalRenderable.material) {
		return;
	}

	clonedRenderable.material = Array.isArray(originalRenderable.material)
		? originalRenderable.material.map((material: Material) => material.clone())
		: originalRenderable.material.clone();
}

function renderableOf(node: Object3D): (Mesh | Points) | null {
	if (node instanceof Mesh || node instanceof Points) {
		return node;
	}
	return null;
}
