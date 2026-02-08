import { ColliderDesc } from '@dimforge/rapier3d-compat';
import { ConeGeometry, Color } from 'three';
import { Vector3 } from 'three';
import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { EntityBuilder } from './builder';
import { EntityCollisionBuilder } from './builder';
import { EntityMeshBuilder } from './builder';
import { DebugDelegate } from './delegates/debug';
import { createEntity } from './create';

type ZylemConeOptions = GameEntityOptions & {
	/** Base radius of the cone */
	radius?: number;
	/** Height of the cone */
	height?: number;
	/** Number of radial segments (higher = smoother) */
	radialSegments?: number;
};

import { commonDefaults } from './common';

const coneDefaults: ZylemConeOptions = {
	...commonDefaults,
	radius: 1,
	height: 2,
	radialSegments: 32,
};

export class ConeCollisionBuilder extends EntityCollisionBuilder {
	collider(options: ZylemConeOptions): ColliderDesc {
		const radius = options.radius ?? 1;
		const height = options.height ?? 2;
		// Rapier uses half-height for cone collider
		let colliderDesc = ColliderDesc.cone(height / 2, radius);
		return colliderDesc;
	}
}

export class ConeMeshBuilder extends EntityMeshBuilder {
	build(options: ZylemConeOptions): ConeGeometry {
		const radius = options.radius ?? 1;
		const height = options.height ?? 2;
		const radialSegments = options.radialSegments ?? 32;
		return new ConeGeometry(radius, height, radialSegments);
	}
}

export class ConeBuilder extends EntityBuilder<ZylemCone, ZylemConeOptions> {
	protected createEntity(options: Partial<ZylemConeOptions>): ZylemCone {
		return new ZylemCone(options);
	}
}

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
	return createEntity<ZylemCone, ZylemConeOptions>({
		args,
		defaultConfig: coneDefaults,
		EntityClass: ZylemCone,
		BuilderClass: ConeBuilder,
		MeshBuilderClass: ConeMeshBuilder,
		CollisionBuilderClass: ConeCollisionBuilder,
		entityType: ZylemCone.type
	});
}
