import { ColliderDesc, RigidBodyDesc } from '@dimforge/rapier3d-compat';
import { SphereGeometry, Group, Material, Mesh, Color } from 'three';
import { Vector3 } from 'three';
import { position, rotation, scale } from "~/lib/behaviors/components/transform";
import { MaterialBuilder } from '../graphics/material';
import { ZylemBlueColor } from '../core/utility';
import { CreateMeshParameters, MeshBuilder } from '~/lib/graphics/mesh';
import { BaseNode } from '../core/base-node';
import { CollisionBuilder } from '../collision/collision-builder';
import { MaterialOptions } from '../graphics/material';
import { EntityOptions, GameEntity } from './entity';
import { Vec3 } from '../core/vector';

export class SphereCollisionBuilder extends CollisionBuilder {
	collisionRadius: number = 1;

	collider(): ColliderDesc {
		let colliderDesc = ColliderDesc.ball(this.collisionRadius);
		return colliderDesc;
	}
}

export class SphereMeshBuilder extends MeshBuilder {
	radius: number = 1;
}

export class SphereBuilder {
	private meshBuilder: SphereMeshBuilder;
	private collisionBuilder: SphereCollisionBuilder;
	private materialBuilder: MaterialBuilder;
	private options: Partial<ZylemSphereOptions>;

	constructor(options: Partial<ZylemSphereOptions>) {
		this.options = { ...sphereDefaults, ...options };
		this.meshBuilder = new SphereMeshBuilder();
		this.collisionBuilder = new SphereCollisionBuilder();
		this.materialBuilder = new MaterialBuilder();

		if (options.radius) this.withRadius(options.radius);
		if (options.position) this.withPosition(options.position);

		this.collisionBuilder
			.withCollision(options?.collision ?? {})
			.withPhysics(options?.physics ?? {});
	}

	withRadius(radius: number): this {
		this.meshBuilder.radius = radius;
		this.collisionBuilder.collisionRadius = radius;
		return this;
	}

	withPosition(setupPosition: Vec3): this {
		this.options.position = setupPosition;
		return this;
	}

	async withMaterial(options: Partial<MaterialOptions>): Promise<this> {
		await this.materialBuilder.build(options, SPHERE_TYPE);
		return this;
	}

	async build(): Promise<ZylemSphere> {
		const sphere = new ZylemSphere(this.options);

		sphere.materials = this.materialBuilder.materials;

		const geometry = new SphereGeometry(this.meshBuilder.radius);
		sphere.mesh = this.meshBuilder.build(this.options, geometry, sphere.materials);

		const [rigidBody, collider] = this.collisionBuilder.build(
			this.collisionBuilder.collider.bind(this.collisionBuilder)
		);
		sphere.rigidBody = rigidBody;
		sphere.collider = collider;

		const { x, y, z } = this.options.position || { x: 0, y: 0, z: 0 };
		sphere.rigidBody.setTranslation(x, y, z);
		return sphere;
	}
}

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

export const SPHERE_TYPE = Symbol('Sphere');

export class ZylemSphere extends GameEntity<ZylemSphereOptions> {
	public type = SPHERE_TYPE;

	constructor(options?: ZylemSphereOptions) {
		super();
		this.options = { ...sphereDefaults, ...options };
	}
}

type SphereOptions = BaseNode | Partial<ZylemSphereOptions>;

export async function sphere(...args: Array<SphereOptions>): Promise<ZylemSphere> {
	let builder;

	for (const arg of args) {
		if (arg instanceof BaseNode) {
			continue;
		}
		builder = new SphereBuilder(arg);
		if (arg.material) await builder.withMaterial(arg.material);
	}

	if (!builder) {
		throw new Error("missing options for ZylemSphere, builder is not initialized.");
	}
	return await builder.build();
}
