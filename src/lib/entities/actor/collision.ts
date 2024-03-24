import { ActiveCollisionTypes, ColliderDesc, RigidBodyDesc, RigidBodyType } from "@dimforge/rapier3d-compat";
import { BufferGeometry, Object3D, SkinnedMesh } from "three";
import { BaseCollision } from "~/lib/collision/collision";

export class ActorCollision extends BaseCollision {
	height: number = 1;
	radius: number = 1;

	createCollision({ isDynamicBody = true, object }: { isDynamicBody: boolean, object: Object3D | null }) {
		const type = isDynamicBody ? RigidBodyType.Dynamic : RigidBodyType.Fixed;
		this.bodyDescription = new RigidBodyDesc(type)
			.setTranslation(0, 0, 0)
			.setRotation({ w: 1.0, x: 0.0, y: 0.0, z: 0.0 })
			.setGravityScale(1.0)
			.setCanSleep(false)
			.setCcdEnabled(false);
		if (!object) {
			console.warn('missing object');
			return;
		}
		// TODO: assign height and radius based on actor geometry
		const skinnedMesh = object.children[0] as SkinnedMesh;
		let geometry = skinnedMesh.geometry as BufferGeometry;
		console.log(geometry);
	}

	createCollider(isSensor: boolean = false) {
		let colliderDesc = ColliderDesc.capsule(0.5, 1);
		console.log('ACTOR COLLIDER', colliderDesc);
		colliderDesc.setSensor(isSensor);
		colliderDesc.activeCollisionTypes = (isSensor) ? ActiveCollisionTypes.KINEMATIC_FIXED : ActiveCollisionTypes.DEFAULT;
		return colliderDesc;
	}
}