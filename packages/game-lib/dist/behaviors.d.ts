import { G as GameEntity, m as CollisionContext, U as UpdateContext, B as BehaviorCallbackType } from './entity-ByNgyo1y.js';
import { M as MoveableEntity } from './moveable-B_vyA6cw.js';
import { Vector } from '@dimforge/rapier3d-compat';
import 'three';
import 'bitecs';

/**
 * A branded bitmask representing a set of collision types.
 * Construct with {@link buildCollisionMask}.
 */
type CollisionMask = number & {
    readonly __brand: "CollisionMask";
};

type NameSelector = string | string[] | RegExp;
type CollisionSelector = {
    name: NameSelector;
} | {
    mask: CollisionMask | RegExp;
} | {
    test: (other: GameEntity<any>) => boolean;
};

/**
 * Behavior for ricocheting an entity off other objects in 2D
 */
declare function ricochet2DCollision(options?: Partial<Ricochet2DCollisionOptions>, callback?: Ricochet2DCollisionCallback): {
    type: 'collision';
    handler: (ctx: CollisionContext<MoveableEntity, GameEntity<any>>) => void;
};

interface RicochetEvent extends Partial<UpdateContext<MoveableEntity>> {
    boundary?: 'top' | 'bottom' | 'left' | 'right';
    position: Vector;
    velocityBefore: Vector;
    velocityAfter: Vector;
}
interface RicochetCollisionEvent extends CollisionContext<MoveableEntity, GameEntity<any>> {
    position: Vector;
}
interface Ricochet2DInBoundsOptions {
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
interface Ricochet2DCollisionOptions {
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
type Ricochet2DCallback = (event: RicochetEvent) => void;
type Ricochet2DCollisionCallback = (event: RicochetCollisionEvent) => void;

/**
 * Behavior for ricocheting an entity within fixed 2D boundaries
 */
declare function ricochet2DInBounds(options?: Partial<Ricochet2DInBoundsOptions>, callback?: Ricochet2DCallback): {
    type: BehaviorCallbackType;
    handler: (ctx: UpdateContext<MoveableEntity>) => void;
};

interface BoundaryEvent {
    me: MoveableEntity;
    boundary: BoundaryHits;
    position: Vector;
    updateContext: UpdateContext<MoveableEntity>;
}
interface BoundaryOptions {
    boundaries: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
    onBoundary?: (event: BoundaryEvent) => void;
    stopMovement?: boolean;
}
/**
 * Checks if the entity has hit a boundary and stops its movement if it has
 *
 * @param options Configuration options for the boundary behavior
 * @param options.boundaries The boundaries of the stage
 * @param options.onBoundary A callback function that is called when the entity hits a boundary
 * @param options.stopMovement Whether to stop the entity's movement when it hits a boundary
 * @returns A behavior callback with type 'update' and a handler function
 */
declare function boundary2d(options?: Partial<BoundaryOptions>): {
    type: BehaviorCallbackType;
    handler: (ctx: UpdateContext<MoveableEntity>) => void;
};
type BoundaryHit = 'top' | 'bottom' | 'left' | 'right';
type BoundaryHits = Record<BoundaryHit, boolean>;

export { boundary2d, ricochet2DCollision, ricochet2DInBounds };
