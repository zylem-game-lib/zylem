import { ColliderDesc } from "@dimforge/rapier3d-compat";
import { GameEntity, GameEntityOptions } from "./entity";
import { BufferGeometry, Group, Material, Mesh, Color } from "three";
import { CollisionBuilder } from "../collision/collision-builder";
import { MeshBuilder } from "../graphics/mesh";
import { MaterialBuilder, MaterialOptions } from "../graphics/material";
import { Vec3 } from "../core/vector";

export abstract class EntityCollisionBuilder extends CollisionBuilder {
	abstract collider(options: GameEntityOptions): ColliderDesc;
}

export abstract class EntityMeshBuilder extends MeshBuilder {
	build(options: GameEntityOptions): BufferGeometry {
		return new BufferGeometry();
	}

	postBuild(): void {
		return;
	}
}

export abstract class EntityBuilder<T extends GameEntity<U> & P, U extends GameEntityOptions, P = any> {
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
		const builders: NonNullable<GameEntityOptions["_builders"]> = {
			meshBuilder: this.meshBuilder,
			collisionBuilder: this.collisionBuilder,
			materialBuilder: this.materialBuilder,
		};
		(this.options as Partial<GameEntityOptions>)._builders = builders;
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

	applyMaterialToGroup(group: Group, materials: Material[]): void {
		group.traverse((child) => {
			if (child instanceof Mesh) {
				if (child.type === 'SkinnedMesh' && materials[0] && !child.material.map) {
					child.material = materials[0];
				}
			}
			child.castShadow = true;
			child.receiveShadow = true;
		});
	}

	async build(): Promise<T> {
		const entity = this.entity;
		if (this.materialBuilder) {
			entity.materials = this.materialBuilder.materials;
		}
		if (this.meshBuilder && entity.materials) {
			const geometry = this.meshBuilder.build(this.options);
			entity.mesh = this.meshBuilder._build(this.options, geometry, entity.materials);
			this.meshBuilder.postBuild();
		}

		if (entity.group && entity.materials) {
			this.applyMaterialToGroup(entity.group, entity.materials);
		}

		if (this.collisionBuilder) {
			this.collisionBuilder.withCollision(this.options?.collision || {});
			this.collisionBuilder.withPhysics(this.options?.physics || {});
			const [bodyDesc, colliderDesc] = this.collisionBuilder.build(this.options as any);
			entity.bodyDesc = bodyDesc;
			entity.colliderDesc = colliderDesc;

			const { x, y, z } = this.options.position || { x: 0, y: 0, z: 0 };
			entity.bodyDesc.setTranslation(x, y, z);
		}
		if (this.options.collisionType) {
			entity.collisionType = this.options.collisionType;
		}

		if (this.options.color instanceof Color) {
			const applyColor = (material: Material) => {
				const anyMat = material as any;
				if (anyMat && anyMat.color && anyMat.color.set) {
					anyMat.color.set(this.options.color as Color);
				}
			};
			if (entity.materials?.length) {
				for (const mat of entity.materials) applyColor(mat);
			}
			if (entity.mesh && entity.mesh.material) {
				const mat = entity.mesh.material as any;
				if (Array.isArray(mat)) mat.forEach(applyColor); else applyColor(mat);
			}
			if (entity.group) {
				entity.group.traverse((child) => {
					if (child instanceof Mesh && child.material) {
						const mat = child.material as any;
						if (Array.isArray(mat)) mat.forEach(applyColor); else applyColor(mat);
					}
				});
			}
		}

		return entity;
	}

	protected abstract createEntity(options: Partial<U>): T;
}