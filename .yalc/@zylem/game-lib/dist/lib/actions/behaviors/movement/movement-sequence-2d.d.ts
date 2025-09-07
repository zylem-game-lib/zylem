import { UpdateContext } from "../../../core/base-node-life-cycle";
import { MoveableEntity } from "../../capabilities/moveable";
import { BehaviorCallbackType } from "../../../entities/entity";
export interface MovementSequence2DStep {
    name: string;
    moveX?: number;
    moveY?: number;
    timeInSeconds: number;
}
export interface MovementSequence2DOptions {
    sequence: MovementSequence2DStep[];
    loop?: boolean;
}
export type MovementSequence2DCallback = (current: MovementSequence2DStep, index: number, ctx: UpdateContext<MoveableEntity>) => void;
/**
 * Behavior that sequences 2D movements over time.
 * Each step sets linear velocity via `moveXY` for a duration, then advances.
 * Defaults to looping when the end is reached.
 */
export declare function movementSequence2D(opts: MovementSequence2DOptions, onStep?: MovementSequence2DCallback): {
    type: BehaviorCallbackType;
    handler: (ctx: UpdateContext<MoveableEntity>) => void;
};
