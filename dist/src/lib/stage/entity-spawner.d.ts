import { Vector2 } from "three";
import { GameEntity } from "../entities";
import { Stage } from "./stage";
export interface EntitySpawner {
    spawn: (stage: Stage, x: number, y: number) => Promise<GameEntity<any>>;
    spawnRelative: (source: any, stage: Stage, offset?: Vector2) => Promise<any | void>;
}
export declare function entitySpawner(factory: (x: number, y: number) => Promise<any> | GameEntity<any>): EntitySpawner;
//# sourceMappingURL=entity-spawner.d.ts.map