import { makeMoveable, EntityWithBody, MoveableEntity } from './moveable';
import { makeRotatable, RotatableEntity, RotatableEntityAPI } from './rotatable';

/**
 * Enhance an entity with both movement and rotation capabilities.
 */
export function makeTransformable<
	T extends RotatableEntity & EntityWithBody
>(entity: T): T & MoveableEntity & RotatableEntityAPI {
	const withMovement = makeMoveable(entity);
	const withRotation = makeRotatable(withMovement);
	return withRotation;
}


