import { ColliderDesc } from '@dimforge/rapier3d-compat';
import { BoxGeometry } from 'three';
import { Vector3 } from 'three';
import { ZylemBlueColor } from '../core/utility';
import { BaseNode } from '../core/base-node';
import { EntityBuilder, EntityCollisionBuilder, EntityMeshBuilder, EntityOptions, GameEntity } from './entity';
import { createEntity } from './create';

type ZylemBoxOptions = EntityOptions;

const boxDefaults: ZylemBoxOptions = {
	size: new Vector3(1, 1, 1),
	position: new Vector3(0, 0, 0),
	collision: {
		static: false,
	},
	material: {
		color: ZylemBlueColor,
		shader: 'standard'
	},
};

export class BoxCollisionBuilder extends EntityCollisionBuilder {
	collider(options: EntityOptions): ColliderDesc {
		const size = options.size || new Vector3(1, 1, 1);
		const half = { x: size.x / 2, y: size.y / 2, z: size.z / 2 };
		let colliderDesc = ColliderDesc.cuboid(half.x, half.y, half.z);
		return colliderDesc;
	}
}

export class BoxMeshBuilder extends EntityMeshBuilder {
	buildGeometry(options: EntityOptions): BoxGeometry {
		const size = options.size ?? new Vector3(1, 1, 1);
		return new BoxGeometry(size.x, size.y, size.z);
	}
}

export class BoxBuilder extends EntityBuilder<ZylemBox, ZylemBoxOptions> {
	protected createEntity(options: Partial<ZylemBoxOptions>): ZylemBox {
		return new ZylemBox(options);
	}
}

export const BOX_TYPE = Symbol('Box');

export class ZylemBox extends GameEntity<ZylemBoxOptions> {
	static type = BOX_TYPE;

	constructor(options?: ZylemBoxOptions) {
		super();
		this.options = { ...boxDefaults, ...options };
	}
}

type BoxOptions = BaseNode | ZylemBoxOptions;

export async function box(...args: Array<BoxOptions>): Promise<ZylemBox> {
	return createEntity<ZylemBox, ZylemBoxOptions>({
		args,
		defaultConfig: boxDefaults,
		BuilderClass: BoxBuilder,
		MeshBuilderClass: BoxMeshBuilder,
		CollisionBuilderClass: BoxCollisionBuilder,
		entityType: ZylemBox.type
	});
}