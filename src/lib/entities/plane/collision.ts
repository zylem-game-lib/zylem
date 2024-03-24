import { ActiveCollisionTypes, ColliderDesc } from "@dimforge/rapier3d-compat";
import { BaseCollision } from "~/lib/collision/collision";

export class PlaneCollision extends BaseCollision {
	createCollider(isSensor: boolean = false) {
		//@ts-ignore
		let colliderDesc = ColliderDesc.heightfield(
			//@ts-ignore
			this.subdivisions, this.subdivisions, new Float32Array(this.heights), this.size
		);
		colliderDesc.setSensor(isSensor);
		colliderDesc.activeCollisionTypes = (isSensor) ? ActiveCollisionTypes.KINEMATIC_FIXED : ActiveCollisionTypes.DEFAULT;
		return colliderDesc;
	}
}