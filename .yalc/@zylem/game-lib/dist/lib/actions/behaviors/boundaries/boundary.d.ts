import { UpdateContext } from "../../../core/base-node-life-cycle";
import { MoveableEntity } from "../../capabilities/moveable";
import { Vector } from "@dimforge/rapier3d-compat";
import { BehaviorCallbackType } from "../../../entities/entity";
export interface BoundaryEvent {
    me: MoveableEntity;
    boundary: BoundaryHits;
    position: Vector;
    updateContext: UpdateContext<MoveableEntity>;
}
export interface BoundaryOptions {
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
export declare function boundary(options?: Partial<BoundaryOptions>): {
    type: BehaviorCallbackType;
    handler: (ctx: UpdateContext<MoveableEntity>) => void;
};
type BoundaryHit = 'top' | 'bottom' | 'left' | 'right';
type BoundaryHits = Record<BoundaryHit, boolean>;
export {};
