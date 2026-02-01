import { makeMoveable, EntityWithBody, MoveableEntity } from './moveable';
import { makeRotatable, RotatableEntity, RotatableEntityAPI } from './rotatable';
import { createTransformStore } from './transform-store';

/**
 * Enhance an entity with both movement and rotation capabilities.
 * Automatically creates a transform store for batched physics updates.
 */
export function makeTransformable<
	T extends RotatableEntity & EntityWithBody
>(entity: T): T & MoveableEntity & RotatableEntityAPI {
	// Create and attach transform store for batched updates
	(entity as any).transformStore = createTransformStore();
	
	const withMovement = makeMoveable(entity);
	const withRotation = makeRotatable(withMovement);
	return withRotation;
}

