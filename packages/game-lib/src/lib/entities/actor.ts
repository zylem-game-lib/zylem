import { ActiveCollisionTypes, ColliderDesc } from '@dimforge/rapier3d-compat';
import { BufferGeometry, Object3D, SkinnedMesh, Mesh, MeshStandardMaterial, Group, Vector3 } from 'three';
import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { createEntity } from './create';
import { UpdateContext, UpdateFunction } from '../core/base-node-life-cycle';
import { EntityAssetLoader } from '../core/entity-asset-loader';
import { EntityLoaderDelegate } from './delegates/loader';
import { Vec3 } from '../core/vector';
import { AnimationDelegate, AnimationOptions } from './delegates/animation';
import { MaterialOptions } from '../graphics/material';
import { DebugInfoProvider } from './delegates/debug';
import { EntityBuilder } from './builder';
import { EntityCollisionBuilder } from './builder';

type AnimationObject = {
	key?: string;
	path: string;
};

export type CollisionShapeType = 'capsule' | 'model';

type ZylemActorOptions = GameEntityOptions & {
	static?: boolean;
	animations?: AnimationObject[];
	models?: string[];
	scale?: Vec3;
	material?: MaterialOptions;
	collisionShape?: CollisionShapeType;
};

const actorDefaults: ZylemActorOptions = {
	position: { x: 0, y: 0, z: 0 },
	collision: {
		static: false,
		size: new Vector3(0.5, 0.5, 0.5),
		position: new Vector3(0, 0, 0),
	},
	material: {
		shader: 'standard',
	},
	animations: [],
	models: [],
	collisionShape: 'capsule',
};

class ActorCollisionBuilder extends EntityCollisionBuilder {
	private objectModel: Group | null = null;
	private collisionShape: CollisionShapeType = 'capsule';

	constructor(data: any) {
		super();
		this.objectModel = data.objectModel;
		this.collisionShape = data.collisionShape ?? 'capsule';
	}

	collider(options: ZylemActorOptions): ColliderDesc {
		if (this.collisionShape === 'model') {
			return this.createColliderFromModel(this.objectModel, options);
		}
		return this.createCapsuleCollider(options);
	}

	/**
	 * Create a capsule collider based on size options (character controller style).
	 */
	private createCapsuleCollider(options: ZylemActorOptions): ColliderDesc {
		const size = options.collision?.size ?? options.size ?? { x: 0.5, y: 1, z: 0.5 };
		const halfHeight = ((size as any).y || 1);
		const radius = Math.max((size as any).x || 0.5, (size as any).z || 0.5);
		let colliderDesc = ColliderDesc.capsule(halfHeight, radius);
		colliderDesc.setSensor(false);
		colliderDesc.setTranslation(0, halfHeight + radius, 0);
		colliderDesc.activeCollisionTypes = ActiveCollisionTypes.DEFAULT;
		return colliderDesc;
	}

	/**
	 * Create a collider based on model geometry (works with Mesh and SkinnedMesh).
	 * If collision.size and collision.position are provided, use those instead of computing from geometry.
	 */
	private createColliderFromModel(objectModel: Group | null, options: ZylemActorOptions): ColliderDesc {
		const collisionSize = options.collision?.size;
		const collisionPosition = options.collision?.position;

		// If user provided explicit size, use that instead of computing from model
		if (collisionSize) {
			const halfWidth = (collisionSize as any).x / 2;
			const halfHeight = (collisionSize as any).y / 2;
			const halfDepth = (collisionSize as any).z / 2;

			let colliderDesc = ColliderDesc.cuboid(halfWidth, halfHeight, halfDepth);
			colliderDesc.setSensor(false);

			// Use user-provided position or default to center
			const posX = collisionPosition ? (collisionPosition as any).x : 0;
			const posY = collisionPosition ? (collisionPosition as any).y : halfHeight;
			const posZ = collisionPosition ? (collisionPosition as any).z : 0;
			colliderDesc.setTranslation(posX, posY, posZ);
			colliderDesc.activeCollisionTypes = ActiveCollisionTypes.DEFAULT;
			return colliderDesc;
		}

		// Fall back to computing from model geometry
		if (!objectModel) return this.createCapsuleCollider(options);

		// Find first Mesh (SkinnedMesh or regular Mesh)
		let foundGeometry: BufferGeometry | null = null;
		objectModel.traverse((child) => {
			if (!foundGeometry && (child as any).isMesh) {
				foundGeometry = (child as Mesh).geometry as BufferGeometry;
			}
		});

		if (!foundGeometry) return this.createCapsuleCollider(options);

		const geometry: BufferGeometry = foundGeometry;
		geometry.computeBoundingBox();
		const box = geometry.boundingBox;
		if (!box) return this.createCapsuleCollider(options);

		const height = box.max.y - box.min.y;
		const width = box.max.x - box.min.x;
		const depth = box.max.z - box.min.z;

		// Create box collider based on mesh bounds
		let colliderDesc = ColliderDesc.cuboid(width / 2, height / 2, depth / 2);
		colliderDesc.setSensor(false);
		// Position collider at center of model
		const centerY = (box.max.y + box.min.y) / 2;
		colliderDesc.setTranslation(0, centerY, 0);
		colliderDesc.activeCollisionTypes = ActiveCollisionTypes.DEFAULT;
		return colliderDesc;
	}
}

class ActorBuilder extends EntityBuilder<ZylemActor, ZylemActorOptions> {
	protected createEntity(options: Partial<ZylemActorOptions>): ZylemActor {
		return new ZylemActor(options);
	}
}

export const ACTOR_TYPE = Symbol('Actor');

export class ZylemActor extends GameEntity<ZylemActorOptions> implements EntityLoaderDelegate, DebugInfoProvider {
	static type = ACTOR_TYPE;

	private _object: Object3D | null = null;
	private _animationDelegate: AnimationDelegate | null = null;
	private _modelFileNames: string[] = [];
	private _assetLoader: EntityAssetLoader = new EntityAssetLoader();

	controlledRotation: boolean = false;

	constructor(options?: ZylemActorOptions) {
		super();
		this.options = { ...actorDefaults, ...options };
		// Add actor-specific update to the lifecycle callbacks
		this.prependUpdate(this.actorUpdate.bind(this) as UpdateFunction<this>);
		this.controlledRotation = true;
	}

	/**
	 * Initiates model and animation loading in background (deferred).
	 * Call returns immediately; assets will be ready on subsequent updates.
	 */
	load(): void {
		this._modelFileNames = this.options.models || [];
		// Start async loading in background
		this.loadModelsDeferred();
	}

	/**
	 * Returns current data synchronously.
	 * May return null values if loading is still in progress.
	 */
	data(): any {
		return {
			animations: this._animationDelegate?.animations,
			objectModel: this._object,
			collisionShape: this.options.collisionShape,
		};
	}

	actorUpdate(params: UpdateContext<ZylemActorOptions>): void {
		this._animationDelegate?.update(params.delta);
	}

	/**
	 * Clean up actor resources including animations, models, and groups
	 */
	actorDestroy(): void {
		// Stop and dispose animation delegate
		if (this._animationDelegate) {
			this._animationDelegate.dispose();
			this._animationDelegate = null;
		}

		// Dispose geometries and materials from loaded object
		if (this._object) {
			this._object.traverse((child) => {
				if ((child as any).isMesh) {
					const mesh = child as SkinnedMesh;
					mesh.geometry?.dispose();
					if (Array.isArray(mesh.material)) {
						mesh.material.forEach(m => m.dispose());
					} else if (mesh.material) {
						mesh.material.dispose();
					}
				}
			});
			this._object = null;
		}

		// Clear group reference
		if (this.group) {
			this.group.clear();
			this.group = null as any;
		}

		// Clear file name references
		this._modelFileNames = [];
	}

	/**
	 * Deferred loading - starts async load and updates entity when complete.
	 * Called by synchronous load() method.
	 */
	private loadModelsDeferred(): void {
		if (this._modelFileNames.length === 0) return;

		// Emit loading started event
		this.dispatch('entity:model:loading', {
			entityId: this.uuid,
			files: this._modelFileNames
		});

		const promises = this._modelFileNames.map(file => this._assetLoader.loadFile(file));
		Promise.all(promises).then(results => {
			if (results[0]?.object) {
				this._object = results[0].object;
			}
			// Count meshes for the loaded event
			let meshCount = 0;
			if (this._object) {
				this._object.traverse((child) => {
					if ((child as any).isMesh) meshCount++;
				});
				this.group = new Group();
				this.group.attach(this._object);
				this.group.scale.set(
					this.options.scale?.x || 1,
					this.options.scale?.y || 1,
					this.options.scale?.z || 1
				);

				// Apply material overrides if specified
				this.applyMaterialOverrides();

				// Load animations after model is ready
				this._animationDelegate = new AnimationDelegate(this._object);
				this._animationDelegate.loadAnimations(this.options.animations || []).then(() => {
					this.dispatch('entity:animation:loaded', {
						entityId: this.uuid,
						animationCount: this.options.animations?.length || 0
					});
				});
			}

			// Emit model loaded event
			this.dispatch('entity:model:loaded', {
				entityId: this.uuid,
				success: !!this._object,
				meshCount
			});
		});
	}

	playAnimation(animationOptions: AnimationOptions) {
		this._animationDelegate?.playAnimation(animationOptions);
	}

	/**
	 * Apply material overrides from options to all meshes in the loaded model.
	 * Only applies if material options are explicitly specified (not just defaults).
	 */
	private applyMaterialOverrides(): void {
		const materialOptions = this.options.material;
		// Only apply if user specified material options beyond defaults
		if (!materialOptions || (!materialOptions.color && !materialOptions.path)) {
			return;
		}

		if (!this._object) return;

		this._object.traverse((child) => {
			if ((child as any).isMesh) {
				const mesh = child as Mesh;
				if (materialOptions.color) {
					// Create new material with the specified color
					const newMaterial = new MeshStandardMaterial({
						color: materialOptions.color,
						emissiveIntensity: 0.5,
						lightMapIntensity: 0.5,
						fog: true,
					});
					mesh.castShadow = true;
					mesh.receiveShadow = true;
					mesh.material = newMaterial;
				}
			}
		});
	}

	get object(): Object3D | null {
		return this._object;
	}

	/**
	 * Provide custom debug information for the actor
	 * This will be merged with the default debug information
	 */
	getDebugInfo(): Record<string, any> {
		const debugInfo: Record<string, any> = {
			type: 'Actor',
			models: this._modelFileNames.length > 0 ? this._modelFileNames : 'none',
			modelLoaded: !!this._object,
			scale: this.options.scale ?
				`${this.options.scale.x}, ${this.options.scale.y}, ${this.options.scale.z}` :
				'1, 1, 1',
		};

		// Add animation info if available
		if (this._animationDelegate) {
			debugInfo.currentAnimation = this._animationDelegate.currentAnimationKey || 'none';
			debugInfo.animationsCount = this.options.animations?.length || 0;
		}

		// Add mesh info if model is loaded
		if (this._object) {
			let meshCount = 0;
			let vertexCount = 0;
			this._object.traverse((child) => {
				if ((child as any).isMesh) {
					meshCount++;
					const geometry = (child as SkinnedMesh).geometry;
					if (geometry && geometry.attributes.position) {
						vertexCount += geometry.attributes.position.count;
					}
				}
			});
			debugInfo.meshCount = meshCount;
			debugInfo.vertexCount = vertexCount;
		}

		return debugInfo;
	}
}

type ActorOptions = BaseNode | ZylemActorOptions;

export function createActor(...args: Array<ActorOptions>): ZylemActor {
	return createEntity<ZylemActor, ZylemActorOptions>({
		args,
		defaultConfig: actorDefaults,
		EntityClass: ZylemActor,
		BuilderClass: ActorBuilder,
		CollisionBuilderClass: ActorCollisionBuilder,
		entityType: ZylemActor.type
	});
}