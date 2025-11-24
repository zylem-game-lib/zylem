import { ColliderDesc } from '@dimforge/rapier3d-compat';
import { BoxGeometry, Color } from 'three';
import { Vector3 } from 'three';
import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { EntityBuilder } from './builder';
import { EntityCollisionBuilder } from './builder';
import { EntityMeshBuilder } from './builder';
import { DebugDelegate } from './delegates/debug';
import { createEntity } from './create';

type ZylemBoxOptions = GameEntityOptions;

const boxDefaults: ZylemBoxOptions = {
	size: new Vector3(1, 1, 1),
	position: new Vector3(0, 0, 0),
	collision: {
		static: false,
	},
	material: {
		color: new Color('#ffffff'),
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
	build(options: GameEntityOptions): BoxGeometry {
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

	buildInfo(): Record<string, any> {
		const delegate = new DebugDelegate(this as any);
		const baseInfo = delegate.buildDebugInfo();

		const { x: sizeX, y: sizeY, z: sizeZ } = this.options.size ?? { x: 1, y: 1, z: 1 };
		return {
			...baseInfo,
			type: String(ZylemBox.type),
			size: `${sizeX}, ${sizeY}, ${sizeZ}`,
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
		entityType: ZylemBox.type
	});
}