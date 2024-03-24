import { Group } from "three";
import { BaseMesh, CreateMeshParameters } from "~/lib/core/mesh";

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