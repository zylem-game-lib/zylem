import { UpdateContext } from "../../core/base-node-life-cycle";
import { MoveableEntity } from "../../behaviors/moveable";
import { Vector } from "@dimforge/rapier3d-compat";
export interface BoundaryEvent {
    me: MoveableEntity;
    boundary: 'top' | 'bottom' | 'left' | 'right';
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
 * @returns A function that can be used to check if the entity has hit a boundary
 */
export declare function boundary(options?: Partial<BoundaryOptions>): (updateContext: UpdateContext<MoveableEntity>) => void;
