import { ColliderDesc } from '@dimforge/rapier3d-compat';
import { BoxGeometry } from 'three';
import { Vector3 } from 'three';
import { MaterialBuilder } from '../graphics/material';
import { ZylemBlueColor } from '../core/utility';
import { MeshBuilder } from '~/lib/graphics/mesh';
import { BaseNode } from '../core/base-node';
import { CollisionBuilder } from '../collision/collision-builder';
import { MaterialOptions } from '../graphics/material';
import { EntityOptions, GameEntity } from './entity';
import { Vec3 } from '../core/vector';

export class BoxCollisionBuilder extends CollisionBuilder {
	collisionSize: Vec3 = new Vector3(1, 1, 1);

	collider(): ColliderDesc {
		const size = this.collisionSize || new Vector3(1, 1, 1);
		const half = { x: size.x / 2, y: size.y / 2, z: size.z / 2 };
		let colliderDesc = ColliderDesc.cuboid(half.x, half.y, half.z);
		return colliderDesc;
	}
}

export class BoxMeshBuilder extends MeshBuilder {
	size: Vec3 = new Vector3(1, 1, 1);
}

export class BoxBuilder {
	private meshBuilder: BoxMeshBuilder;
	private collisionBuilder: BoxCollisionBuilder;
	private materialBuilder: MaterialBuilder;
	private options: Partial<ZylemBoxOptions>;

	constructor(options: Partial<ZylemBoxOptions>) {
		this.options = { ...boxDefaults, ...options };
		this.meshBuilder = new BoxMeshBuilder();
		this.collisionBuilder = new BoxCollisionBuilder();
		this.materialBuilder = new MaterialBuilder();

		if (options.size) this.withSize(options.size);
		if (options.position) this.withPosition(options.position);

		this.collisionBuilder
			.withCollision(options?.collision ?? {})
			.withPhysics(options?.physics ?? {});
	}

	withSize(size: Vec3): this {
		this.meshBuilder.size = size;
		this.collisionBuilder.collisionSize = size;
		return this;
	}

	withPosition(setupPosition: Vec3): this {
		this.options.position = setupPosition;
		return this;
	}

	async withMaterial(options: Partial<MaterialOptions>): Promise<this> {
		await this.materialBuilder.build(options, BOX_TYPE);
		return this;
	}

	async build(): Promise<ZylemBox> {
		const box = new ZylemBox(this.options);

		box.materials = this.materialBuilder.materials;
		const meshSize = this.meshBuilder.size ?? new Vector3(1, 1, 1);
		const geometry = new BoxGeometry(meshSize.x, meshSize.y, meshSize.z);
		box.mesh = this.meshBuilder.build(this.options, geometry, box.materials);

		const [rigidBody, collider] = this.collisionBuilder.build(
			this.collisionBuilder.collider.bind(this.collisionBuilder)
		);
		box.rigidBody = rigidBody;
		box.collider = collider;

		const { x, y, z } = this.options.position || { x: 0, y: 0, z: 0 };
		box.rigidBody.setTranslation(x, y, z);
		return box;
	}
}

type ZylemBoxOptions = EntityOptions;

const boxDefaults: ZylemBoxOptions = {
	size: new Vector3(1, 1, 1),
	position: new Vector3(0, 0, 0),
	collision: {
		static: false,
	},
	material: {
		color: ZylemBlueColor,
		shader: 'standard'
	},
};

export const BOX_TYPE = Symbol('Box');

export class ZylemBox extends GameEntity<ZylemBoxOptions> {
	public type = BOX_TYPE;

	constructor(options?: ZylemBoxOptions) {
		super();
		this.options = { ...boxDefaults, ...options };
	}
}

type BoxOptions = BaseNode | ZylemBoxOptions;

export async function box(...args: Array<BoxOptions>): Promise<ZylemBox> {
	let builder;

	for (const arg of args) {
		if (arg instanceof BaseNode) {
			continue;
		}
		builder = new BoxBuilder(arg);
		if (arg.material) await builder.withMaterial(arg.material);
	}

	if (!builder) {
		throw new Error("missing options for ZylemBox, builder is not initialized.");
	}
	return await builder.build();
}
