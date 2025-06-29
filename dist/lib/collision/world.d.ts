import { Vector3 } from 'three';
import RAPIER, { World } from '@dimforge/rapier3d-compat';
import { Entity } from '../interfaces/entity';
import { UpdateContext } from '../core/base-node-life-cycle';
import { GameEntity } from '../core';
export declare class ZylemWorld implements Entity<ZylemWorld> {
    type: string;
    world: World;
    collisionMap: Map<string, GameEntity<any>>;
    collisionBehaviorMap: Map<string, GameEntity<any>>;
    _removalMap: Map<string, GameEntity<any>>;
    static loadPhysics(gravity: Vector3): Promise<RAPIER.World>;
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
