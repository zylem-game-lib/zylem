import { BufferAttribute, BufferGeometry, Mesh, Object3D, Points } from 'three';

export const ZYLEM_ASSET_KIND_KEY = 'zylemAssetKind';
export const GAUSSIAN_SPLAT_ASSET_KIND = 'gaussian-splat';

type GaussianNode = Object3D & {
	isGaussianSplat?: boolean;
	splatGeometry?: BufferGeometry;
	autoSort?: boolean;
	_buffers?: Record<string, unknown> | null;
	_sort?: Record<string, unknown> | null;
};

export function isGaussianSplatNode(node: Object3D): boolean {
	if ((node as GaussianNode).isGaussianSplat) {
		return true;
	}
	return node.userData?.[ZYLEM_ASSET_KIND_KEY] === GAUSSIAN_SPLAT_ASSET_KIND;
}

export function markGaussianSplats(root: Object3D): void {
	root.traverse((node) => {
		if ((node as GaussianNode).isGaussianSplat) {
			node.userData[ZYLEM_ASSET_KIND_KEY] = GAUSSIAN_SPLAT_ASSET_KIND;
		}
	});
}

/**
 * A model whose drawable meshes are all Gaussian splats. Mixed files keep
 * their ordinary meshes and only skip splat nodes.
 */
export function isExclusiveGaussianSplatModel(root: Object3D): boolean {
	let sawSplat = false;
	let sawOtherDrawable = false;
	root.traverse((node) => {
		if (isGaussianSplatNode(node)) {
			sawSplat = true;
			return;
		}
		if ((node as Mesh).isMesh || (node as Points).isPoints) {
			sawOtherDrawable = true;
		}
	});
	return sawSplat && !sawOtherDrawable;
}

/**
 * Bounds for a splat come from the capture positions (`splatGeometry`),
 * not the camera-facing quad the mesh draws.
 */
export function geometryForBounds(node: Object3D): BufferGeometry | null {
	const gaussian = node as GaussianNode & { geometry?: BufferGeometry };
	if (isGaussianSplatNode(node) && gaussian.splatGeometry) {
		return gaussian.splatGeometry;
	}
	return gaussian.geometry ?? null;
}

function disposeAttributeTree(value: unknown, seen: Set<unknown>, depth: number): void {
	if (!value || typeof value !== 'object' || depth > 3 || seen.has(value)) {
		return;
	}
	const attribute = value as BufferAttribute;
	if (attribute.isBufferAttribute) {
		seen.add(attribute);
		attribute.dispose();
		return;
	}
	const nested = value as { value?: unknown };
	if ('value' in nested) {
		disposeAttributeTree(nested.value, seen, depth + 1);
	}
}

/**
 * Release the capture geometry and the storage buffers `GaussianSplat`
 * copies for sorting and spherical harmonics. The display quad is disposed
 * with the rest of the actor mesh.
 */
export function disposeGaussianSplatResources(node: Object3D): void {
	if (!isGaussianSplatNode(node)) {
		return;
	}

	const splat = node as GaussianNode;
	const seen = new Set<unknown>();
	const geometry = splat.splatGeometry;
	if (geometry) {
		for (const attribute of Object.values(geometry.attributes)) {
			disposeAttributeTree(attribute, seen, 0);
		}
		geometry.dispose();
	}
	if (splat._buffers) {
		for (const value of Object.values(splat._buffers)) {
			disposeAttributeTree(value, seen, 0);
		}
	}
	if (splat._sort) {
		for (const value of Object.values(splat._sort)) {
			disposeAttributeTree(value, seen, 0);
		}
	}
	splat.splatGeometry = undefined;
	splat._buffers = null;
	splat._sort = null;
}
