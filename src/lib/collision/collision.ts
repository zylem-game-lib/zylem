import { ActiveCollisionTypes, ColliderDesc, RigidBody, RigidBodyDesc, RigidBodyType } from "@dimforge/rapier3d-compat";
import { Constructor } from "../core/composable";
import { Color, Vector3 } from "three";

export interface BoxCollisionInterface {
	createCollision: (params: CreateCollisionParameters) => void;
}

export type CreateCollisionParameters = {
	isDynamicBody?: boolean;
	size?: Vector3 | undefined;
}

export function BoxCollision<CBase extends Constructor>(Base: CBase) {
	return class BoxCollision extends Base {
		bodyDescription: RigidBodyDesc | null = null;
		debugCollision: boolean = false;
		debugColor: Color = new Color().setColorName('green');
		size: Vector3 = new Vector3(1, 1, 1);

		createCollision({ isDynamicBody = true }) {
			const type = isDynamicBody ? RigidBodyType.Dynamic : RigidBodyType.Fixed;
			this.bodyDescription = new RigidBodyDesc(type)
				.setTranslation(0, 0, 0)
				.setGravityScale(1.0)
				.setCanSleep(false)
				.setCcdEnabled(false);
		}

		createCollider(isSensor: boolean = false) {
			const size = this.size || new Vector3(1, 1, 1);
			const half = { x: size.x / 2, y: size.y / 2, z: size.z / 2 };
			let colliderDesc = ColliderDesc.cuboid(half.x, half.y, half.z);
			colliderDesc.setSensor(isSensor);
			if (isSensor) {
				// "KINEMATIC_FIXED" will only sense actors moving through the sensor
				colliderDesc.activeCollisionTypes = ActiveCollisionTypes.KINEMATIC_FIXED;
				// colliderDesc.setActiveHooks(RAPIER.ActiveHooks.FILTER_INTERSECTION_PAIRS);
			}
			return colliderDesc;
		}
	}
}