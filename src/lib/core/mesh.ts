import { Group, Material, Mesh, Object3D, Vector2 } from 'three';
import { SizeVector } from '../interfaces/utility';

export interface BoxMeshInterface {
	createMesh: (params: CreateMeshParameters) => void;
}

export type CreateMeshParameters = {
	group: Group;
	tile?: Vector2;
	size?: SizeVector;
	radius?: number;
	object?: Object3D | null;
	materials: Material[];
}

// TODO: allow for multiple materials requires geometry groups
// may not need geometry groups for shaders though

export class BaseMesh {
	mesh: Mesh | null = null;
}

