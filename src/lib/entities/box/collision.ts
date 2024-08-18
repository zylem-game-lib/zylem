import { ActiveCollisionTypes, ColliderDesc } from "@dimforge/rapier3d-compat";
import { Vector3 } from "three";
import { BaseCollision } from "~/lib/collision/_oldCollision";
import { SizeVector } from "~/lib/interfaces/utility";

export class BoxCollision extends BaseCollision {
	_size: SizeVector = new Vector3(1, 1, 1);

	createCollider(isSensor: boolean = false) {
		const size = this._size || new Vector3(1, 1, 1);
		const half = { x: size.x / 2, y: size.y / 2, z: size.z / 2 };
		let colliderDesc = ColliderDesc.cuboid(half.x, half.y, half.z);
		colliderDesc.setSensor(isSensor);
		colliderDesc.activeCollisionTypes = (isSensor) ? ActiveCollisionTypes.KINEMATIC_FIXED : ActiveCollisionTypes.DEFAULT;
		return colliderDesc;
	}
}