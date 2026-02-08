import { ColliderDesc } from '@dimforge/rapier3d-compat';
import { ConeGeometry } from 'three';
import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { EntityBuilder } from './builder';
import { EntityCollisionBuilder } from './builder';
import { EntityMeshBuilder } from './builder';
import { DebugDelegate } from './delegates/debug';
import { createEntity } from './create';

type ZylemPyramidOptions = GameEntityOptions & {
	/** Base radius of the pyramid */
	radius?: number;
	/** Height of the pyramid */
	height?: number;
};

import { commonDefaults } from './common';

const pyramidDefaults: ZylemPyramidOptions = {
	...commonDefaults,
	radius: 1,
	height: 2,
};

export class PyramidCollisionBuilder extends EntityCollisionBuilder {
	collider(options: ZylemPyramidOptions): ColliderDesc {
		const radius = options.radius ?? 1;
		const height = options.height ?? 2;
		// Use a cone collider as approximation for the 4-sided pyramid
		let colliderDesc = ColliderDesc.cone(height / 2, radius);
		return colliderDesc;
	}
}

export class PyramidMeshBuilder extends EntityMeshBuilder {
	build(options: ZylemPyramidOptions): ConeGeometry {
		const radius = options.radius ?? 1;
		const height = options.height ?? 2;
		// 4 radial segments creates a pyramid shape
		return new ConeGeometry(radius, height, 4);
	}
}

export class PyramidBuilder extends EntityBuilder<ZylemPyramid, ZylemPyramidOptions> {
	protected createEntity(options: Partial<ZylemPyramidOptions>): ZylemPyramid {
		return new ZylemPyramid(options);
	}
}

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
	return createEntity<ZylemPyramid, ZylemPyramidOptions>({
		args,
		defaultConfig: pyramidDefaults,
		EntityClass: ZylemPyramid,
		BuilderClass: PyramidBuilder,
		MeshBuilderClass: PyramidMeshBuilder,
		CollisionBuilderClass: PyramidCollisionBuilder,
		entityType: ZylemPyramid.type
	});
}
