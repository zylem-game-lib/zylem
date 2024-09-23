import { BoxGeometry, BufferGeometry, Group, Material, Mesh, Vector3 } from "three";
import { CreateMeshParameters } from "~/lib/core/mesh";
import { SizeVector } from "~/lib/interfaces/utility";

export class BoxMesh {
	_size: SizeVector = new Vector3(1, 1, 1);
	mesh: Mesh<BufferGeometry, Material | Material[]> | null = null;

	createMesh({ group = new Group(), size, materials }: CreateMeshParameters) {
		const meshSize = size ?? new Vector3(1, 1, 1);
		const geometry = new BoxGeometry(meshSize.x, meshSize.y, meshSize.z);
		this.mesh = new Mesh(geometry, materials.at(-1));
		this.mesh.position.set(0, 0, 0);
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;
		group.add(this.mesh);
	}
}