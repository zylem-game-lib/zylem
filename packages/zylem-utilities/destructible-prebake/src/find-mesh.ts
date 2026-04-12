import type { Mesh, Object3D } from 'three';

/**
 * Depth-first first mesh under `root` (matches Destructible3D entity resolution).
 */
export function findFirstMesh(root: Object3D): Mesh | null {
	let resolved: Mesh | null = null;
	root.traverse((child) => {
		if (resolved) {
			return;
		}

		if ((child as Mesh).isMesh) {
			resolved = child as Mesh;
		}
	});
	return resolved;
}

/**
 * First mesh whose `name` equals the given string.
 */
export function findMeshByName(root: Object3D, name: string): Mesh | null {
	let resolved: Mesh | null = null;
	root.traverse((child) => {
		if (resolved) {
			return;
		}

		if ((child as Mesh).isMesh && child.name === name) {
			resolved = child as Mesh;
		}
	});
	return resolved;
}
