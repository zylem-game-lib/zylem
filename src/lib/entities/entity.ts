import { Mesh, Material, ShaderMaterial, BufferGeometry } from "three";
import { ColliderDesc, RigidBodyDesc } from "@dimforge/rapier3d-compat";

import { position, rotation, scale } from "~/lib/behaviors/components/transform";
import { Vec3 } from "../core/vector";
import { MaterialBuilder, MaterialOptions } from "../graphics/material";
import { PhysicsOptions } from "../collision/physics";
import { CollisionOptions } from "../collision/collision";
import { BaseNode } from "../core/base-node";
import { DestroyContext, SetupContext, UpdateContext } from "../core/base-node-life-cycle";
import { CollisionBuilder } from "../collision/collision-builder";
import { MeshBuilder } from "../graphics/mesh";

export abstract class AbstractEntity {
	abstract uuid: string;
	abstract eid: number;
}

export type EntityOptions = {
	size?: Vec3;
	position?: Vec3;
	batched?: boolean;
	collision?: Partial<CollisionOptions>;
	physics?: Partial<PhysicsOptions>;
	material?: Partial<MaterialOptions>;
	custom?: { [key: string]: any };
}

export class GameEntity<O extends EntityOptions> extends BaseNode<O> {
	public group = null;
	public instanceId: number = 0;
	public mesh: Mesh | undefined;
	public materials: Material[] | undefined;
	public rigidBody: RigidBodyDesc | undefined;
	public collider: ColliderDesc | undefined;
	public custom: Record<string, any> = {};

	public create(): this {
		const { position: setupPosition } = this.options;
		const { x, y, z } = setupPosition || { x: 0, y: 0, z: 0 };
		this.behaviors = [
			{ component: position, values: { x, y, z } },
			{ component: scale, values: { x: 0, y: 0, z: 0 } },
			{ component: rotation, values: { x: 0, y: 0, z: 0, w: 0 } },
		];
		return this;
	}

	protected _setup(params: SetupContext<this>): void { }

	protected _update(params: UpdateContext<this>): void {
		this.updateMaterials(params);
	}

	protected _destroy(params: DestroyContext<this>): void { }

	protected updateMaterials(params: any) {
		if (!this.materials?.length) {
			return;
		}
		for (const material of this.materials) {
			if (material instanceof ShaderMaterial) {
				if (material.uniforms) {
					material.uniforms.iTime.value += params.delta;
				}
			}
		}
	}
}

export abstract class EntityCollisionBuilder extends CollisionBuilder {
	abstract collider(options: EntityOptions): ColliderDesc;
}

export abstract class EntityMeshBuilder extends MeshBuilder {
	abstract buildGeometry(options: EntityOptions): BufferGeometry;
}

export abstract class EntityBuilder<T extends GameEntity<any>, U extends EntityOptions> {
	protected meshBuilder: EntityMeshBuilder;
	protected collisionBuilder: EntityCollisionBuilder;
	protected materialBuilder: MaterialBuilder;
	protected options: Partial<U>;

	constructor(options: Partial<U>, meshBuilder: EntityMeshBuilder, collisionBuilder: EntityCollisionBuilder) {
		this.options = options;
		this.meshBuilder = meshBuilder;
		this.collisionBuilder = collisionBuilder;
		this.materialBuilder = new MaterialBuilder();
	}

	withPosition(setupPosition: Vec3): this {
		this.options.position = setupPosition;
		return this;
	}

	async withMaterial(options: Partial<MaterialOptions>, entityType: symbol): Promise<this> {
		await this.materialBuilder.build(options, entityType);
		return this;
	}

	async build(): Promise<T> {
		const entity = this.createEntity(this.options);

		entity.materials = this.materialBuilder.materials;
		const geometry = this.meshBuilder.buildGeometry(this.options);
		entity.mesh = this.meshBuilder.build(this.options, geometry, entity.materials);

		this.collisionBuilder.withCollision(this.options?.collision || {});
		this.collisionBuilder.withPhysics(this.options?.physics || {});
		const [rigidBody, collider] = this.collisionBuilder.build(this.options);
		entity.rigidBody = rigidBody;
		entity.collider = collider;

		const { x, y, z } = this.options.position || { x: 0, y: 0, z: 0 };
		entity.rigidBody.setTranslation(x, y, z);
		return entity;
	}

	protected abstract createEntity(options: Partial<U>): T;
}