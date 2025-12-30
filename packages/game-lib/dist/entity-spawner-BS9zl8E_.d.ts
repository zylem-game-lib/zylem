import { Vector2 } from 'three';
import { G as GameEntity } from './entity-ByNgyo1y.js';
import { a as Stage } from './stage-BdyqquDY.js';

interface EntitySpawner {
    spawn: (stage: Stage, x: number, y: number) => Promise<GameEntity<any>>;
    spawnRelative: (source: any, stage: Stage, offset?: Vector2) => Promise<any | void>;
}
declare function entitySpawner(factory: (x: number, y: number) => Promise<any> | GameEntity<any>): EntitySpawner;

export { entitySpawner as e };
