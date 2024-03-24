import { ActiveCollisionTypes, ColliderDesc, RigidBodyDesc, RigidBodyType } from "@dimforge/rapier3d-compat";
import { BufferGeometry, Color, Object3D, SkinnedMesh, Vector2, Vector3 } from "three";
import { SizeVector } from "../interfaces/utility";

export interface BoxCollisionInterface {
	createCollision: (params: CreateCollisionParameters) => void;
}

export type CreateCollisionParameters = {
	isDynamicBody?: boolean;
	size?: Vector3 | undefined;
}

export class BaseCollision {
	_static: boolean = false;
	bodyDescription: RigidBodyDesc | null = null;
	debugCollision: boolean = false;
	debugColor: Color = new Color().setColorName('green');

	createCollision({ isDynamicBody = true }) {
		const type = isDynamicBody ? RigidBodyType.Dynamic : RigidBodyType.Fixed;
		this.bodyDescription = new RigidBodyDesc(type)
			.setTranslation(0, 0, 0)
			.setRotation({ w: 1.0, x: 0.0, y: 0.0, z: 0.0 })
			.setGravityScale(1.0)
			.setCanSleep(false)
			.setCcdEnabled(false);
	}
}

export class BoxCollision extends BaseCollision {
	_size: SizeVector = new Vector3(1, 1, 1);

	createCollision({ isDynamicBody = true }) {
		const type = isDynamicBody ? RigidBodyType.Dynamic : RigidBodyType.Fixed;
		this.bodyDescription = new RigidBodyDesc(type)
			.setTranslation(0, 0, 0)
			.setRotation({ w: 1.0, x: 0.0, y: 0.0, z: 0.0 })
			.setGravityScale(1.0)
			.setCanSleep(false)
			.setCcdEnabled(false);
	}

	createCollider(isSensor: boolean = false) {
		const size = this._size || new Vector3(1, 1, 1);
		const half = { x: size.x / 2, y: size.y / 2, z: size.z / 2 };
		let colliderDesc = ColliderDesc.cuboid(half.x, half.y, half.z);
		colliderDesc.setSensor(isSensor);
		// "KINEMATIC_FIXED" will only sense actors moving through the sensor
		// colliderDesc.setActiveHooks(RAPIER.ActiveHooks.FILTER_INTERSECTION_PAIRS);
		colliderDesc.activeCollisionTypes = (isSensor) ? ActiveCollisionTypes.KINEMATIC_FIXED : ActiveCollisionTypes.DEFAULT;
		return colliderDesc;
	}
}

export class SpriteCollision extends BaseCollision {
	collisionSize: Vector3 = new Vector3(1, 1, 1);
	size: Vector3 = new Vector3(1, 1, 1);

	createCollision({ isDynamicBody = true, isSensor = false }) {
		const gravityScale = (isSensor) ? 0.0 : 1.0;
		const type = isDynamicBody ? RigidBodyType.Dynamic : RigidBodyType.Fixed;
		this.bodyDescription = new RigidBodyDesc(type)
			.setTranslation(0, 0, 0)
			.lockRotations()
			.setGravityScale(gravityScale)
			.setCanSleep(false)
			.setCcdEnabled(false);
	}

	createCollider(isSensor: boolean = false) {
		const { x, y, z } = this.collisionSize ?? this.size;
		const size = new Vector3(x, y, z);
		const half = { x: size.x / 2, y: size.y / 2, z: size.z / 2 };
		let colliderDesc = ColliderDesc.cuboid(half.x, half.y, half.z);
		colliderDesc.setSensor(isSensor);
		colliderDesc.activeCollisionTypes = (isSensor) ? ActiveCollisionTypes.KINEMATIC_FIXED : ActiveCollisionTypes.DEFAULT;
		// if (this._debug) {
		// 	this.createDebugMesh(new BoxGeometry(x, y, z));
		// }
		return colliderDesc;
	}
}