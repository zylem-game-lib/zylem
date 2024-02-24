import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { LifecycleParameters, UpdateParameters } from "../core/entity";
import { GameEntity } from "../core/game-entity";
import { GameEntityOptions } from "../interfaces/entity";
import { AnimationAction, AnimationClip, AnimationMixer, Group, Object3D } from 'three';
import { Moveable } from '../behaviors/moveable';
import { applyMixins } from '../core/composable';
import { ActorCollision } from '../collision/collision';
import { ActorMesh } from '../core/mesh';

type ZylemActorOptions = GameEntityOptions<ZylemActor> & {
	static?: boolean;
	animations?: string[];
}

export class ZylemActor extends GameEntity<ZylemActor> {
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
		const bluePrint = options;
		super(bluePrint);
		this._static = bluePrint.static ?? false;
		this._animationFileNames = bluePrint.animations || [];
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

	async createFromBlueprint(): Promise<this> {
		await this.load(this._animationFileNames);
		// TODO: consider refactor to not have to pass materials
		this.createMesh({ group: this.group, object: this._object, materials: [] });
		this.createCollision({ isDynamicBody: !this._static });
		this._currentAction?.play();
		return Promise.resolve(this);
	}

	public setup(params: LifecycleParameters<ZylemActor>) {
		super.setup({ ...params, entity: this });
		this._setup({ ...params, entity: this });
	}

	public update(params: UpdateParameters<ZylemActor>): void {
		const { delta } = params;
		super.update({ ...params, entity: this });
		this._mixer!.update(delta);
		this._update({ ...params, entity: this });
	}

	public destroy(params: LifecycleParameters<ZylemActor>): void {
		super.destroy({ ...params, entity: this });
		this._destroy({ ...params, entity: this });
	}
}

class _Actor {};

export interface ZylemActor extends Moveable, ActorMesh, ActorCollision, _Actor {};

export function Actor(options: ZylemActorOptions): ZylemActor {
	applyMixins(ZylemActor, [Moveable, ActorMesh, ActorCollision, _Actor]);

	return new ZylemActor(options) as ZylemActor;
}