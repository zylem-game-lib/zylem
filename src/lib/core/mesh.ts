import { BoxGeometry, Group, Material, Mesh, Object3D, SphereGeometry, Vector2, Vector3 } from "three";

export interface BoxMeshInterface {
	createMesh: (params: CreateMeshParameters) => void;
}

export type CreateMeshParameters = {
	group: Group;
	tile?: Vector2;
	vector3?: Vector3 | undefined;
	radius?: number;
	object?: Object3D | null;
	materials: Material[];
}

// TODO: allow for multiple materials requires geometry groups
// may not need geometry groups for shaders though

export class BaseMesh {
	mesh: Mesh | null = null;
}

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

export class SphereMesh extends BaseMesh {
	radius: number = 1;

	createMesh({ group = new Group(), radius = 1, materials }: CreateMeshParameters) {
		this.radius = radius;
		const geometry = new SphereGeometry(radius);
		this.mesh = new Mesh(geometry, materials.at(-1));
		this.mesh.position.set(0, 0, 0);
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;
		group.add(this.mesh);
	}
}

export class ActorMesh extends BaseMesh {

	createMesh({ group = new Group(), object }: CreateMeshParameters) {
		if (!object) {
			console.log('actor is missing object');
			return;
		}
		object.position.set(0, -1.2, 0);
		group.add(object);
	}
}