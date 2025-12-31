import { ActiveCollisionTypes, ColliderDesc, RigidBodyDesc, RigidBodyType, Vector3 } from "@dimforge/rapier3d-compat";
import { Vec3 } from "../core/vector";

/**
 * Options for configuring entity collision behavior.
 */
export interface CollisionOptions {
	static?: boolean;
	sensor?: boolean;
	size?: Vector3;
	position?: Vector3;
	collisionType?: string;
	collisionFilter?: string[];
}

const typeToGroup = new Map<string, number>();
let nextGroupId = 0;

export function getOrCreateCollisionGroupId(type: string): number {
	let groupId = typeToGroup.get(type);
	if (groupId === undefined) {
		groupId = nextGroupId++ % 16;
		typeToGroup.set(type, groupId);
	}
	return groupId;
}

export function createCollisionFilter(allowedTypes: string[]): number {
	let filter = 0;
	allowedTypes.forEach(type => {
		const groupId = getOrCreateCollisionGroupId(type);
		filter |= (1 << groupId);
	});
	return filter;
}

export class CollisionBuilder {
	static: boolean = false;
	sensor: boolean = false;
	gravity: Vec3 = new Vector3(0, 0, 0);

	build(options: Partial<CollisionOptions>): [RigidBodyDesc, ColliderDesc] {
		const bodyDesc = this.bodyDesc({
			isDynamicBody: !this.static
		});
		const collider = this.collider(options);
		const type = options.collisionType;
		if (type) {
			let groupId = getOrCreateCollisionGroupId(type);
			let filter = 0b1111111111111111;
			if (options.collisionFilter) {
				filter = createCollisionFilter(options.collisionFilter);
			}
			collider.setCollisionGroups((groupId << 16) | filter);
		}
		const { KINEMATIC_FIXED, DEFAULT } = ActiveCollisionTypes;
		collider.activeCollisionTypes = (this.sensor) ? KINEMATIC_FIXED : DEFAULT;
		return [bodyDesc, collider];
	}

	withCollision(collisionOptions: Partial<CollisionOptions>): this {
		this.sensor = collisionOptions?.sensor ?? this.sensor;
		this.static = collisionOptions?.static ?? this.static;
		return this;
	}

	collider(options: CollisionOptions): ColliderDesc {
		const size = options.size ?? new Vector3(1, 1, 1);
		const half = { x: size.x / 2, y: size.y / 2, z: size.z / 2 };
		let colliderDesc = ColliderDesc.cuboid(half.x, half.y, half.z);
		return colliderDesc;
	}

	bodyDesc({ isDynamicBody = true }): RigidBodyDesc {
		const type = isDynamicBody ? RigidBodyType.Dynamic : RigidBodyType.Fixed;
		const bodyDesc = new RigidBodyDesc(type)
			.setTranslation(0, 0, 0)
			.setGravityScale(1.0)
			.setCanSleep(false)
			.setCcdEnabled(true);
		return bodyDesc;
	}
}