import { Vector3 } from 'three';
import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { DebugDelegate } from './delegates/debug';
import { commonDefaults, mergeArgs } from './common';
import { boxMesh } from './parts/mesh-factories';
import { boxCollision } from './parts/collision-factories';

type ZylemBoxOptions = GameEntityOptions;

const boxDefaults: ZylemBoxOptions = {
	...commonDefaults,
	size: new Vector3(1, 1, 1),
};

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

type BoxOptions = BaseNode | Partial<ZylemBoxOptions>;

export function createBox(...args: Array<BoxOptions>): ZylemBox {
	const options = mergeArgs(args, boxDefaults);
	const entity = new ZylemBox(options);
	entity.add(
		boxMesh({ size: options.size, material: options.material, color: options.color }),
		boxCollision({
			size: options.size,
			static: options.collision?.static,
			sensor: options.collision?.sensor,
			collisionType: options.collisionType,
			collisionFilter: options.collisionFilter,
		}),
	);
	return entity;
}
