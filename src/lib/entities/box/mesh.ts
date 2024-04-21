import { BoxGeometry, Group, Mesh, Vector3 } from "three";
import { BaseMesh, CreateMeshParameters } from "~/lib/core/mesh";

export class BoxMesh extends BaseMesh {
	createMesh({ group = new Group(), size, materials }: CreateMeshParameters) {
		const meshSize = size ?? new Vector3(1, 1, 1);
		const geometry = new BoxGeometry(meshSize.x, meshSize.y, meshSize.z);
		this.mesh = new Mesh(geometry, materials.at(-1));
		this.mesh.position.set(0, 0, 0);
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;
		console.log('box mesh created');
		group.add(this.mesh);
	}
}