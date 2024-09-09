import { RigidBodyDesc, RigidBodyType } from "@dimforge/rapier3d-compat";
import { defineComponent, Types } from "bitecs";

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

export const CollisionComponent = defineComponent({
	static: Types.i8,
	isSensor: Types.i8,
	bodyDescription: Types.i8 //RigidBodyDesc;
});

export const CollisionDebugComponent = defineComponent({
	active: Types.i8,
	color: Types.f32
});
