import { ColliderDesc } from '@dimforge/rapier3d-compat';
import { CylinderGeometry, Color } from 'three';
import { Vector3 } from 'three';
import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { EntityBuilder } from './builder';
import { EntityCollisionBuilder } from './builder';
import { EntityMeshBuilder } from './builder';
import { DebugDelegate } from './delegates/debug';
import { createEntity } from './create';

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

import { commonDefaults } from './common';

const cylinderDefaults: ZylemCylinderOptions = {
	...commonDefaults,
	radiusTop: 1,
	radiusBottom: 1,
	height: 2,
	radialSegments: 32,
};

export class CylinderCollisionBuilder extends EntityCollisionBuilder {
	collider(options: ZylemCylinderOptions): ColliderDesc {
		const radius = Math.max(options.radiusTop ?? 1, options.radiusBottom ?? 1);
		const height = options.height ?? 2;
		// Rapier uses half-height for cylinder collider
		let colliderDesc = ColliderDesc.cylinder(height / 2, radius);
		return colliderDesc;
	}
}

export class CylinderMeshBuilder extends EntityMeshBuilder {
	build(options: ZylemCylinderOptions): CylinderGeometry {
		const radiusTop = options.radiusTop ?? 1;
		const radiusBottom = options.radiusBottom ?? 1;
		const height = options.height ?? 2;
		const radialSegments = options.radialSegments ?? 32;
		return new CylinderGeometry(radiusTop, radiusBottom, height, radialSegments);
	}
}

export class CylinderBuilder extends EntityBuilder<ZylemCylinder, ZylemCylinderOptions> {
	protected createEntity(options: Partial<ZylemCylinderOptions>): ZylemCylinder {
		return new ZylemCylinder(options);
	}
}

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
	return createEntity<ZylemCylinder, ZylemCylinderOptions>({
		args,
		defaultConfig: cylinderDefaults,
		EntityClass: ZylemCylinder,
		BuilderClass: CylinderBuilder,
		MeshBuilderClass: CylinderMeshBuilder,
		CollisionBuilderClass: CylinderCollisionBuilder,
		entityType: ZylemCylinder.type
	});
}
