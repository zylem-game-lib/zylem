import { GameEntity } from "../core";
import { EntityErrors } from "../core/errors";
import { OptionalVector } from "../interfaces/entity";
import { Moveable } from "./moveable";
declare const EntitySpawner_base: import("ts-mixer/dist/types/types").Class<any[], GameEntity<unknown> & EntityErrors & Moveable, (new (options: import("../interfaces/entity").GameEntityOptions<{
    collision?: import("../interfaces/entity").CollisionOption<unknown> | undefined;
}, unknown>) => GameEntity<unknown>) & typeof EntityErrors & typeof Moveable>;
export declare class EntitySpawner extends EntitySpawner_base {
    spawn(T: any, options: any): void;
    spawnRelative(T: any, options: any, offset: OptionalVector): void;
    spawnRelative2d(T: any, options: any, offset: OptionalVector): void;
}
export {};
