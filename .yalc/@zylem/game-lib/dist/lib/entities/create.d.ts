import { GameEntityOptions, GameEntity } from "./entity";
import { EntityBuilder } from "./builder";
import { EntityCollisionBuilder } from "./builder";
import { EntityMeshBuilder } from "./builder";
export interface CreateGameEntityOptions<T extends GameEntity<any>, CreateOptions extends GameEntityOptions> {
    args: Array<any>;
    defaultConfig: GameEntityOptions;
    EntityClass: new (options: any) => T;
    BuilderClass: new (options: any, entity: T, meshBuilder: any, collisionBuilder: any) => EntityBuilder<T, CreateOptions>;
    MeshBuilderClass?: new (data: any) => EntityMeshBuilder;
    CollisionBuilderClass?: new (data: any) => EntityCollisionBuilder;
    entityType: symbol;
}
export declare function createEntity<T extends GameEntity<any>, CreateOptions extends GameEntityOptions>(params: CreateGameEntityOptions<T, CreateOptions>): Promise<T>;
