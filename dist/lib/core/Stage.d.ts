import { ZylemWorld } from "../collision/World";
import { ZylemScene } from "../rendering/Scene";
import { Entity, EntityBlueprint } from "../interfaces/entity";
import { UpdateOptions } from "../interfaces/Update";
import { Conditions, StageBlueprint } from "../interfaces/game";
export declare class ZylemStage implements Entity<ZylemStage> {
    _type: string;
    _update: ((delta: number, options: any) => void) | null;
    world: ZylemWorld | null;
    scene: ZylemScene | null;
    conditions: Conditions<any>[];
    children: Array<Entity<any>>;
    _childrenMap: Map<string, Entity<any>>;
    blueprints: Array<EntityBlueprint<any>>;
    constructor();
    buildStage(options: StageBlueprint, id: string): Promise<void>;
    setup(): Promise<void>;
    spawnEntity(blueprint: EntityBlueprint<any>, options: any): void;
    destroy(): void;
    update(delta: number, options: UpdateOptions<Entity<any>>): void;
    getEntityByName(name: string): Entity<any> | null;
    logMissingEntities(): void;
    resize(width: number, height: number): void;
}
