import { BoxGeometry, Group, Mesh, Vector3 } from "three";
import { BaseMesh, CreateMeshParameters } from "~/lib/core/mesh";

export class BoxMesh extends BaseMesh {
	size: Vector3 = new Vector3(1, 1, 1);

	createMesh({ group = new Group(), vector3 = new Vector3(1, 1, 1), materials }: CreateMeshParameters) {
		this.size = vector3;
		const geometry = new BoxGeometry(vector3.x, vector3.y, vector3.z);
		this.mesh = new Mesh(geometry, materials.at(-1));
		this.mesh.position.set(0, 0, 0);
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;
		group.add(this.mesh);
	}
}