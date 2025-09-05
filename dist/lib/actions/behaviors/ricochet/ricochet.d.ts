import { Vector } from '@dimforge/rapier3d-compat';
import { MoveableEntity } from '../../capabilities/moveable';
import { CollisionContext, GameEntity } from '../../../entities/entity';
import { UpdateContext } from '../../../core/base-node-life-cycle';
import { CollisionSelector } from '../../../collision/utils';
export interface RicochetEvent extends Partial<UpdateContext<MoveableEntity>> {
    boundary?: 'top' | 'bottom' | 'left' | 'right';
    position: Vector;
    velocityBefore: Vector;
    velocityAfter: Vector;
}
export interface RicochetCollisionEvent extends CollisionContext<MoveableEntity, GameEntity<any>> {
    position: Vector;
}
export interface Ricochet2DInBoundsOptions {
    restitution?: number;
    minSpeed?: number;
    maxSpeed?: number;
    boundaries: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
    separation?: number;
}
export interface Ricochet2DCollisionOptions {
    restitution?: number;
    minSpeed?: number;
    maxSpeed?: number;
    separation?: number;
    collisionWith?: CollisionSelector;
    /**
     * Choose between simple axis inversion or angled (paddle-style) reflection.
     * Defaults to 'angled'.
     */
    reflectionMode?: 'simple' | 'angled';
}
export type Ricochet2DCallback = (event: RicochetEvent) => void;
export type Ricochet2DCollisionCallback = (event: RicochetCollisionEvent) => void;
export declare function clamp(value: number, min: number, max: number): number;
