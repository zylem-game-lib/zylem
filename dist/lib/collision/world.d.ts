import { Vector3 } from 'three';
import RAPIER, { World } from '@dimforge/rapier3d-compat';
import { Entity, StageEntity } from '../interfaces/entity';
import { UpdateContext } from '../core/base-node-life-cycle';
export declare class ZylemWorld implements Entity<ZylemWorld> {
    type: string;
    world: World;
    collisionMap: Map<string, Entity<any>>;
    collisionBehaviorMap: Map<string, Entity<any>>;
    _removalMap: Map<string, Entity<any>>;
    static loadPhysics(gravity: Vector3): Promise<RAPIER.World>;
    constructor(world: World);
    addEntity(entity: any): void;
    setForRemoval(entity: any): void;
    destroyEntity(entity: StageEntity): void;
    setup(): void;
    update(params: UpdateContext<any>): void;
    updatePostCollisionBehaviors(delta: number): void;
    updateColliders(delta: number): void;
    destroy(): void;
}
