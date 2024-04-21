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
	_isSensor: boolean = false;
	bodyDescription: RigidBodyDesc | null = null;
	debugCollision: boolean = false;
	debugColor: Color = new Color().setColorName('green');

	createCollision({ isDynamicBody = true }) {
		const type = isDynamicBody ? RigidBodyType.Dynamic : RigidBodyType.Fixed;
		this.bodyDescription = new RigidBodyDesc(type)
			.setTranslation(0, 0, 0)
			// .setRotation({ w: 1.0, x: 0.0, y: 0.0, z: 0.0 })
			.setGravityScale(1.0)
			.setCanSleep(false)
			.setCcdEnabled(false);
	}
}
