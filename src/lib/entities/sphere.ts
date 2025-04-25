import { ColliderDesc } from '@dimforge/rapier3d-compat';
import { SphereGeometry } from 'three';
import { Vector3 } from 'three';
import { ZylemBlueColor } from '../core/utility';
import { BaseNode } from '../core/base-node';
import { EntityBuilder, EntityCollisionBuilder, EntityMeshBuilder, EntityOptions, GameEntity } from './entity';
import { createEntity } from './create';

type ZylemSphereOptions = EntityOptions & {
	radius?: number;
};

const sphereDefaults: ZylemSphereOptions = {
	radius: 1,
	position: new Vector3(0, 0, 0),
	collision: {
		static: false,
	},
	material: {
		color: ZylemBlueColor,
		shader: 'standard'
	},
};

export class SphereCollisionBuilder extends EntityCollisionBuilder {
	collider(options: ZylemSphereOptions): ColliderDesc {
		const radius = options.radius ?? 1;
		let colliderDesc = ColliderDesc.ball(radius);
		return colliderDesc;
	}
}

export class SphereMeshBuilder extends EntityMeshBuilder {
	buildGeometry(options: ZylemSphereOptions): SphereGeometry {
		const radius = options.radius ?? 1;
		return new SphereGeometry(radius);
	}
}

export class SphereBuilder extends EntityBuilder<ZylemSphere, ZylemSphereOptions> {
	protected createEntity(options: Partial<ZylemSphereOptions>): ZylemSphere {
		return new ZylemSphere(options);
	}
}

export const SPHERE_TYPE = Symbol('Sphere');

export class ZylemSphere extends GameEntity<ZylemSphereOptions> {
	static type = SPHERE_TYPE;

	constructor(options?: ZylemSphereOptions) {
		super();
		this.options = { ...sphereDefaults, ...options };
	}
}

type SphereOptions = BaseNode | Partial<ZylemSphereOptions>;

export async function sphere(...args: Array<SphereOptions>): Promise<ZylemSphere> {
	return createEntity<ZylemSphere, ZylemSphereOptions>({
		args,
		defaultConfig: sphereDefaults,
		EntityClass: ZylemSphere,
		BuilderClass: SphereBuilder,
		MeshBuilderClass: SphereMeshBuilder,
		CollisionBuilderClass: SphereCollisionBuilder,
		entityType: ZylemSphere.type
	});
}