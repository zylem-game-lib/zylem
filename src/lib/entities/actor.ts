import { ActiveCollisionTypes, ColliderDesc } from '@dimforge/rapier3d-compat';
import { BufferGeometry, Object3D, SkinnedMesh, Group } from 'three';
import { AnimationAction, AnimationClip, AnimationMixer } from 'three';
import { BaseNode } from '../core/base-node';
import { EntityBuilder, EntityCollisionBuilder, EntityOptions, GameEntity } from './entity';
import { createEntity } from './create';
import { UpdateContext } from '../core/base-node-life-cycle';
import { EntityAssetLoader, AssetLoaderResult } from '../core/entity-asset-loader';
import { EntityLoaderDelegate } from './loader';

type ZylemActorOptions = EntityOptions & {
	static?: boolean;
	animations?: string[];
	models?: string[];
};

const actorDefaults: ZylemActorOptions = {
	position: { x: 0, y: 0, z: 0 },
	collision: {
		static: false,
	},
	material: {
		shader: 'standard'
	},
	animations: [],
	models: []
};

export class ActorCollisionBuilder extends EntityCollisionBuilder {
	private height: number = 1;
	private objectModel: Group | null = null;

	constructor(data: any) {
		super();
		this.objectModel = data.objectModel;
	}

	createColliderFromObjectModel(objectModel: Group | null): ColliderDesc {
		if (!objectModel) return ColliderDesc.capsule(1, 1);

		const skinnedMesh = objectModel.children[0] as SkinnedMesh;
		const geometry = skinnedMesh.geometry as BufferGeometry;

		if (geometry) {
			geometry.computeBoundingBox();
			if (geometry.boundingBox) {
				const maxY = geometry.boundingBox.max.y;
				const minY = geometry.boundingBox.min.y;
				this.height = maxY - minY;
			}
		}

		let colliderDesc = ColliderDesc.capsule(this.height / 2, 1);
		colliderDesc.setSensor(false);
		colliderDesc.setTranslation(0, this.height / 2, 0);
		colliderDesc.activeCollisionTypes = ActiveCollisionTypes.DEFAULT;

		return colliderDesc;
	}

	collider(options: ZylemActorOptions): ColliderDesc {
		let colliderDesc = this.createColliderFromObjectModel(this.objectModel);

		return colliderDesc;
	}
}

export class ActorBuilder extends EntityBuilder<ZylemActor, ZylemActorOptions> {
	protected createEntity(options: Partial<ZylemActorOptions>): ZylemActor {
		return new ZylemActor(options);
	}
}

export const ACTOR_TYPE = Symbol('Actor');

export class ZylemActor extends GameEntity<ZylemActorOptions> implements EntityLoaderDelegate {
	static type = ACTOR_TYPE;

	private _object: Object3D | null = null;
	private _mixer: AnimationMixer | null = null;
	private _actions: AnimationAction[] = [];
	private _animations: AnimationClip[] | null = null;
	private _animationFileNames: string[] = [];
	private _currentAction: AnimationAction | null = null;
	private _animationIndex: number = 0;
	private _modelFileNames: string[] = [];
	private _assetLoader: EntityAssetLoader = new EntityAssetLoader();

	constructor(options?: ZylemActorOptions) {
		super();
		this.options = { ...actorDefaults, ...options };
		this.lifeCycleDelegate = {
			update: this.update.bind(this),
		};
	}

	async load(): Promise<void> {
		this._animationFileNames = this.options.animations || [];
		this._modelFileNames = this.options.models || [];
		await this.loadModels();
		await this.loadAnimations();
	}

	async data(): Promise<any> {
		return {
			animations: this._animations,
			objectModel: this._object,
		};
	}

	async setup(): Promise<void> {
		this._animationFileNames = this.options.animations || [];
		this._modelFileNames = this.options.models || [];
		await this.loadModels();
		await this.loadAnimations();
	}

	async update(params: UpdateContext<ZylemActorOptions>): Promise<void> {
		if (this._mixer) {
			this._mixer.update(params.delta);
		}
	}

	private async loadModels(): Promise<void> {
		if (this._modelFileNames.length === 0) return;
		const promises = this._modelFileNames.map(file => this._assetLoader.loadFile(file));
		const results = await Promise.all(promises);
		if (results[0]?.object) {
			this._object = results[0].object;
		}
		if (this._object) {
			this.group = new Group();
			this.group.attach(this._object);
		}
	}

	private async loadAnimations(): Promise<void> {
		if (this._animationFileNames.length === 0) return;
		const promises = this._animationFileNames.map(file => this._assetLoader.loadFile(file));
		const results = await Promise.all(promises);
		const animationClips = results
			.filter((result): result is AssetLoaderResult => result?.animation !== undefined)
			.map(result => result.animation!);
		if (animationClips.length > 0) {
			this._animationIndex = 0;
			this._animations = animationClips;
			if (this._object) {
				this._mixer = new AnimationMixer(this._object);
				if (this._mixer) {
					this._actions = this._animations.map(animation => this._mixer!.clipAction(animation));
					this._currentAction = this._actions[this._animationIndex];
				}
			}
			this._currentAction?.play();
		}
	}

	get object(): Object3D | null {
		return this._object;
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