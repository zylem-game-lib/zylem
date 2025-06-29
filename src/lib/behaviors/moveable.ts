import { Vector3 } from 'three';
import { RigidBody, Vector } from '@dimforge/rapier3d-compat';

export interface EntityWithBody {
	body: RigidBody | null;
}

/**
 * Move an entity along the X axis
 */
export function moveX(entity: EntityWithBody, delta: number): void {
	const vec = new Vector3(delta, 0, 0);
	move(entity, vec);
}

/**
 * Move an entity along the Y axis
 */
export function moveY(entity: EntityWithBody, delta: number): void {
	const vec = new Vector3(0, delta, 0);
	move(entity, vec);
}

/**
 * Move an entity along the Z axis
 */
export function moveZ(entity: EntityWithBody, delta: number): void {
	const vec = new Vector3(0, 0, delta);
	move(entity, vec);
}

/**
 * Move an entity along the X and Y axis
 */
export function moveXY(entity: EntityWithBody, deltaX: number, deltaY: number): void {
	const vec = new Vector3(deltaX, deltaY, 0);
	move(entity, vec);
}

/**
 * Move an entity along the X and Z axis
 */
export function moveXZ(entity: EntityWithBody, deltaX: number, deltaZ: number): void {
	const vec = new Vector3(deltaX, 0, deltaZ);
	move(entity, vec);
}

/**
 * Move entity based on a vector
 */
export function move(entity: EntityWithBody, vector: Vector3): void {
	if (!entity.body) return;
	entity.body.setLinvel(vector, true);
}

/**
 * Reset entity velocity
 */
export function resetVelocity(entity: EntityWithBody): void {
	if (!entity.body) return;
	entity.body.setLinearDamping(5);
}

/**
 * Move entity forward in 2D space
 */
export function moveForwardXY(entity: EntityWithBody, delta: number, rotation2DAngle: number): void {
	const deltaX = Math.sin(-rotation2DAngle) * delta;
	const deltaY = Math.cos(-rotation2DAngle) * delta;
	moveXY(entity, deltaX, deltaY);
}

/**
 * Get entity position
 */
export function getPosition(entity: EntityWithBody): Vector | null {
	if (!entity.body) return null;
	return entity.body.translation();
}

/**
 * Get entity velocity
 */
export function getVelocity(entity: EntityWithBody): Vector | null {
	if (!entity.body) return null;
	return entity.body.linvel();
}

/**
 * Set entity position
 */
export function setPosition(entity: EntityWithBody, x: number, y: number, z: number): void {
	if (!entity.body) return;
	entity.body.setTranslation({ x, y, z }, true);
}

/**
 * Set entity X position
 */
export function setPositionX(entity: EntityWithBody, x: number): void {
	if (!entity.body) return;
	const { y, z } = entity.body.translation();
	entity.body.setTranslation({ x, y, z }, true);
}

/**
 * Set entity Y position
 */
export function setPositionY(entity: EntityWithBody, y: number): void {
	if (!entity.body) return;
	const { x, z } = entity.body.translation();
	entity.body.setTranslation({ x, y, z }, true);
}

/**
 * Set entity Z position
 */
export function setPositionZ(entity: EntityWithBody, z: number): void {
	if (!entity.body) return;
	const { x, y } = entity.body.translation();
	entity.body.setTranslation({ x, y, z }, true);
}

/**
 * Wrap entity around 2D bounds
 */
export function wrapAroundXY(entity: EntityWithBody, boundsX: number, boundsY: number): void {
	const position = getPosition(entity);
	if (!position) return;

	const { x, y } = position;
	const newX = x > boundsX ? -boundsX : (x < -boundsX ? boundsX : x);
	const newY = y > boundsY ? -boundsY : (y < -boundsY ? boundsY : y);

	if (newX !== x || newY !== y) {
		setPosition(entity, newX, newY, 0);
	}
}

/**
 * Wrap entity around 3D bounds
 */
export function wrapAround3D(entity: EntityWithBody, boundsX: number, boundsY: number, boundsZ: number): void {
	const position = getPosition(entity);
	if (!position) return;

	const { x, y, z } = position;
	const newX = x > boundsX ? -boundsX : (x < -boundsX ? boundsX : x);
	const newY = y > boundsY ? -boundsY : (y < -boundsY ? boundsY : y);
	const newZ = z > boundsZ ? -boundsZ : (z < -boundsZ ? boundsZ : z);

	if (newX !== x || newY !== y || newZ !== z) {
		setPosition(entity, newX, newY, newZ);
	}
}

/**
 * Enhanced moveable entity with bound methods
 */
export interface MoveableEntity extends EntityWithBody {
	moveX(delta: number): void;
	moveY(delta: number): void;
	moveZ(delta: number): void;
	moveXY(deltaX: number, deltaY: number): void;
	moveXZ(deltaX: number, deltaZ: number): void;
	move(vector: Vector3): void;
	resetVelocity(): void;
	moveForwardXY(delta: number, rotation2DAngle: number): void;
	getPosition(): Vector | null;
	getVelocity(): Vector | null;
	setPosition(x: number, y: number, z: number): void;
	setPositionX(x: number): void;
	setPositionY(y: number): void;
	setPositionZ(z: number): void;
	wrapAroundXY(boundsX: number, boundsY: number): void;
}

/**
 * Enhance an entity with movement methods
 */
export function makeMoveable<T extends EntityWithBody>(entity: T): T & MoveableEntity {
	const moveable = entity as T & MoveableEntity;

	moveable.moveX = (delta: number) => moveX(entity, delta);
	moveable.moveY = (delta: number) => moveY(entity, delta);
	moveable.moveZ = (delta: number) => moveZ(entity, delta);
	moveable.moveXY = (deltaX: number, deltaY: number) => moveXY(entity, deltaX, deltaY);
	moveable.moveXZ = (deltaX: number, deltaZ: number) => moveXZ(entity, deltaX, deltaZ);
	moveable.move = (vector: Vector3) => move(entity, vector);
	moveable.resetVelocity = () => resetVelocity(entity);
	moveable.moveForwardXY = (delta: number, rotation2DAngle: number) => moveForwardXY(entity, delta, rotation2DAngle);
	moveable.getPosition = () => getPosition(entity);
	moveable.getVelocity = () => getVelocity(entity);
	moveable.setPosition = (x: number, y: number, z: number) => setPosition(entity, x, y, z);
	moveable.setPositionX = (x: number) => setPositionX(entity, x);
	moveable.setPositionY = (y: number) => setPositionY(entity, y);
	moveable.setPositionZ = (z: number) => setPositionZ(entity, z);
	moveable.wrapAroundXY = (boundsX: number, boundsY: number) => wrapAroundXY(entity, boundsX, boundsY);

	return moveable;
}
