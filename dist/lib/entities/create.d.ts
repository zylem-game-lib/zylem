import { DebugInfoBuilder, GameEntityOptions } from "./entity";
import { EntityBuilder, EntityCollisionBuilder, EntityMeshBuilder, GameEntity } from "./entity";
export interface CreateGameEntityOptions<T extends GameEntity<any>, CreateOptions extends GameEntityOptions> {
    args: Array<any>;
    defaultConfig: GameEntityOptions;
    EntityClass: new (options: any) => T;
    BuilderClass: new (options: any, entity: T, meshBuilder: any, collisionBuilder: any, debugInfoBuilder: any) => EntityBuilder<T, CreateOptions>;
    MeshBuilderClass?: new (data: any) => EntityMeshBuilder;
    CollisionBuilderClass?: new (data: any) => EntityCollisionBuilder;
    DebugInfoBuilderClass?: new (data: any) => DebugInfoBuilder;
    entityType: symbol;
}
export declare function createEntity<T extends GameEntity<any>, CreateOptions extends GameEntityOptions>(params: CreateGameEntityOptions<T, CreateOptions>): Promise<T>;
