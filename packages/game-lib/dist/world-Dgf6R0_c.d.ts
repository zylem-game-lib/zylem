import { Vector3 } from 'three';
import RAPIER__default, { World } from '@dimforge/rapier3d-compat';
import { E as Entity } from './entity-Bq_eNEDI.js';
import { G as GameEntity, U as UpdateContext } from './entity-COvRtFNG.js';

/**
 * Interface for entities that handle collision events.
 */
interface CollisionHandlerDelegate {
    handlePostCollision(params: any): boolean;
    handleIntersectionEvent(params: any): void;
}
declare class ZylemWorld implements Entity<ZylemWorld> {
    type: string;
    world: World;
    collisionMap: Map<string, GameEntity<any>>;
    collisionBehaviorMap: Map<string, GameEntity<any>>;
    _removalMap: Map<string, GameEntity<any>>;
    static loadPhysics(gravity: Vector3): Promise<RAPIER__default.World>;
    constructor(world: World);
    addEntity(entity: any): void;
    setForRemoval(entity: any): void;
    destroyEntity(entity: GameEntity<any>): void;
    setup(): void;
    update(params: UpdateContext<any>): void;
    updatePostCollisionBehaviors(delta: number): void;
    updateColliders(delta: number): void;
    destroy(): void;
}

export { type CollisionHandlerDelegate as C, ZylemWorld as Z };
