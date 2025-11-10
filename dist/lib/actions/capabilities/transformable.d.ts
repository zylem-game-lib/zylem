import { EntityWithBody, MoveableEntity } from './moveable';
import { RotatableEntity, RotatableEntityAPI } from './rotatable';
/**
 * Enhance an entity with both movement and rotation capabilities.
 */
export declare function makeTransformable<T extends RotatableEntity & EntityWithBody>(entity: T): T & MoveableEntity & RotatableEntityAPI;
//# sourceMappingURL=transformable.d.ts.map