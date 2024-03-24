import { ActiveCollisionTypes, ColliderDesc } from "@dimforge/rapier3d-compat";
import { BaseCollision } from "~/lib/collision/collision";

export class SphereCollision extends BaseCollision {
	_colRadius: number = 1;

	createCollider(isSensor: boolean = false) {
		const radius = this._colRadius || 1;
		let colliderDesc = ColliderDesc.ball(radius);
		colliderDesc.setSensor(isSensor);
		colliderDesc.activeCollisionTypes = (isSensor) ? ActiveCollisionTypes.KINEMATIC_FIXED : ActiveCollisionTypes.DEFAULT;
		return colliderDesc;
	}
}
