import { ZylemWorld } from "../world/ZylemWorld";
import { ZylemScene } from "../scene/ZylemScene";
import { Entity, EntityBlueprint } from "../interfaces/Entity";
import { UpdateOptions } from "../interfaces/Update";
import { Conditions, StageOptions } from "../interfaces/Game";
export declare class ZylemStage implements Entity<ZylemStage> {
    _type: string;
    world: ZylemWorld | null;
    scene: ZylemScene | null;
    conditions: Conditions<any>[];
    children: Array<Entity<any>>;
    blueprints: Array<EntityBlueprint<any>>;
    constructor();
    buildStage(options: StageOptions, id: string): Promise<void>;
    setup(): Promise<void>;
    spawnEntity(blueprint: EntityBlueprint<any>, options: any): void;
    destroy(): void;
    update(delta: number, options: UpdateOptions<Entity<any>>): void;
    logMissingEntities(): void;
    resize(width: number, height: number): void;
}
