import { AnimationAction, AnimationClip, AnimationMixer, Mesh, Object3D } from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Mixin } from 'ts-mixer';

import { EntityParameters, StageEntity, IGameEntity } from "../../core";
import { GameEntityOptions } from "../../interfaces/entity";
import { Moveable } from '../../behaviors/moveable';
import { ActorMesh, ActorCollision } from './index';
import { EntityErrors } from '~/lib/core/errors';
import { ZylemMaterial } from '~/lib/core/material';
import { Behavior } from '~/lib/behaviors/behavior';

enum FileExtensionTypes {
	FBX = 'fbx',
	GLTF = 'gltf'
}
type SupportedLoaders = FBXLoader | GLTFLoader;
const compatibleExtensions: Array<FileExtensionTypes> = [FileExtensionTypes.FBX, FileExtensionTypes.GLTF];

type ZylemActorOptions = {
	static?: boolean;
	animations?: string[];
	models?: string[];
}

type ActorOptions = GameEntityOptions<ZylemActorOptions, ZylemActor>;

export class ZylemActor extends Mixin(StageEntity, ZylemMaterial, ActorMesh, ActorCollision, Moveable, EntityErrors) implements IGameEntity {

	public type = 'Actor';

	_fbxLoader: FBXLoader = new FBXLoader();
	_gltfLoader: GLTFLoader = new GLTFLoader();
	_loaderMap: Map<FileExtensionTypes, SupportedLoaders> = new Map();
	_object: Object3D | null = null;
	_mixer: AnimationMixer | null = null;
	_actions: AnimationAction[] = [];
	_animations: AnimationClip[] | null = null;
	_animationFileNames: string[] = [];
	_currentAction: AnimationAction | null = null;
	_animationIndex: number = 0;
	_modelFileNames: string[] = [];

	constructor(options: ZylemActorOptions) {
		super(options as GameEntityOptions<{}, unknown>);
		this._static = options.static ?? false;
		this._animationFileNames = options.animations || [];
		this._modelFileNames = options.models || [];
		this._loaderMap.set(FileExtensionTypes.FBX, this._fbxLoader);
		this._loaderMap.set(FileExtensionTypes.GLTF, this._gltfLoader);
	}
	uuid: string;
	eid: number;
	_custom: any;
	_behaviors: Behavior[];
	_setup: Function;
	_update: Function;
	_destroy: Function;

	async create(): Promise<this> {
		await this.load(this._animationFileNames);
		await this.load(this._modelFileNames);
		// TODO: consider refactor to not have to pass materials
		this.createMesh({ group: this.group, object: this._object, materials: this.materials });
		this.controlledRotation = true;;
		this.createCollision({ isDynamicBody: !this._static, object: this._object });
		return Promise.resolve(this);
	}

	public setup(params: EntityParameters<this>): void {
		super.setup(params);
		this._currentAction?.play();
		this._setup({ ...params, entity: this });
	}

	public update(params: EntityParameters<this>): void {
		const { delta } = params;
		super.update(params);
		if (this._mixer) {
			this._mixer.update(delta);
		}
		this._update({ ...params, entity: this });
	}

	public destroy(params: EntityParameters<this>): void {
		super.destroy(params);
		this._destroy({ ...params, entity: this });
	}

	loadFile(file: string): Promise<AnimationClip | any> {
		const extension = new URL(file, 'file://').pathname.split('.').pop();
		const isCompatible = compatibleExtensions.includes(extension as FileExtensionTypes);
		const dynamicFileLoader = this._loaderMap.get(extension as FileExtensionTypes);
		if (!isCompatible || !dynamicFileLoader) {
			// this.errorIncompatibleFileType(extension);
			return Promise.reject(null);
		}
		return new Promise((resolve, reject) => {
			if (dynamicFileLoader instanceof FBXLoader) {
				return dynamicFileLoader.load(
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
			}
			if (dynamicFileLoader instanceof GLTFLoader) {
				return dynamicFileLoader.load(
					file,
					(gltf: GLTF) => {
						this._object = gltf.scene;
						resolve(gltf);
					},
					(xhr: { loaded: number; total: number; }) => {
						console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
					},
					(error: any) => {
						console.error(error);
						reject(error);
					}
				)
			}
		});
	}

	/**
	 * load
	 * loads fbx file paths for animating an actor entity
	 * @param files
	 */
	async load(files: string[]): Promise<any> {
		if (files.length === 0) {
			return;
		}
		const promises = new Array();
		for (let file of files) {
			promises.push(this.loadFile(file));
		}
		const loadedFiles = await Promise.all(promises);
		// TODO: create better abstraction
		if (loadedFiles[0] instanceof AnimationClip) {
			this._animations = loadedFiles;
			for (let animation of this._animations) {
				if (this._mixer) {
					const action: AnimationAction = this._mixer?.clipAction(animation);
					this._actions.push(action);
				}
			}
			this._currentAction = this._actions[this._animationIndex];
		} else {
			this.group.add(loadedFiles[0].scene);
		}
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

export function actor(options: ActorOptions, ...behaviors: Behavior[]): ZylemActor {
	const zylemActor = new ZylemActor(options) as ZylemActor;
	zylemActor._behaviors = behaviors ?? [];
	return zylemActor;
}