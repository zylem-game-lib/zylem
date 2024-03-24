import { AnimationAction, AnimationClip, AnimationMixer, Object3D } from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { Mixin } from 'ts-mixer';

import { EntityParameters, GameEntity } from "../../core";
import { GameEntityOptions } from "../../interfaces/entity";
import { Moveable } from '../../behaviors/moveable';
import { ActorMesh, ActorCollision } from './index';

type ZylemActorOptions = {
	static?: boolean;
	animations?: string[];
}

type ActorOptions = GameEntityOptions<ZylemActorOptions, ZylemActor>;

export class ZylemActor extends Mixin(GameEntity, ActorMesh, ActorCollision, Moveable) {
	protected type = 'Actor';
	_static: boolean = false;
	_fbxLoader: FBXLoader = new FBXLoader();
	_object: Object3D | null = null;
	_mixer: AnimationMixer | null = null;
	_actions: AnimationAction[] = [];
	_animations: AnimationClip[] | null = null;
	_animationFileNames: string[] = [];
	_currentAction: AnimationAction | null = null;
	_animationIndex: number = 0;

	constructor(options: ZylemActorOptions) {
		super(options as GameEntityOptions<{}, unknown>);
		this._static = options.static ?? false;
		this._animationFileNames = options.animations || [];
	}

	init() {
		this.createFromBlueprint();
	}

	async createFromBlueprint(): Promise<this> {
		await this.load(this._animationFileNames);
		// TODO: consider refactor to not have to pass materials
		this.createMesh({ group: this.group, object: this._object, materials: [] });
		this.createCollision({ isDynamicBody: !this._static, object: this._object });
		this._currentAction?.play();
		return Promise.resolve(this);
	}

	public setup(params: EntityParameters<ZylemActor>): void {
		super.setup(params);
		this._setup({ ...params, entity: this });
	}

	public update(params: EntityParameters<ZylemActor>): void {
		const { delta } = params;
		super.update(params);
		this._mixer!.update(delta);
		this._update({ ...params, entity: this });
	}

	public destroy(params: EntityParameters<ZylemActor>): void {
		super.destroy(params);
		this._destroy({ ...params, entity: this });
	}

	loadFile(file: string): Promise<AnimationClip> {
		return new Promise((resolve, reject) => {
			return this._fbxLoader.load(
				file,
				(object: Object3D) => {
					if (!this._object) {
						this._object = object;
					}
					if (!this._mixer) {
						this._mixer = new AnimationMixer(object);
					}
					const animation = object.animations[this._animationIndex];
					resolve(animation);
				},
				(xhr: { loaded: number; total: number; }) => {
					console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
				},
				(error: any) => {
					console.error(error);
					reject(error);
				}
			)
		});
	}

	/**
	 * load
	 * loads fbx file paths for animating an actor entity
	 * @param files
	 */
	async load(files: string[]): Promise<any> {
		const promises = new Array();
		for (let file of files) {
			promises.push(this.loadFile(file));
		}
		const animations = await Promise.all(promises);
		this._animations = animations;
		for (let animation of this._animations) {
			if (this._mixer) {
				const action: AnimationAction = this._mixer?.clipAction(animation);
				this._actions.push(action);
			}
		}
		this._currentAction = this._actions[this._animationIndex];
		return this;
	}

	animate(animationIndex: number) {
		if (this._actions.length === 0) { return; }
		if (this._animationIndex === animationIndex) {
			return;
		}
		const previousIndex = this._animationIndex;
		this._currentAction = this._actions[animationIndex];
		this._currentAction.play();
		this._actions[previousIndex].stop();
		this._animationIndex = animationIndex;
	}
}

export function Actor(options: ActorOptions): ZylemActor {
	return new ZylemActor(options) as ZylemActor;
}