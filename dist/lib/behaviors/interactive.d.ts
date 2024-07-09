import { GameEntity } from "../core";
import { EntityErrors } from "../core/errors";
declare const Interactive_base: import("ts-mixer/dist/types/types").Class<any[], GameEntity<unknown> & EntityErrors, (new (options: import("../interfaces/entity").GameEntityOptions<{
    collision?: import("../interfaces/entity").CollisionOption<unknown> | undefined;
}, unknown>) => GameEntity<unknown>) & typeof EntityErrors>;
export declare class Interactive extends Interactive_base {
}
export {};
