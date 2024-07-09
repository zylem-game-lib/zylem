import { AnimationAction, AnimationClip, AnimationMixer, Object3D } from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { EntityParameters, GameEntity } from "../../core";
import { GameEntityOptions } from "../../interfaces/entity";
import { Moveable } from '../../behaviors/moveable';
import { ActorMesh, ActorCollision } from './index';
type ZylemActorOptions = {
    static?: boolean;
    animations?: string[];
};
type ActorOptions = GameEntityOptions<ZylemActorOptions, ZylemActor>;
declare const ZylemActor_base: import("ts-mixer/dist/types/types").Class<any[], GameEntity<unknown> & ActorMesh & ActorCollision & Moveable, (new (options: GameEntityOptions<{
    collision?: import("../../interfaces/entity").CollisionOption<unknown> | undefined;
}, unknown>) => GameEntity<unknown>) & typeof ActorMesh & typeof ActorCollision & typeof Moveable>;
export declare class ZylemActor extends ZylemActor_base {
    protected type: string;
    _static: boolean;
    _fbxLoader: FBXLoader;
    _object: Object3D | null;
    _mixer: AnimationMixer | null;
    _actions: AnimationAction[];
    _animations: AnimationClip[] | null;
    _animationFileNames: string[];
    _currentAction: AnimationAction | null;
    _animationIndex: number;
    constructor(options: ZylemActorOptions);
    createFromBlueprint(): Promise<this>;
    setup(params: EntityParameters<ZylemActor>): void;
    update(params: EntityParameters<ZylemActor>): void;
    destroy(params: EntityParameters<ZylemActor>): void;
    loadFile(file: string): Promise<AnimationClip>;
    /**
     * load
     * loads fbx file paths for animating an actor entity
     * @param files
     */
    load(files: string[]): Promise<any>;
    animate(animationIndex: number): void;
}
export declare function actor(options: ActorOptions): ZylemActor;
export {};
