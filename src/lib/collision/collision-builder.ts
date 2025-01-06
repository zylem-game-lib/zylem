import { ActiveCollisionTypes, ColliderDesc, RigidBodyDesc, RigidBodyType, Vector3 } from "@dimforge/rapier3d-compat";
import { PhysicsOptions } from "./physics";
import { Vec3 } from "../core/vector";
import { CollisionOptions } from "./collision";
import { EntityOptions } from "../core";

export type ColliderFunction = () => ColliderDesc;
export type RigidBodyFunction = ({ isDynamicBody }: { isDynamicBody: boolean }) => RigidBodyDesc;

export class CollisionBuilder {
	static: boolean = false;
	sensor: boolean = false;
	gravity: Vec3 = new Vector3(0, 0, 0);

	build(options: EntityOptions): [RigidBodyDesc, ColliderDesc] {
		const rigidBody = this.rigidBody({
			isDynamicBody: !this.static
		});
		const collider = this.collider(options);
		const { KINEMATIC_FIXED, DEFAULT } = ActiveCollisionTypes;
		collider.activeCollisionTypes = (this.sensor) ? KINEMATIC_FIXED : DEFAULT;
		return [rigidBody, collider];
	}

	withCollision(collisionOptions: Partial<CollisionOptions>): this {
		this.sensor = collisionOptions?.sensor ?? this.sensor;
		this.static = collisionOptions?.static ?? this.static;
		return this;
	}

	withPhysics(physicsOptions: Partial<PhysicsOptions>): this {
		this.gravity = physicsOptions.gravity ?? this.gravity;
		return this;
	}

	collider(options: EntityOptions): ColliderDesc {
		const size = options.size ?? new Vector3(1, 1, 1);
		const half = { x: size.x / 2, y: size.y / 2, z: size.z / 2 };
		let colliderDesc = ColliderDesc.cuboid(half.x, half.y, half.z);
		return colliderDesc;
	}

	rigidBody({ isDynamicBody = true }): RigidBodyDesc {
		const type = isDynamicBody ? RigidBodyType.Dynamic : RigidBodyType.Fixed;
		const bodyDesc = new RigidBodyDesc(type)
			.setTranslation(0, 0, 0)
			.setGravityScale(1.0)
			.setCanSleep(false)
			.setCcdEnabled(true);
		return bodyDesc;
	}
}