import { UpdateContext } from "../../core/base-node-life-cycle";
import { MoveableEntity } from "../../behaviors/moveable";
import { Vector } from "@dimforge/rapier3d-compat";
export interface RicochetEvent {
    me: MoveableEntity;
    boundary: 'top' | 'bottom' | 'left' | 'right' | 'front' | 'back';
    position: Vector;
    velocityBefore: Vector;
    velocityAfter: Vector;
    updateContext: UpdateContext<MoveableEntity>;
}
export interface Ricochet2DOptions {
    restitution: number;
    maxSpeed: number;
    minSpeed: number;
    boundaries: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
    onRicochet?: (event: RicochetEvent) => void;
}
export interface Ricochet3DOptions extends Ricochet2DOptions {
    boundaries: {
        top: number;
        bottom: number;
        left: number;
        right: number;
        front: number;
        back: number;
    };
}
/**
 * Creates a 2D ricochet effect that bounces entities off boundaries
 * Handles bouncing off top, bottom, left, and right boundaries
 *
 * @param options Configuration options for the ricochet physics
 * @param options.restitution Energy retention factor (0 = no bounce, 1 = perfect bounce)
 * @param options.maxSpeed Maximum velocity the entity can achieve
 * @param options.minSpeed Minimum velocity to maintain momentum
 * @param options.boundaries 2D boundaries (top, bottom, left, right)
 * @param options.onRicochet Optional callback function called when ricochet occurs
 */
export declare function ricochet2d(options?: Partial<Ricochet2DOptions>): (updateContext: UpdateContext<MoveableEntity>) => void;
/**
 * Creates a 3D ricochet effect that bounces entities off boundaries
 * Handles bouncing off all 6 boundaries in 3D space
 *
 * @param options Configuration options for the ricochet physics
 * @param options.restitution Energy retention factor (0 = no bounce, 1 = perfect bounce)
 * @param options.maxSpeed Maximum velocity the entity can achieve
 * @param options.minSpeed Minimum velocity to maintain momentum
 * @param options.boundaries 3D boundaries (top, bottom, left, right, front, back)
 * @param options.onRicochet Optional callback function called when ricochet occurs
 */
export declare function ricochet3d(options?: Partial<Ricochet3DOptions>): (updateContext: UpdateContext<MoveableEntity>) => void;
/**
 * Simplified 2D ricochet without speed limits
 */
export declare function basicRicochet2d(updateContext: UpdateContext<MoveableEntity>, options: Partial<Ricochet2DOptions>): void;
