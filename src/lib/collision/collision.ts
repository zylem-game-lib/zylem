import { RigidBodyDesc, RigidBodyType } from '@dimforge/rapier3d-compat';
import { defineComponent, Types } from 'bitecs';
import { Vector3 } from 'three';

export class BaseCollision {
	static: boolean = false;
	isSensor: boolean = false;
	bodyDescription: RigidBodyDesc;

	constructor({ isDynamicBody = true }) {
		const type = isDynamicBody ? RigidBodyType.Dynamic : RigidBodyType.Fixed;
		this.bodyDescription = new RigidBodyDesc(type)
			.setTranslation(0, 0, 0)
			.setGravityScale(1.0)
			.setCanSleep(false)
			.setCcdEnabled(true);
	}
}

const CollisionComponent = defineComponent({
	static: Types.i8,
	isSensor: Types.i8,
	bodyDescription: Types.i8 //RigidBodyDesc;
});

const CollisionDebugComponent = defineComponent({
	active: Types.i8,
	color: Types.f32
});

export interface CollisionOptions {
	static?: boolean;
	sensor?: boolean;
	size?: Vector3;
	position?: Vector3;
	collisionType?: string;
	collisionFilter?: string[];
}