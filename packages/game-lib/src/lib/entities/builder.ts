import { ColliderDesc } from "@dimforge/rapier3d-compat";
import { GameEntity, GameEntityOptions, type CompoundColliderConfig, type CompoundMeshConfig } from "./entity";
import { BufferGeometry, Group, Material, Mesh, Color, BoxGeometry, SphereGeometry, CapsuleGeometry, CylinderGeometry, ConeGeometry, MeshStandardMaterial, Vector3 } from "three";
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

	withMaterial(options: Partial<MaterialOptions>, entityType: symbol): this {
		if (this.materialBuilder) {
			this.materialBuilder.build(options, entityType);
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

	build(): T {
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
			const [bodyDesc, colliderDesc] = this.collisionBuilder.build(this.options as any);
			entity.bodyDesc = bodyDesc;
			entity.colliderDesc = colliderDesc;
			entity.colliderDescs.push(colliderDesc);

			const { x, y, z } = this.options.position || { x: 0, y: 0, z: 0 };
			entity.bodyDesc.setTranslation(x, y, z);
		}
		if (this.options.collisionType) {
			entity.collisionType = this.options.collisionType;
		}

		// Build additional colliders for compound entities
		const additionalColliders = (this.options as Partial<GameEntityOptions>).additionalColliders;
		if (additionalColliders?.length) {
			for (const config of additionalColliders) {
				const desc = EntityBuilder.buildCompoundCollider(config);
				if (desc) {
					entity.colliderDescs.push(desc);
				}
			}
		}

		// Build additional meshes for compound entities
		const additionalMeshes = (this.options as Partial<GameEntityOptions>).additionalMeshes;
		if (additionalMeshes?.length) {
			for (const config of additionalMeshes) {
				const mesh = EntityBuilder.buildCompoundMesh(config);
				if (mesh) {
					entity.compoundMeshes.push(mesh);
				}
			}
			// Ensure the entity has a group so compound meshes can be parented.
			// If only a bare mesh exists, wrap it in a new Group.
			if (!entity.group && entity.mesh) {
				const group = new Group();
				group.add(entity.mesh);
				entity.group = group;
			}
			if (entity.group) {
				for (const compoundMesh of entity.compoundMeshes) {
					entity.group.add(compoundMesh);
				}
			}
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

	/**
	 * Build a ColliderDesc from a compound collider configuration.
	 */
	static buildCompoundCollider(config: CompoundColliderConfig): ColliderDesc | null {
		let desc: ColliderDesc;
		switch (config.shape) {
			case 'box': {
				const s = config.size ?? { x: 1, y: 1, z: 1 };
				desc = ColliderDesc.cuboid(s.x / 2, s.y / 2, s.z / 2);
				break;
			}
			case 'sphere': {
				desc = ColliderDesc.ball(config.radius ?? 0.5);
				break;
			}
			case 'capsule': {
				desc = ColliderDesc.capsule(config.halfHeight ?? 0.5, config.radius ?? 0.25);
				break;
			}
			case 'cylinder': {
				desc = ColliderDesc.cylinder(config.halfHeight ?? 0.5, config.radius ?? 0.5);
				break;
			}
			default:
				return null;
		}
		if (config.offset) {
			desc.setTranslation(config.offset.x, config.offset.y, config.offset.z);
		}
		if (config.sensor) {
			desc.setSensor(true);
		}
		return desc;
	}

	/**
	 * Build a Mesh from a compound mesh configuration.
	 */
	static buildCompoundMesh(config: CompoundMeshConfig): Mesh | null {
		let geometry: BufferGeometry;
		switch (config.geometry) {
			case 'box': {
				const s = config.size ?? { x: 1, y: 1, z: 1 };
				geometry = new BoxGeometry(s.x, s.y, s.z);
				break;
			}
			case 'sphere': {
				geometry = new SphereGeometry(config.radius ?? 0.5);
				break;
			}
			case 'capsule': {
				geometry = new CapsuleGeometry(config.radius ?? 0.25, config.height ?? 1);
				break;
			}
			case 'cylinder': {
				geometry = new CylinderGeometry(config.radius ?? 0.5, config.radius ?? 0.5, config.height ?? 1);
				break;
			}
			case 'cone': {
				geometry = new ConeGeometry(config.radius ?? 0.5, config.height ?? 1, 32);
				break;
			}
			default:
				return null;
		}
		const material = new MeshStandardMaterial();
		const mesh = new Mesh(geometry, material);
		if (config.position) {
			mesh.position.set(config.position.x, config.position.y, config.position.z);
		}
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		return mesh;
	}

	protected abstract createEntity(options: Partial<U>): T;
}