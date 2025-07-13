import { ColliderDesc } from '@dimforge/rapier3d-compat';
import { BoxGeometry } from 'three';
import { Vector3 } from 'three';
import { ZylemBlueColor } from '../core/utility';
import { BaseNode } from '../core/base-node';
import { DebugInfoBuilder, EntityBuilder, EntityCollisionBuilder, EntityMeshBuilder, GameEntityOptions, GameEntity } from './entity';
import { createEntity } from './create';

type ZylemBoxOptions = GameEntityOptions;

const boxDefaults: ZylemBoxOptions = {
	size: new Vector3(1, 1, 1),
	position: new Vector3(0, 0, 0),
	collision: {
		static: false,
	},
	color: ZylemBlueColor,
	material: {
		color: ZylemBlueColor,
		shader: 'standard'
	},
};

export class BoxCollisionBuilder extends EntityCollisionBuilder {
	collider(options: GameEntityOptions): ColliderDesc {
		const size = options.size || new Vector3(1, 1, 1);
		const half = { x: size.x / 2, y: size.y / 2, z: size.z / 2 };
		let colliderDesc = ColliderDesc.cuboid(half.x, half.y, half.z);
		return colliderDesc;
	}
}

export class BoxMeshBuilder extends EntityMeshBuilder {
	buildGeometry(options: GameEntityOptions): BoxGeometry {
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

export class BoxDebugInfoBuilder extends DebugInfoBuilder {
	buildInfo(options: GameEntityOptions): Record<string, any> {
		const { x, z, y } = options.position ?? { x: 0, y: 0, z: 0 };
		const positionString = `${x}, ${y}, ${z}`;
		const { x: sizeX, y: sizeY, z: sizeZ } = options.size ?? { x: 1, y: 1, z: 1 };
		const sizeString = `${sizeX}, ${sizeY}, ${sizeZ}`;
		return {
			type: String(ZylemBox.type),
			position: positionString,
			size: sizeString,
			message: 'box debug info'
		};
	}
}

type BoxOptions = BaseNode | ZylemBoxOptions;

export async function box(...args: Array<BoxOptions>): Promise<ZylemBox> {
	return createEntity<ZylemBox, ZylemBoxOptions>({
		args,
		defaultConfig: boxDefaults,
		EntityClass: ZylemBox,
		BuilderClass: BoxBuilder,
		MeshBuilderClass: BoxMeshBuilder,
		CollisionBuilderClass: BoxCollisionBuilder,
		DebugInfoBuilderClass: BoxDebugInfoBuilder,
		entityType: ZylemBox.type
	});
}