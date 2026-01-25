import { ColliderDesc } from '@dimforge/rapier3d-compat';
import { Group, RingGeometry } from 'three';
import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { EntityBuilder } from './builder';
import { EntityCollisionBuilder } from './builder';
import { EntityMeshBuilder } from './builder';
import { DebugDelegate } from './delegates/debug';
import { createEntity } from './create';
import { commonDefaults } from './common';

type ZylemDiskOptions = GameEntityOptions & {
	innerRadius?: number;
	outerRadius?: number;
	thetaSegments?: number;
};

const diskDefaults: ZylemDiskOptions = {
	...commonDefaults,
	innerRadius: 0,
	outerRadius: 1,
	thetaSegments: 32,
};

export class DiskCollisionBuilder extends EntityCollisionBuilder {
	collider(options: ZylemDiskOptions): ColliderDesc {
		const outerRadius = options.outerRadius ?? 1;
		const height = 0.1; // thin disk
		// Use cylinder collider for disk (very flat)
		let colliderDesc = ColliderDesc.cylinder(height / 2, outerRadius);
		return colliderDesc;
	}
}

export class DiskMeshBuilder extends EntityMeshBuilder {
	build(options: ZylemDiskOptions): RingGeometry {
		const innerRadius = options.innerRadius ?? 0;
		const outerRadius = options.outerRadius ?? 1;
		const thetaSegments = options.thetaSegments ?? 32;
		const geometry = new RingGeometry(innerRadius, outerRadius, thetaSegments);
		// Rotate from XY plane to XZ plane to match cylinder collider
		geometry.rotateX(-Math.PI / 2);
		return geometry;
	}
}

export class DiskBuilder extends EntityBuilder<ZylemDisk, ZylemDiskOptions> {
	protected createEntity(options: Partial<ZylemDiskOptions>): ZylemDisk {
		return new ZylemDisk(options);
	}

	build(): ZylemDisk {
		const entity = super.build();
		// Wrap mesh in group for proper transform sync
		if (entity.mesh && !entity.group) {
			entity.group = new Group();
			entity.group.add(entity.mesh);
		}
		return entity;
	}
}

export const DISK_TYPE = Symbol('Disk');

export class ZylemDisk extends GameEntity<ZylemDiskOptions> {
	static type = DISK_TYPE;

	constructor(options?: ZylemDiskOptions) {
		super();
		this.options = { ...diskDefaults, ...options };
	}

	buildInfo(): Record<string, any> {
		const delegate = new DebugDelegate(this as any);
		const baseInfo = delegate.buildDebugInfo();
		const innerRadius = this.options.innerRadius ?? 0;
		const outerRadius = this.options.outerRadius ?? 1;
		return {
			...baseInfo,
			type: String(ZylemDisk.type),
			innerRadius: innerRadius.toFixed(2),
			outerRadius: outerRadius.toFixed(2),
		};
	}
}

type DiskOptions = BaseNode | Partial<ZylemDiskOptions>;

export function createDisk(...args: Array<DiskOptions>): ZylemDisk {
	return createEntity<ZylemDisk, ZylemDiskOptions>({
		args,
		defaultConfig: diskDefaults,
		EntityClass: ZylemDisk,
		BuilderClass: DiskBuilder,
		MeshBuilderClass: DiskMeshBuilder,
		CollisionBuilderClass: DiskCollisionBuilder,
		entityType: ZylemDisk.type
	});
}
