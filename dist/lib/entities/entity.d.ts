import { Mesh, Material, ShaderMaterial, Group, Color } from "three";
import { Collider, ColliderDesc, RigidBody, RigidBodyDesc } from "@dimforge/rapier3d-compat";
import { Vec3 } from "../core/vector";
import { MaterialBuilder, MaterialOptions } from "../graphics/material";
import { CollisionOptions } from "../collision/collision";
import { BaseNode } from "../core/base-node";
import { DestroyContext, SetupContext, UpdateContext, LoadedContext, CleanupContext } from "../core/base-node-life-cycle";
import type { EntityMeshBuilder, EntityCollisionBuilder } from "./builder";
export declare abstract class AbstractEntity {
    abstract uuid: string;
    abstract eid: number;
    abstract name: string;
}
export interface LifeCycleDelegate<U> {
    setup?: ((params: SetupContext<U>) => void)[];
    update?: ((params: UpdateContext<U>) => void)[];
    destroy?: ((params: DestroyContext<U>) => void)[];
}
export interface CollisionContext<T, O extends GameEntityOptions, TGlobals extends Record<string, unknown> = any> {
    entity: T;
    other: GameEntity<O>;
    globals: TGlobals;
}
export type BehaviorContext<T, O extends GameEntityOptions> = SetupContext<T, O> | UpdateContext<T, O> | CollisionContext<T, O> | DestroyContext<T, O>;
export type BehaviorCallback<T, O extends GameEntityOptions> = (params: BehaviorContext<T, O>) => void;
export interface CollisionDelegate<T, O extends GameEntityOptions> {
    collision?: ((params: CollisionContext<T, O>) => void)[];
}
export type IBuilder<BuilderOptions = any> = {
    preBuild: (options: BuilderOptions) => BuilderOptions;
    build: (options: BuilderOptions) => BuilderOptions;
    postBuild: (options: BuilderOptions) => BuilderOptions;
};
export type GameEntityOptions = {
    name?: string;
    color?: Color;
    size?: Vec3;
    position?: Vec3;
    batched?: boolean;
    collision?: Partial<CollisionOptions>;
    material?: Partial<MaterialOptions>;
    custom?: {
        [key: string]: any;
    };
    collisionType?: string;
    collisionGroup?: string;
    collisionFilter?: string[];
    _builders?: {
        meshBuilder?: IBuilder | EntityMeshBuilder | null;
        collisionBuilder?: IBuilder | EntityCollisionBuilder | null;
        materialBuilder?: MaterialBuilder | null;
    };
};
export declare abstract class GameEntityLifeCycle {
    abstract _setup(params: SetupContext<this>): void;
    abstract _update(params: UpdateContext<this>): void;
    abstract _destroy(params: DestroyContext<this>): void;
}
export interface EntityDebugInfo {
    buildInfo: () => Record<string, string>;
}
export type BehaviorCallbackType = 'setup' | 'update' | 'destroy' | 'collision';
export declare class GameEntity<O extends GameEntityOptions> extends BaseNode<O> implements GameEntityLifeCycle, EntityDebugInfo {
    group: Group | undefined;
    mesh: Mesh | undefined;
    materials: Material[] | undefined;
    bodyDesc: RigidBodyDesc | null;
    body: RigidBody | null;
    colliderDesc: ColliderDesc | undefined;
    collider: Collider | undefined;
    custom: Record<string, any>;
    debugInfo: Record<string, any>;
    debugMaterial: ShaderMaterial | undefined;
    lifeCycleDelegate: LifeCycleDelegate<O>;
    collisionDelegate: CollisionDelegate<this, O>;
    collisionType?: string;
    behaviorCallbackMap: Record<BehaviorCallbackType, BehaviorCallback<this, O>[]>;
    constructor();
    create(): this;
    onSetup(...callbacks: ((params: SetupContext<this>) => void)[]): this;
    onUpdate(...callbacks: ((params: UpdateContext<this>) => void)[]): this;
    onDestroy(...callbacks: ((params: DestroyContext<this>) => void)[]): this;
    onCollision(...callbacks: ((params: CollisionContext<this, O>) => void)[]): this;
    _setup(params: SetupContext<this>): void;
    protected _loaded(_params: LoadedContext<this>): Promise<void>;
    _update(params: UpdateContext<this>): void;
    _destroy(params: DestroyContext<this>): void;
    protected _cleanup(_params: CleanupContext<this>): Promise<void>;
    _collision(other: GameEntity<O>, globals?: any): void;
    addBehavior(behaviorCallback: ({
        type: BehaviorCallbackType;
        handler: any;
    })): this;
    addBehaviors(behaviorCallbacks: ({
        type: BehaviorCallbackType;
        handler: any;
    })[]): this;
    protected updateMaterials(params: any): void;
    buildInfo(): Record<string, string>;
}
//# sourceMappingURL=entity.d.ts.map