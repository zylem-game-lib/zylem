import { Group } from "three";
import { BaseMesh, CreateMeshParameters } from "~/lib/core/mesh";

export class ActorMesh extends BaseMesh {

	createMesh({ group = new Group(), object, materials }: CreateMeshParameters) {
		if (!object) {
			console.log('actor is missing object');
			return;
		}
		object.position.set(0, 0, 0);
		group.attach(object);
	}
}