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
		const skinnedMesh = object.children[0] as SkinnedMesh;
		const geometry = skinnedMesh.geometry as BufferGeometry;

		geometry.computeBoundingBox();
		if (geometry.boundingBox) {
			const maxY = geometry.boundingBox.max.y;
			const minY = geometry.boundingBox.min.y;
			this.height = maxY - minY;
		}
	}

	createCollider(isSensor: boolean = false) {
		// TODO: consider using offsets
		let colliderDesc = ColliderDesc.capsule(this.height / 2, 1);
		colliderDesc.setSensor(isSensor);
		colliderDesc.setTranslation(0, this.height / 2, 0);
		colliderDesc.activeCollisionTypes = (isSensor) ? ActiveCollisionTypes.KINEMATIC_FIXED : ActiveCollisionTypes.DEFAULT;
		return colliderDesc;
	}
}