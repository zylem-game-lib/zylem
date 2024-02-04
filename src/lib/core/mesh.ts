import { BoxGeometry, Color, Group, Material, Mesh, MeshStandardMaterial, Vector3 } from "three";

export interface BoxMeshInterface {
	createMesh: (params: CreateMeshParameters) => void;
}

export type CreateMeshParameters = {
	group: Group;
	vector3?: Vector3 | undefined;
	materials: Material[];
}

export class BoxMesh {
	size: Vector3 = new Vector3(1, 1, 1);
	mesh: Mesh | null = null;

	createMesh({ group = new Group(), vector3 = new Vector3(1, 1, 1), materials }: CreateMeshParameters) {
		this.size = vector3;
		const geometry = new BoxGeometry(vector3.x, vector3.y, vector3.z);
		// TODO: allow for multiple materials requires geometry groups
		// may not need geometry groups for shaders though
		this.mesh = new Mesh(geometry, materials.at(-1));
		this.mesh.position.set(0, 0, 0);
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;
		group.add(this.mesh);
	}
}