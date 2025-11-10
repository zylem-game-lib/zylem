import { CollisionContext, GameEntity } from '../../../entities/entity';
import { MoveableEntity } from '../../capabilities/moveable';
import { Ricochet2DCollisionOptions, Ricochet2DCollisionCallback } from './ricochet';
/**
 * Behavior for ricocheting an entity off other objects in 2D
 */
export declare function ricochet2DCollision(options?: Partial<Ricochet2DCollisionOptions>, callback?: Ricochet2DCollisionCallback): {
    type: 'collision';
    handler: (ctx: CollisionContext<MoveableEntity, GameEntity<any>>) => void;
};
//# sourceMappingURL=ricochet-2d-collision.d.ts.map