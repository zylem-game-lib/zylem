import { ActiveCollisionTypes, ColliderDesc, RigidBodyDesc, RigidBodyType } from "@dimforge/rapier3d-compat";
import { Color, Vector3 } from "three";
import { BaseCollision } from "~/lib/collision/_oldCollision";
import { SizeVector } from "~/lib/interfaces/utility";

export class BoxCollision {
	_static: boolean = false;
	_isSensor: boolean = false;
	bodyDescription: RigidBodyDesc | null = null;
	debugCollision: boolean = false;
	debugColor: Color = new Color().setColorName('green');
	collisionSize: SizeVector = new Vector3(1, 1, 1);

	createCollider(isSensor: boolean = false) {
		const size = this.collisionSize || new Vector3(1, 1, 1);
		const half = { x: size.x / 2, y: size.y / 2, z: size.z / 2 };
		let colliderDesc = ColliderDesc.cuboid(half.x, half.y, half.z);
		colliderDesc.setSensor(isSensor);
		colliderDesc.activeCollisionTypes = (isSensor) ? ActiveCollisionTypes.KINEMATIC_FIXED : ActiveCollisionTypes.DEFAULT;
		return colliderDesc;
	}

	createCollision({ isDynamicBody = true }) {
		const type = isDynamicBody ? RigidBodyType.Dynamic : RigidBodyType.Fixed;
		this.bodyDescription = new RigidBodyDesc(type)
			.setTranslation(0, 0, 0)
			.setGravityScale(1.0)
			.setCanSleep(false)
			.setCcdEnabled(true);
	}
}