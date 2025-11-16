import { Object3D } from 'three';
import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { UpdateContext } from '../core/base-node-life-cycle';
import { EntityLoaderDelegate } from './delegates/loader';
import { Vec3 } from '../core/vector';
import { AnimationOptions } from './delegates/animation';
import { MaterialOptions } from '../graphics/material';
import { DebugInfoProvider } from './delegates/debug';
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
export declare class ZylemActor extends GameEntity<ZylemActorOptions> implements EntityLoaderDelegate, DebugInfoProvider {
    static type: symbol;
    private _object;
    private _animationDelegate;
    private _modelFileNames;
    private _assetLoader;
    controlledRotation: boolean;
    constructor(options?: ZylemActorOptions);
    load(): Promise<void>;
    data(): Promise<any>;
    actorUpdate(params: UpdateContext<ZylemActorOptions>): Promise<void>;
    private loadModels;
    playAnimation(animationOptions: AnimationOptions): void;
    get object(): Object3D | null;
    /**
     * Provide custom debug information for the actor
     * This will be merged with the default debug information
     */
    getDebugInfo(): Record<string, any>;
}
type ActorOptions = BaseNode | ZylemActorOptions;
export declare function actor(...args: Array<ActorOptions>): Promise<ZylemActor>;
export {};
//# sourceMappingURL=actor.d.ts.map