import { Mesh, Material, ShaderMaterial, BufferGeometry, AxesHelper, Group } from "three";
import { v4 as uuidv4 } from 'uuid';
import { ColliderDesc, RigidBodyDesc } from "@dimforge/rapier3d-compat";

import { position, rotation, scale } from "~/lib/behaviors/transformable.system";
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

export interface LifeCycleDelegate<U> {
	setup?: (params: SetupContext<U>) => void;
	update?: (params: UpdateContext<U>) => void;
	destroy?: (params: DestroyContext<U>) => void;
}

export type EntityOptions = {
	size?: Vec3;
	position?: Vec3;
	batched?: boolean;
	collision?: Partial<CollisionOptions>;
	physics?: Partial<PhysicsOptions>;
	material?: Partial<MaterialOptions>;
	custom?: { [key: string]: any };
	_builders?: {
		meshBuilder?: EntityMeshBuilder | null;
		collisionBuilder?: EntityCollisionBuilder | null;
		materialBuilder?: MaterialBuilder | null;
	};
}

export class GameEntity<O extends EntityOptions> extends BaseNode<O> {
	public group: Group | undefined;
	public uuid: string = '';
	public mesh: Mesh | undefined;
	public materials: Material[] | undefined;
	public rigidBody: RigidBodyDesc | undefined;
	public collider: ColliderDesc | undefined;
	public custom: Record<string, any> = {};
	protected lifeCycleDelegate: LifeCycleDelegate<O> | undefined;

	constructor() {
		super();
		this.uuid = uuidv4();
	}

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

	protected _setup(params: SetupContext<this>): void {
		if (this.lifeCycleDelegate?.setup) {
			this.lifeCycleDelegate.setup({ ...params, entity: this as unknown as O });
		}
	}

	protected _update(params: UpdateContext<this>): void {
		this.updateMaterials(params);
		if (this.lifeCycleDelegate?.update) {
			this.lifeCycleDelegate.update({ ...params, entity: this as unknown as O });
		}
	}

	protected _destroy(params: DestroyContext<this>): void {
		if (this.lifeCycleDelegate?.destroy) {
			this.lifeCycleDelegate.destroy({ ...params, entity: this as unknown as O });
		}
	}

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
	protected meshBuilder: EntityMeshBuilder | null;
	protected collisionBuilder: EntityCollisionBuilder | null;
	protected materialBuilder: MaterialBuilder | null;
	protected options: Partial<U>;
	protected entity: T;

	constructor(
		options: Partial<U>,
		entity: T,
		meshBuilder: EntityMeshBuilder | null,
		collisionBuilder: EntityCollisionBuilder | null,
	) {
		this.options = options;
		this.entity = entity;
		this.meshBuilder = meshBuilder;
		this.collisionBuilder = collisionBuilder;
		this.materialBuilder = new MaterialBuilder();
		this.options._builders = {
			meshBuilder: this.meshBuilder,
			collisionBuilder: this.collisionBuilder,
			materialBuilder: this.materialBuilder
		};
	}

	withPosition(setupPosition: Vec3): this {
		this.options.position = setupPosition;
		return this;
	}

	async withMaterial(options: Partial<MaterialOptions>, entityType: symbol): Promise<this> {
		if (this.materialBuilder) {
			await this.materialBuilder.build(options, entityType);
		}
		return this;
	}

	async build(): Promise<T> {
		const entity = this.entity;
		if (this.materialBuilder) {
			entity.materials = this.materialBuilder.materials;
		}
		if (this.meshBuilder && entity.materials) {
			const geometry = this.meshBuilder.buildGeometry(this.options);
			entity.mesh = this.meshBuilder.build(this.options, geometry, entity.materials);
			entity.mesh = this.meshBuilder.postBuild(entity.mesh);

			const axesHelper = new AxesHelper(2);
			entity.mesh?.add(axesHelper);
		}

		if (this.collisionBuilder) {
			this.collisionBuilder.withCollision(this.options?.collision || {});
			this.collisionBuilder.withPhysics(this.options?.physics || {});
			const [rigidBody, collider] = this.collisionBuilder.build(this.options);
			entity.rigidBody = rigidBody;
			entity.collider = collider;

			const { x, y, z } = this.options.position || { x: 0, y: 0, z: 0 };
			entity.rigidBody.setTranslation(x, y, z);
		}

		return entity;
	}

	protected abstract createEntity(options: Partial<U>): T;
}