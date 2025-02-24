import { BufferGeometry, Group, Material, Mesh, Object3D, Vector2 } from 'three';
import { InstancedUniformsMesh } from 'three-instanced-uniforms-mesh';
import { SizeVector } from '../core/utility';
import { EntityOptions } from '../core';

export interface BoxMeshInterface {
	createMesh: (params: CreateMeshParameters) => void;
}

export type CreateMeshParameters = {
	group?: Group;
	tile?: Vector2;
	size?: SizeVector;
	radius?: number;
	object?: Object3D | null;
	materials: Material[];
}

// TODO: allow for multiple materials requires geometry groups
// may not need geometry groups for shaders though
// setGeometry<T extends BufferGeometry>(geometry: T) {
// 	// MeshBuilder.bachedMesh = new BatchedMesh(10, 5000, 10000, material);
// }

export class BaseMesh {
	// mesh: Mesh | null = null;
}

export type MeshBuilderOptions = Partial<Pick<EntityOptions, 'batched' | 'material'>>;

export class MeshBuilder {

	build(meshOptions: MeshBuilderOptions, geometry: BufferGeometry, materials: Material[]): Mesh {
		const { batched, material } = meshOptions;
		// TODO: Batching
		if (batched) {
			console.warn('warning: mesh batching is not implemented');
		}
		const mesh = new Mesh(geometry, materials.at(-1));
		mesh.position.set(0, 0, 0);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		return mesh;
	}

	postBuild(mesh: Mesh): Mesh {
		return mesh;
	}
}