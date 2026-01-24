import { GameEntity } from '../entities/entity';
import { BehaviorDescriptor } from './behavior-descriptor';

/**
 * Type-safe helper to apply a behavior to an entity and return the entity cast to the behavior's interface.
 * 
 * @param entity The entity to apply the behavior to
 * @param descriptor The behavior descriptor
 * @param options Behavior options
 * @returns The entity, cast to E & I (where I is the behavior's interface)
 */
export function useBehavior<
    E extends GameEntity<any>,
    O extends Record<string, any>,
    H extends Record<string, any>,
    I // Entity Interface
>(
    entity: E,
    descriptor: BehaviorDescriptor<O, H, I>,
    options?: Partial<O>
): E & I {
    entity.use(descriptor, options);
    return entity as unknown as E & I;
}
