import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { DebugDelegate } from './delegates/debug';
import { commonDefaults, mergeArgs } from './common';
import { pyramidMesh } from './parts/mesh-factories';
import { pyramidCollision } from './parts/collision-factories';

type ZylemPyramidOptions = GameEntityOptions & {
	/** Base radius of the pyramid */
	radius?: number;
	/** Height of the pyramid */
	height?: number;
};

const pyramidDefaults: ZylemPyramidOptions = {
	...commonDefaults,
	radius: 1,
	height: 2,
};

export const PYRAMID_TYPE = Symbol('Pyramid');

/**
 * A pyramid entity (4-sided cone).
 * Uses ConeGeometry with 4 radial segments for the visual mesh
 * and a Rapier cone collider for physics.
 */
export class ZylemPyramid extends GameEntity<ZylemPyramidOptions> {
	static type = PYRAMID_TYPE;

	constructor(options?: ZylemPyramidOptions) {
		super();
		this.options = { ...pyramidDefaults, ...options };
	}

	buildInfo(): Record<string, any> {
		const delegate = new DebugDelegate(this as any);
		const baseInfo = delegate.buildDebugInfo();
		const radius = this.options.radius ?? 1;
		const height = this.options.height ?? 2;
		return {
			...baseInfo,
			type: String(ZylemPyramid.type),
			radius: radius.toFixed(2),
			height: height.toFixed(2),
		};
	}
}

type PyramidOptions = BaseNode | Partial<ZylemPyramidOptions>;

/**
 * Create a pyramid entity.
 * @param args Options or child nodes
 */
export function createPyramid(...args: Array<PyramidOptions>): ZylemPyramid {
	const options = mergeArgs(args, pyramidDefaults);
	const entity = new ZylemPyramid(options);
	entity.add(
		pyramidMesh({
			radius: options.radius,
			height: options.height,
			material: options.material,
			color: options.color,
		}),
		pyramidCollision({
			radius: options.radius,
			height: options.height,
			static: options.collision?.static,
			sensor: options.collision?.sensor,
			collisionType: options.collisionType,
			collisionFilter: options.collisionFilter,
		}),
	);
	return entity;
}
