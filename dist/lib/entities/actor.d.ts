import { ColliderDesc } from '@dimforge/rapier3d-compat';
import { Object3D, Group } from 'three';
import { BaseNode } from '../core/base-node';
import { EntityBuilder, EntityCollisionBuilder, GameEntityOptions, GameEntity } from './entity';
import { UpdateContext } from '../core/base-node-life-cycle';
import { EntityLoaderDelegate } from './delegates/loader';
import { Vec3 } from '../core/vector';
import { AnimationOptions } from './delegates/animation';
import { MaterialOptions } from '../graphics/material';
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
export declare class ActorCollisionBuilder extends EntityCollisionBuilder {
    private height;
    private objectModel;
    constructor(data: any);
    createColliderFromObjectModel(objectModel: Group | null): ColliderDesc;
    collider(options: ZylemActorOptions): ColliderDesc;
}
export declare class ActorBuilder extends EntityBuilder<ZylemActor, ZylemActorOptions> {
    protected createEntity(options: Partial<ZylemActorOptions>): ZylemActor;
}
export declare const ACTOR_TYPE: unique symbol;
export declare class ZylemActor extends GameEntity<ZylemActorOptions> implements EntityLoaderDelegate {
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
}
type ActorOptions = BaseNode | ZylemActorOptions;
export declare function actor(...args: Array<ActorOptions>): Promise<ZylemActor>;
export {};
