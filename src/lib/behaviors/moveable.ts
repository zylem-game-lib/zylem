import { Vector3 } from 'three';
import { RigidBody, Vector } from '@dimforge/rapier3d-compat';

export interface MoveableEntity {
	body: RigidBody | null;
}

/**
 * Move an entity along the X axis
 */
export function moveX(entity: MoveableEntity, delta: number): void {
	const vec = new Vector3(delta, 0, 0);
	move(entity, vec);
}

/**
 * Move an entity along the Y axis
 */
export function moveY(entity: MoveableEntity, delta: number): void {
	const vec = new Vector3(0, delta, 0);
	move(entity, vec);
}

/**
 * Move an entity along the Z axis
 */
export function moveZ(entity: MoveableEntity, delta: number): void {
	const vec = new Vector3(0, 0, delta);
	move(entity, vec);
}

/**
 * Move an entity along the X and Y axis
 */
export function moveXY(entity: MoveableEntity, deltaX: number, deltaY: number): void {
	const vec = new Vector3(deltaX, deltaY, 0);
	move(entity, vec);
}

/**
 * Move an entity along the X and Z axis
 */
export function moveXZ(entity: MoveableEntity, deltaX: number, deltaZ: number): void {
	const vec = new Vector3(deltaX, 0, deltaZ);
	move(entity, vec);
}

/**
 * Move entity based on a vector
 */
export function move(entity: MoveableEntity, vector: Vector3): void {
	if (!entity.body) return;
	entity.body.setLinvel(vector, true);
}

/**
 * Reset entity velocity
 */
export function resetVelocity(entity: MoveableEntity): void {
	if (!entity.body) return;
	entity.body.setLinearDamping(5);
}

/**
 * Move entity forward in 2D space
 */
export function moveForwardXY(entity: MoveableEntity, delta: number, rotation2DAngle: number): void {
	const deltaX = Math.sin(-rotation2DAngle) * delta;
	const deltaY = Math.cos(-rotation2DAngle) * delta;
	moveXY(entity, deltaX, deltaY);
}

/**
 * Get entity position
 */
export function getPosition(entity: MoveableEntity): Vector | null {
	if (!entity.body) return null;
	return entity.body.translation();
}

/**
 * Get entity velocity
 */
export function getVelocity(entity: MoveableEntity): Vector | null {
	if (!entity.body) return null;
	return entity.body.linvel();
}

/**
 * Set entity position
 */
export function setPosition(entity: MoveableEntity, x: number, y: number, z: number): void {
	if (!entity.body) return;
	entity.body.setTranslation({ x, y, z }, true);
}

/**
 * Set entity X position
 */
export function setPositionX(entity: MoveableEntity, x: number): void {
	if (!entity.body) return;
	const { y, z } = entity.body.translation();
	entity.body.setTranslation({ x, y, z }, true);
}

/**
 * Set entity Y position
 */
export function setPositionY(entity: MoveableEntity, y: number): void {
	if (!entity.body) return;
	const { x, z } = entity.body.translation();
	entity.body.setTranslation({ x, y, z }, true);
}

/**
 * Set entity Z position
 */
export function setPositionZ(entity: MoveableEntity, z: number): void {
	if (!entity.body) return;
	const { x, y } = entity.body.translation();
	entity.body.setTranslation({ x, y, z }, true);
}

/**
 * Wrap entity around 2D bounds
 */
export function wrapAroundXY(entity: MoveableEntity, boundsX: number, boundsY: number): void {
	const position = getPosition(entity);
	if (!position) return;

	const { x, y } = position;
	const newX = x > boundsX ? -boundsX : (x < -boundsX ? boundsX : x);
	const newY = y > boundsY ? -boundsY : (y < -boundsY ? boundsY : y);

	if (newX !== x || newY !== y) {
		setPosition(entity, newX, newY, 0);
	}
}