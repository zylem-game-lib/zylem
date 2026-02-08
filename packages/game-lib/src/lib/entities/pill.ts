import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { DebugDelegate } from './delegates/debug';
import { commonDefaults, mergeArgs } from './common';
import { pillMesh } from './parts/mesh-factories';
import { pillCollision } from './parts/collision-factories';

type ZylemPillOptions = GameEntityOptions & {
	/** Radius of the capsule hemispheres */
	radius?: number;
	/** Length of the cylindrical middle section */
	length?: number;
	/** Number of cap segments (higher = smoother) */
	capSegments?: number;
	/** Number of radial segments (higher = smoother) */
	radialSegments?: number;
};

const pillDefaults: ZylemPillOptions = {
	...commonDefaults,
	radius: 0.5,
	length: 1,
	capSegments: 10,
	radialSegments: 20,
};

export const PILL_TYPE = Symbol('Pill');

/**
 * A pill/capsule entity with configurable radius and cylindrical length.
 * Uses Three.js CapsuleGeometry for rendering and Rapier capsule collider for physics.
 */
export class ZylemPill extends GameEntity<ZylemPillOptions> {
	static type = PILL_TYPE;

	constructor(options?: ZylemPillOptions) {
		super();
		this.options = { ...pillDefaults, ...options };
	}

	buildInfo(): Record<string, any> {
		const delegate = new DebugDelegate(this as any);
		const baseInfo = delegate.buildDebugInfo();
		const radius = this.options.radius ?? 0.5;
		const length = this.options.length ?? 1;
		return {
			...baseInfo,
			type: String(ZylemPill.type),
			radius: radius.toFixed(2),
			length: length.toFixed(2),
		};
	}
}

type PillOptions = BaseNode | Partial<ZylemPillOptions>;

/**
 * Create a pill (capsule) entity.
 * @param args Options or child nodes
 */
export function createPill(...args: Array<PillOptions>): ZylemPill {
	const options = mergeArgs(args, pillDefaults);
	const entity = new ZylemPill(options);
	entity.add(
		pillMesh({
			radius: options.radius,
			length: options.length,
			capSegments: options.capSegments,
			radialSegments: options.radialSegments,
			material: options.material,
			color: options.color,
		}),
		pillCollision({
			radius: options.radius,
			length: options.length,
			static: options.collision?.static,
			sensor: options.collision?.sensor,
			collisionType: options.collisionType,
			collisionFilter: options.collisionFilter,
		}),
	);
	return entity;
}
