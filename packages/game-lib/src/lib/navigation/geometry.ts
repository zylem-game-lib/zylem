import { compileBrush, type LevelDocument } from '@zylem/bridge';
import { Mesh, MeshBasicMaterial } from 'three';
import { brushGeometry } from '../level/level-geometry';
import { terrainWorldGeometry } from '../level/terrain-geometry';

/** Compile document solids, independent of editor visibility and preview meshes. Caller owns meshes. */
export function navigationSourceMeshes(document: LevelDocument): Mesh[] {
	const excluded = new Set(document.navigation?.excludedSolidIds ?? []);
	const meshes: Mesh[] = [];
	try {
		for (const solid of document.solids) {
			if (excluded.has(solid.id)) continue;
			const compiled = compileBrush(solid.planes);
			if (!compiled) throw new Error(`Solid ${solid.id} does not compile.`);
			const mesh = new Mesh(brushGeometry(compiled), new MeshBasicMaterial());
			mesh.updateMatrixWorld(true);
			meshes.push(mesh);
		}
		for (const plane of document.terrain ?? []) {
			if (!excluded.has(plane.id)) meshes.push(new Mesh(terrainWorldGeometry(plane), new MeshBasicMaterial()));
		}
		return meshes;
	} catch (error) {
		disposeSourceMeshes(meshes);
		throw error;
	}
}
export function disposeSourceMeshes(meshes: Mesh[]): void {
	for (const mesh of meshes) {
		mesh.geometry.dispose();
		for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material])
			material.dispose();
	}
}
