import { Euler, Vector3 } from 'three';
import { RigidBody } from '@dimforge/rapier3d-compat';

export interface RotatableEntity {
	body: RigidBody | null;
	group: any;
}

/**
 * Rotate an entity in the direction of a movement vector
 */
export function rotateInDirection(entity: RotatableEntity, moveVector: Vector3): void {
	if (!entity.body) return;
	const rotate = Math.atan2(-moveVector.x, moveVector.z);
	rotateYEuler(entity, rotate);
}

/**
 * Rotate an entity around the Y axis using Euler angles
 */
export function rotateYEuler(entity: RotatableEntity, amount: number): void {
	rotateEuler(entity, new Vector3(0, -amount, 0));
}

/**
 * Rotate an entity using Euler angles
 */
export function rotateEuler(entity: RotatableEntity, rotation: Vector3): void {
	if (!entity.group) return;
	const euler = new Euler(rotation.x, rotation.y, rotation.z);
	entity.group.setRotationFromEuler(euler);
}

/**
 * Rotate an entity around the Y axis
 */
export function rotateY(entity: RotatableEntity, delta: number): void {
	setRotationY(entity, delta);
}

/**
 * Rotate an entity around the Z axis
 */
export function rotateZ(entity: RotatableEntity, delta: number): void {
	setRotationZ(entity, delta);
}

/**
 * Set rotation around Y axis
 */
export function setRotationY(entity: RotatableEntity, y: number): void {
	if (!entity.body) return;
	entity.body.setRotation({ w: 1, x: 0, y: y, z: 0 }, true);
}

/**
 * Set rotation around X axis
 */
export function setRotationX(entity: RotatableEntity, x: number): void {
	if (!entity.body) return;
	entity.body.setRotation({ w: 1, x: x, y: 0, z: 0 }, true);
}

/**
 * Set rotation around Z axis
 */
export function setRotationZ(entity: RotatableEntity, z: number): void {
	if (!entity.body) return;
	const halfAngle = z / 2;
	const w = Math.cos(halfAngle);
	const zComponent = Math.sin(halfAngle);
	entity.body.setRotation({ w: w, x: 0, y: 0, z: zComponent }, true);
}

/**
 * Set rotation for all axes
 */
export function setRotation(entity: RotatableEntity, x: number, y: number, z: number): void {
	if (!entity.body) return;
	entity.body.setRotation({ w: 1, x, y, z }, true);
}

/**
 * Get current rotation
 */
export function getRotation(entity: RotatableEntity): any {
	if (!entity.body) return null;
	return entity.body.rotation();
}