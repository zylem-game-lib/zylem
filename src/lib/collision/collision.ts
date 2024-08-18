import { RigidBodyDesc, RigidBodyType } from "@dimforge/rapier3d-compat";
import { Color } from "three";
import { Component, Entity, System } from "../core/ecs";

export class BaseCollision implements CollisionComponent {
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

export interface CollisionComponent extends Component {
	static: boolean;
	isSensor: boolean;
	bodyDescription: RigidBodyDesc;
};

export interface CollisionDebugComponent extends Component {
	active: boolean;
	color: Color;
}
