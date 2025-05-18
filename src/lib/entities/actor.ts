import { ActiveCollisionTypes, ColliderDesc } from '@dimforge/rapier3d-compat';
import { BufferGeometry, Object3D, SkinnedMesh, Group, Vector3 } from 'three';
import { BaseNode } from '../core/base-node';
import { EntityBuilder, EntityCollisionBuilder, EntityOptions, GameEntity } from './entity';
import { createEntity } from './create';
import { UpdateContext } from '../core/base-node-life-cycle';
import { EntityAssetLoader } from '../core/entity-asset-loader';
import { EntityLoaderDelegate } from './delegates/loader';
import { Vec3 } from '../core/vector';
import { AnimationDelegate, AnimationOptions } from './delegates/animation';
import { MaterialOptions } from '../graphics/material';

type AnimationObject = {
	key?: string;
	path: string;
};

type ZylemActorOptions = EntityOptions & {
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

export class ActorCollisionBuilder extends EntityCollisionBuilder {
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

export class ActorBuilder extends EntityBuilder<ZylemActor, ZylemActorOptions> {
	protected createEntity(options: Partial<ZylemActorOptions>): ZylemActor {
		return new ZylemActor(options);
	}
}

export const ACTOR_TYPE = Symbol('Actor');

export class ZylemActor extends GameEntity<ZylemActorOptions> implements EntityLoaderDelegate {
	static type = ACTOR_TYPE;

	private _object: Object3D | null = null;
	private _animationDelegate: AnimationDelegate | null = null;
	private _modelFileNames: string[] = [];
	private _assetLoader: EntityAssetLoader = new EntityAssetLoader();

	controlledRotation: boolean = false;

	constructor(options?: ZylemActorOptions) {
		super();
		this.options = { ...actorDefaults, ...options };
		this.lifeCycleDelegate = {
			update: this.update.bind(this),
		};
		this.controlledRotation = true;
	}

	async load(): Promise<void> {
		this._modelFileNames = this.options.models || [];
		await this.loadModels();
		if (this._object) {
			this._animationDelegate = new AnimationDelegate(this._object);
			await this._animationDelegate.loadAnimations(this.options.animations || []);
		}
	}

	async data(): Promise<any> {
		return {
			animations: this._animationDelegate?.animations,
			objectModel: this._object,
		};
	}

	async update(params: UpdateContext<ZylemActorOptions>): Promise<void> {
		this._animationDelegate?.update(params.delta);
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
			this.group.scale.set(
				this.options.scale?.x || 1,
				this.options.scale?.y || 1,
				this.options.scale?.z || 1
			);
		}
	}

	playAnimation(animationOptions: AnimationOptions) {
		this._animationDelegate?.playAnimation(animationOptions);
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