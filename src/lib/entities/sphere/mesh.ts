import { Group, Mesh, SphereGeometry } from "three";
import { BaseMesh, CreateMeshParameters } from "~/lib/core/mesh";

export class SphereMesh extends BaseMesh {
	_radius: number = 1;

	createMesh({ group = new Group(), radius = 1, materials }: CreateMeshParameters) {
		this._radius = radius;
		const geometry = new SphereGeometry(radius);
		this.mesh = new Mesh(geometry, materials.at(-1));
		this.mesh.position.set(0, 0, 0);
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;
		group.attach(this.mesh);
	}
}