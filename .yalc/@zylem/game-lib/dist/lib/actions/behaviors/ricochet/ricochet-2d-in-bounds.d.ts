import { UpdateContext } from '../../../core/base-node-life-cycle';
import { MoveableEntity } from '../../capabilities/moveable';
import { Ricochet2DInBoundsOptions, Ricochet2DCallback } from './ricochet';
import { BehaviorCallbackType } from '../../../entities/entity';
/**
 * Behavior for ricocheting an entity within fixed 2D boundaries
 */
export declare function ricochet2DInBounds(options?: Partial<Ricochet2DInBoundsOptions>, callback?: Ricochet2DCallback): {
    type: BehaviorCallbackType;
    handler: (ctx: UpdateContext<MoveableEntity>) => void;
};
