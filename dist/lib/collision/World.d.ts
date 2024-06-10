import { Vector3 } from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { Entity } from '../interfaces/entity';
import { GameEntity } from '../core/game-entity';
import { EntityParameters } from '../core/entity';
export declare class ZylemWorld implements Entity<ZylemWorld> {
    type: string;
    world: RAPIER.World;
    collisionMap: Map<number, Entity<any>>;
    collisionBehaviorMap: Map<number, Entity<any>>;
    _removalMap: Map<number, Entity<any>>;
    static loadPhysics(gravity: Vector3): Promise<RAPIER.World>;
    constructor(world: RAPIER.World);
    addEntity(entity: any): void;
    setForRemoval(entity: any): void;
    destroyEntity(entity: GameEntity<any>): void;
    setup(): void;
    update(params: EntityParameters<any>): void;
    updatePostCollisionBehaviors(delta: number): void;
    updateColliders(delta: number): void;
    destroy(): void;
}
