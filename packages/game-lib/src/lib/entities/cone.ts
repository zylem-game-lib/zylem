import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { DebugDelegate } from './delegates/debug';
import { commonDefaults, mergeArgs } from './common';
import { coneMesh } from './parts/mesh-factories';
import { coneCollision } from './parts/collision-factories';

type ZylemConeOptions = GameEntityOptions & {
	/** Base radius of the cone */
	radius?: number;
	/** Height of the cone */
	height?: number;
	/** Number of radial segments (higher = smoother) */
	radialSegments?: number;
};

const coneDefaults: ZylemConeOptions = {
	...commonDefaults,
	radius: 1,
	height: 2,
	radialSegments: 32,
};

export const CONE_TYPE = Symbol('Cone');

/**
 * A cone entity with configurable radius, height, and radial segments.
 * Uses a Rapier cone collider for physics.
 */
export class ZylemCone extends GameEntity<ZylemConeOptions> {
	static type = CONE_TYPE;

	constructor(options?: ZylemConeOptions) {
		super();
		this.options = { ...coneDefaults, ...options };
	}

	buildInfo(): Record<string, any> {
		const delegate = new DebugDelegate(this as any);
		const baseInfo = delegate.buildDebugInfo();
		const radius = this.options.radius ?? 1;
		const height = this.options.height ?? 2;
		return {
			...baseInfo,
			type: String(ZylemCone.type),
			radius: radius.toFixed(2),
			height: height.toFixed(2),
		};
	}
}

type ConeOptions = BaseNode | Partial<ZylemConeOptions>;

/**
 * Create a cone entity.
 * @param args Options or child nodes
 */
export function createCone(...args: Array<ConeOptions>): ZylemCone {
	const options = mergeArgs(args, coneDefaults);
	const entity = new ZylemCone(options);
	entity.add(
		coneMesh({
			radius: options.radius,
			height: options.height,
			radialSegments: options.radialSegments,
			material: options.material,
			color: options.color,
		}),
		coneCollision({
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
