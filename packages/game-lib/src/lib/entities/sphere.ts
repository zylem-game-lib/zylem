import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { DebugDelegate } from './delegates/debug';
import { commonDefaults, mergeArgs } from './common';
import { sphereMesh } from './parts/mesh-factories';
import { sphereCollision } from './parts/collision-factories';

type ZylemSphereOptions = GameEntityOptions & {
	radius?: number;
};

const sphereDefaults: ZylemSphereOptions = {
	...commonDefaults,
	radius: 1,
};

export const SPHERE_TYPE = Symbol('Sphere');

export class ZylemSphere extends GameEntity<ZylemSphereOptions> {
	static type = SPHERE_TYPE;

	constructor(options?: ZylemSphereOptions) {
		super();
		this.options = { ...sphereDefaults, ...options };
	}

	buildInfo(): Record<string, any> {
		const delegate = new DebugDelegate(this as any);
		const baseInfo = delegate.buildDebugInfo();
		const radius = this.options.radius ?? 1;
		return {
			...baseInfo,
			type: String(ZylemSphere.type),
			radius: radius.toFixed(2),
		};
	}
}

type SphereOptions = BaseNode | Partial<ZylemSphereOptions>;

export function createSphere(...args: Array<SphereOptions>): ZylemSphere {
	const options = mergeArgs(args, sphereDefaults);
	const entity = new ZylemSphere(options);
	entity.add(
		sphereMesh({ radius: options.radius, material: options.material, color: options.color }),
		sphereCollision({
			radius: options.radius,
			static: options.collision?.static,
			sensor: options.collision?.sensor,
			collisionType: options.collisionType,
			collisionFilter: options.collisionFilter,
		}),
	);
	return entity;
}
