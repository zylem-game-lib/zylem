import { ActiveCollisionTypes, ColliderDesc } from '@dimforge/rapier3d-compat';
import { BufferGeometry, Object3D, SkinnedMesh, Group, Vector3 } from 'three';
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

type ZylemActorOptions = GameEntityOptions & {
	static?: boolean;
	animations?: AnimationObject[];
	models?: string[];
	scale?: Vec3;
	material?: MaterialOptions;
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
	models: []
};

class ActorCollisionBuilder extends EntityCollisionBuilder {
	private height: number = 1;
	private objectModel: Group | null = null;

	constructor(data: any) {
		super();
		this.objectModel = data.objectModel;
	}

	createColliderFromObjectModel(objectModel: Group | null): ColliderDesc {
		if (!objectModel) return ColliderDesc.capsule(1, 1);

		const skinnedMesh = objectModel.children.find(child => child instanceof SkinnedMesh) as SkinnedMesh;
		const geometry = skinnedMesh.geometry as BufferGeometry;

		if (geometry) {
			geometry.computeBoundingBox();
			if (geometry.boundingBox) {
				const maxY = geometry.boundingBox.max.y;
				const minY = geometry.boundingBox.min.y;
				this.height = maxY - minY;
			}
		}
		this.height = 1;
		let colliderDesc = ColliderDesc.capsule(this.height / 2, 1);
		colliderDesc.setSensor(false);
		colliderDesc.setTranslation(0, this.height + 0.5, 0);
		colliderDesc.activeCollisionTypes = ActiveCollisionTypes.DEFAULT;

		return colliderDesc;
	}

	collider(options: ZylemActorOptions): ColliderDesc {
		let colliderDesc = this.createColliderFromObjectModel(this.objectModel);

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

	async load(): Promise<void> {
		this._modelFileNames = this.options.models || [];
		await this.loadModels();
		if (this._object) {
			this._animationDelegate = new AnimationDelegate(this._object);
			await this._animationDelegate.loadAnimations(this.options.animations || []);
			// Emit animation loaded event
			this.dispatch('entity:animation:loaded', {
				entityId: this.uuid,
				animationCount: this.options.animations?.length || 0
			});
		}
	}

	async data(): Promise<any> {
		return {
			animations: this._animationDelegate?.animations,
			objectModel: this._object,
		};
	}

	async actorUpdate(params: UpdateContext<ZylemActorOptions>): Promise<void> {
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

	private async loadModels(): Promise<void> {
		if (this._modelFileNames.length === 0) return;

		// Emit loading started event
		this.dispatch('entity:model:loading', {
			entityId: this.uuid,
			files: this._modelFileNames
		});

		const promises = this._modelFileNames.map(file => this._assetLoader.loadFile(file));
		const results = await Promise.all(promises);
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
		}

		// Emit model loaded event
		this.dispatch('entity:model:loaded', {
			entityId: this.uuid,
			success: !!this._object,
			meshCount
		});
	}

	playAnimation(animationOptions: AnimationOptions) {
		this._animationDelegate?.playAnimation(animationOptions);
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

export async function actor(...args: Array<ActorOptions>): Promise<ZylemActor> {
	return await createEntity<ZylemActor, ZylemActorOptions>({
		args,
		defaultConfig: actorDefaults,
		EntityClass: ZylemActor,
		BuilderClass: ActorBuilder,
		CollisionBuilderClass: ActorCollisionBuilder,
		entityType: ZylemActor.type
	});
}