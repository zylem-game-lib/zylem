import { AnimationAction, AnimationClip, AnimationMixer, Object3D } from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EntityParameters, GameEntity, IGameEntity } from '../../core';
import { GameEntityOptions } from '../../interfaces/entity';
import { Moveable } from '../../behaviors/moveable';
import { ActorMesh, ActorCollision } from './index';
import { EntityErrors } from '~/lib/core/errors';
import { ZylemMaterial } from '~/lib/core/material';
import { Behavior } from '~/lib/behaviors/behavior';
declare enum FileExtensionTypes {
    FBX = 'fbx',
    GLTF = 'gltf'
}
type SupportedLoaders = FBXLoader | GLTFLoader;
type ZylemActorOptions = {
    static?: boolean;
    animations?: string[];
    models?: string[];
};
type ActorOptions = GameEntityOptions<ZylemActorOptions, ZylemActor>;
declare const ZylemActor_base: import('ts-mixer/dist/types/types').Class<any[], GameEntity<unknown> & ZylemMaterial & ActorMesh & ActorCollision & Moveable & EntityErrors, (new (options: GameEntityOptions<{
    collision?: import('../../interfaces/entity').CollisionOption<unknown> | undefined;
}, unknown>) => GameEntity<unknown>) & typeof ZylemMaterial & typeof ActorMesh & typeof ActorCollision & typeof Moveable & typeof EntityErrors>;
export declare class ZylemActor extends ZylemActor_base implements IGameEntity {
	type: string;
	_fbxLoader: FBXLoader;
	_gltfLoader: GLTFLoader;
	_loaderMap: Map<FileExtensionTypes, SupportedLoaders>;
	_object: Object3D | null;
	_mixer: AnimationMixer | null;
	_actions: AnimationAction[];
	_animations: AnimationClip[] | null;
	_animationFileNames: string[];
	_currentAction: AnimationAction | null;
	_animationIndex: number;
	_modelFileNames: string[];
	constructor(options: ZylemActorOptions);
	create(): Promise<this>;
	setup(params: EntityParameters<this>): void;
	update(params: EntityParameters<this>): void;
	destroy(params: EntityParameters<this>): void;
	loadFile(file: string): Promise<AnimationClip | any>;
	/**
     * load
     * loads fbx file paths for animating an actor entity
     * @param files
     */
	load(files: string[]): Promise<any>;
	animate(animationIndex: number): void;
}
export declare function actor(options: ActorOptions, ...behaviors: Behavior[]): ZylemActor;
export {};
