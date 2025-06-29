import { Mesh, Material, BufferGeometry, Group, Color } from "three";
import { Collider, ColliderDesc, RigidBody, RigidBodyDesc } from "@dimforge/rapier3d-compat";
import { Vec3 } from "../core/vector";
import { MaterialBuilder, MaterialOptions } from "../graphics/material";
import { PhysicsOptions } from "../collision/physics";
import { CollisionOptions } from "../collision/collision";
import { BaseNode } from "../core/base-node";
import { DestroyContext, SetupContext, UpdateContext } from "../core/base-node-life-cycle";
import { CollisionBuilder } from "../collision/collision-builder";
import { MeshBuilder } from "../graphics/mesh";
export declare abstract class AbstractEntity {
    abstract uuid: string;
    abstract eid: number;
}
export interface LifeCycleDelegate<U> {
    setup?: (params: SetupContext<U>) => void;
    update?: (params: UpdateContext<U>) => void;
    destroy?: (params: DestroyContext<U>) => void;
}
export interface CollisionContext<T, O extends EntityOptions> {
    entity: T;
    other: GameEntity<O>;
    globals?: any;
}
export interface CollisionDelegate<T, O extends EntityOptions> {
    collision?: (params: CollisionContext<T, O>) => void;
}
export type EntityOptions = {
    color?: Color;
    size?: Vec3;
    position?: Vec3;
    batched?: boolean;
    collision?: Partial<CollisionOptions>;
    physics?: Partial<PhysicsOptions>;
    material?: Partial<MaterialOptions>;
    custom?: {
        [key: string]: any;
    };
    _builders?: {
        meshBuilder?: EntityMeshBuilder | null;
        collisionBuilder?: EntityCollisionBuilder | null;
        materialBuilder?: MaterialBuilder | null;
    };
};
export declare abstract class GameEntityLifeCycle {
    abstract _setup(params: SetupContext<this>): void;
    abstract _update(params: UpdateContext<this>): void;
    abstract _destroy(params: DestroyContext<this>): void;
}
export declare class GameEntity<O extends EntityOptions> extends BaseNode<O> implements GameEntityLifeCycle {
    group: Group | undefined;
    uuid: string;
    mesh: Mesh | undefined;
    materials: Material[] | undefined;
    bodyDesc: RigidBodyDesc | null;
    body: RigidBody | null;
    colliderDesc: ColliderDesc | undefined;
    collider: Collider | undefined;
    custom: Record<string, any>;
    debugInfo: Record<string, any>;
    lifeCycleDelegate: LifeCycleDelegate<O> | undefined;
    collisionDelegate: CollisionDelegate<this, O> | undefined;
    constructor();
    create(): this;
    onSetup(setup: (params: SetupContext<this>) => void): this;
    onUpdate(update: (params: UpdateContext<this>) => void): this;
    onDestroy(destroy: (params: DestroyContext<this>) => void): this;
    onCollision(collision: (params: CollisionContext<this, O>) => void): this;
    _setup(params: SetupContext<this>): void;
    _update(params: UpdateContext<this>): void;
    _destroy(params: DestroyContext<this>): void;
    _collision(other: GameEntity<O>, globals?: any): void;
    protected updateMaterials(params: any): void;
}
export declare abstract class EntityCollisionBuilder extends CollisionBuilder {
    abstract collider(options: EntityOptions): ColliderDesc;
}
export declare abstract class EntityMeshBuilder extends MeshBuilder {
    buildGeometry(options: EntityOptions): BufferGeometry;
    postBuild(): void;
}
export declare abstract class DebugInfoBuilder {
    abstract buildInfo(options: EntityOptions): Record<string, string>;
}
export declare class DefaultDebugInfoBuilder extends DebugInfoBuilder {
    buildInfo(options: EntityOptions): Record<string, string>;
}
export declare abstract class EntityBuilder<T extends GameEntity<U> & P, U extends EntityOptions, P = any> {
    protected meshBuilder: EntityMeshBuilder | null;
    protected collisionBuilder: EntityCollisionBuilder | null;
    protected materialBuilder: MaterialBuilder | null;
    protected debugInfoBuilder: DebugInfoBuilder | null;
    protected options: Partial<U>;
    protected entity: T;
    constructor(options: Partial<U>, entity: T, meshBuilder: EntityMeshBuilder | null, collisionBuilder: EntityCollisionBuilder | null, debugInfoBuilder: DebugInfoBuilder | null);
    withPosition(setupPosition: Vec3): this;
    withMaterial(options: Partial<MaterialOptions>, entityType: symbol): Promise<this>;
    applyMaterialToGroup(group: Group, materials: Material[]): void;
    build(): Promise<T>;
    protected abstract createEntity(options: Partial<U>): T;
}
