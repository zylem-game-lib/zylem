import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { DebugDelegate } from './delegates/debug';
import { commonDefaults, mergeArgs } from './common';
import { cylinderMesh } from './parts/mesh-factories';
import { cylinderCollision } from './parts/collision-factories';

type ZylemCylinderOptions = GameEntityOptions & {
	/** Top radius of the cylinder */
	radiusTop?: number;
	/** Bottom radius of the cylinder */
	radiusBottom?: number;
	/** Height of the cylinder */
	height?: number;
	/** Number of radial segments (higher = smoother) */
	radialSegments?: number;
};

const cylinderDefaults: ZylemCylinderOptions = {
	...commonDefaults,
	radiusTop: 1,
	radiusBottom: 1,
	height: 2,
	radialSegments: 32,
};

export const CYLINDER_TYPE = Symbol('Cylinder');

/**
 * A cylinder entity with configurable top/bottom radii, height, and segments.
 * Uses a Rapier cylinder collider for physics.
 */
export class ZylemCylinder extends GameEntity<ZylemCylinderOptions> {
	static type = CYLINDER_TYPE;

	constructor(options?: ZylemCylinderOptions) {
		super();
		this.options = { ...cylinderDefaults, ...options };
	}

	buildInfo(): Record<string, any> {
		const delegate = new DebugDelegate(this as any);
		const baseInfo = delegate.buildDebugInfo();
		const radiusTop = this.options.radiusTop ?? 1;
		const radiusBottom = this.options.radiusBottom ?? 1;
		const height = this.options.height ?? 2;
		return {
			...baseInfo,
			type: String(ZylemCylinder.type),
			radiusTop: radiusTop.toFixed(2),
			radiusBottom: radiusBottom.toFixed(2),
			height: height.toFixed(2),
		};
	}
}

type CylinderOptions = BaseNode | Partial<ZylemCylinderOptions>;

/**
 * Create a cylinder entity.
 * @param args Options or child nodes
 */
export function createCylinder(...args: Array<CylinderOptions>): ZylemCylinder {
	const options = mergeArgs(args, cylinderDefaults);
	const entity = new ZylemCylinder(options);
	entity.add(
		cylinderMesh({
			radiusTop: options.radiusTop,
			radiusBottom: options.radiusBottom,
			height: options.height,
			radialSegments: options.radialSegments,
			material: options.material,
			color: options.color,
		}),
		cylinderCollision({
			radiusTop: options.radiusTop,
			radiusBottom: options.radiusBottom,
			height: options.height,
			static: options.collision?.static,
			sensor: options.collision?.sensor,
			collisionType: options.collisionType,
			collisionFilter: options.collisionFilter,
		}),
	);
	return entity;
}
