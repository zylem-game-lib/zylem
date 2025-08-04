import { BufferGeometry, Material, Mesh } from 'three';
import { GameEntityOptions } from '../entities/entity';

/**
 * TODO: allow for multiple materials requires geometry groups
 * TODO: allow for instanced uniforms
 * TODO: allow for geometry groups
 * TODO: allow for batched meshes
 * import { InstancedUniformsMesh } from 'three-instanced-uniforms-mesh';
 * may not need geometry groups for shaders though
 * setGeometry<T extends BufferGeometry>(geometry: T) {
 *   MeshBuilder.bachedMesh = new BatchedMesh(10, 5000, 10000, material);
 * }
 */

export type MeshBuilderOptions = Partial<Pick<GameEntityOptions, 'batched' | 'material'>>;

export class MeshBuilder {

	_build(meshOptions: MeshBuilderOptions, geometry: BufferGeometry, materials: Material[]): Mesh {
		const { batched, material } = meshOptions;
		if (batched) {
			console.warn('warning: mesh batching is not implemented');
		}
		const mesh = new Mesh(geometry, materials.at(-1));
		mesh.position.set(0, 0, 0);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		return mesh;
	}

	_postBuild(): void {
		return;
	}
}