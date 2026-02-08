import { ColliderDesc } from '@dimforge/rapier3d-compat';
import { CapsuleGeometry, Color } from 'three';
import { Vector3 } from 'three';
import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { EntityBuilder } from './builder';
import { EntityCollisionBuilder } from './builder';
import { EntityMeshBuilder } from './builder';
import { DebugDelegate } from './delegates/debug';
import { createEntity } from './create';

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

import { commonDefaults } from './common';

const pillDefaults: ZylemPillOptions = {
	...commonDefaults,
	radius: 0.5,
	length: 1,
	capSegments: 10,
	radialSegments: 20,
};

export class PillCollisionBuilder extends EntityCollisionBuilder {
	collider(options: ZylemPillOptions): ColliderDesc {
		const radius = options.radius ?? 0.5;
		const length = options.length ?? 1;
		// Rapier capsule uses half-length of the cylindrical section
		let colliderDesc = ColliderDesc.capsule(length / 2, radius);
		return colliderDesc;
	}
}

export class PillMeshBuilder extends EntityMeshBuilder {
	build(options: ZylemPillOptions): CapsuleGeometry {
		const radius = options.radius ?? 0.5;
		const length = options.length ?? 1;
		const capSegments = options.capSegments ?? 10;
		const radialSegments = options.radialSegments ?? 20;
		return new CapsuleGeometry(radius, length, capSegments, radialSegments);
	}
}

export class PillBuilder extends EntityBuilder<ZylemPill, ZylemPillOptions> {
	protected createEntity(options: Partial<ZylemPillOptions>): ZylemPill {
		return new ZylemPill(options);
	}
}

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
	return createEntity<ZylemPill, ZylemPillOptions>({
		args,
		defaultConfig: pillDefaults,
		EntityClass: ZylemPill,
		BuilderClass: PillBuilder,
		MeshBuilderClass: PillMeshBuilder,
		CollisionBuilderClass: PillCollisionBuilder,
		entityType: ZylemPill.type
	});
}
