import { DebugInfoBuilder, EntityOptions } from "./entity";
import { EntityBuilder, EntityCollisionBuilder, EntityMeshBuilder, GameEntity } from "./entity";
export interface CreateEntityOptions<T extends GameEntity<any>, CreateOptions extends EntityOptions> {
    args: Array<any>;
    defaultConfig: EntityOptions;
    EntityClass: new (options: any) => T;
    BuilderClass: new (options: any, entity: T, meshBuilder: any, collisionBuilder: any, debugInfoBuilder: any) => EntityBuilder<T, CreateOptions>;
    MeshBuilderClass?: new (data: any) => EntityMeshBuilder;
    CollisionBuilderClass?: new (data: any) => EntityCollisionBuilder;
    DebugInfoBuilderClass?: new (data: any) => DebugInfoBuilder;
    entityType: symbol;
}
export declare function createEntity<T extends GameEntity<any>, CreateOptions extends EntityOptions>(params: CreateEntityOptions<T, CreateOptions>): Promise<T>;
