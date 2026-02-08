import { Euler, Vector3, MathUtils, Quaternion } from 'three';
import { RigidBody } from '@dimforge/rapier3d-compat';
import type { TransformState } from './transform-store';
import { createTransformStore } from './transform-store';

export interface RotatableEntity {
	body: RigidBody | null;
	group: any;
	transformStore?: TransformState;
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
 * Rotate an entity around the Y axis.
 */
export function rotateY(entity: RotatableEntity, delta: number): void {
	if (!entity.transformStore) return;
	
	// Create delta rotation quaternion
	const halfAngle = delta / 2;
	const deltaW = Math.cos(halfAngle);
	const deltaY = Math.sin(halfAngle);
	
	// Get current rotation from store
	const q = entity.transformStore.rotation;
	
	// Multiply quaternions: q_new = q_current * q_delta
	// For Y-axis rotation: q_delta = (0, deltaY, 0, deltaW)
	const newW = q.w * deltaW - q.y * deltaY;
	const newX = q.x * deltaW + q.z * deltaY;
	const newY = q.y * deltaW + q.w * deltaY;
	const newZ = q.z * deltaW - q.x * deltaY;
	
	entity.transformStore.rotation.w = newW;
	entity.transformStore.rotation.x = newX;
	entity.transformStore.rotation.y = newY;
	entity.transformStore.rotation.z = newZ;
	entity.transformStore.dirty.rotation = true;
}

/**
 * Rotate an entity around the X axis.
 */
export function rotateX(entity: RotatableEntity, delta: number): void {
	if (!entity.transformStore) return;
	
	// Create delta rotation quaternion
	const halfAngle = delta / 2;
	const deltaW = Math.cos(halfAngle);
	const deltaX = Math.sin(halfAngle);
	
	// Get current rotation from store
	const q = entity.transformStore.rotation;
	
	// Multiply quaternions: q_new = q_current * q_delta
	// For X-axis rotation: q_delta = (deltaX, 0, 0, deltaW)
	const newW = q.w * deltaW - q.x * deltaX;
	const newX = q.x * deltaW + q.w * deltaX;
	const newY = q.y * deltaW + q.z * deltaX;
	const newZ = q.z * deltaW - q.y * deltaX;
	
	entity.transformStore.rotation.w = newW;
	entity.transformStore.rotation.x = newX;
	entity.transformStore.rotation.y = newY;
	entity.transformStore.rotation.z = newZ;
	entity.transformStore.dirty.rotation = true;
}

/**
 * Rotate an entity around the Z axis.
 */
export function rotateZ(entity: RotatableEntity, delta: number): void {
	if (!entity.transformStore) return;
	
	// Create delta rotation quaternion
	const halfAngle = delta / 2;
	const deltaW = Math.cos(halfAngle);
	const deltaZ = Math.sin(halfAngle);
	
	// Get current rotation from store
	const q = entity.transformStore.rotation;
	
	// Multiply quaternions: q_new = q_current * q_delta
	// For Z-axis rotation: q_delta = (0, 0, deltaZ, deltaW)
	const newW = q.w * deltaW - q.z * deltaZ;
	const newX = q.x * deltaW - q.y * deltaZ;
	const newY = q.y * deltaW + q.x * deltaZ;
	const newZ = q.z * deltaW + q.w * deltaZ;
	
	entity.transformStore.rotation.w = newW;
	entity.transformStore.rotation.x = newX;
	entity.transformStore.rotation.y = newY;
	entity.transformStore.rotation.z = newZ;
	entity.transformStore.dirty.rotation = true;
}

/**
 * Set rotation around Y axis.
 */
export function setRotationY(entity: RotatableEntity, y: number): void {
	if (!entity.transformStore) return;
	const halfAngle = y / 2;
	const w = Math.cos(halfAngle);
	const yComponent = Math.sin(halfAngle);
	entity.transformStore.rotation.w = w;
	entity.transformStore.rotation.x = 0;
	entity.transformStore.rotation.y = yComponent;
	entity.transformStore.rotation.z = 0;
	entity.transformStore.dirty.rotation = true;
}

/**
 * Set rotation around Y axis
 */
export function setRotationDegreesY(entity: RotatableEntity, y: number): void {
	if (!entity.body) return;
	setRotationY(entity, MathUtils.degToRad(y));
}

/**
 * Set rotation around X axis.
 */
export function setRotationX(entity: RotatableEntity, x: number): void {
	if (!entity.transformStore) return;
	const halfAngle = x / 2;
	const w = Math.cos(halfAngle);
	const xComponent = Math.sin(halfAngle);
	entity.transformStore.rotation.w = w;
	entity.transformStore.rotation.x = xComponent;
	entity.transformStore.rotation.y = 0;
	entity.transformStore.rotation.z = 0;
	entity.transformStore.dirty.rotation = true;
}

/**
 * Set rotation around X axis
 */
export function setRotationDegreesX(entity: RotatableEntity, x: number): void {
	if (!entity.body) return;
	setRotationX(entity, MathUtils.degToRad(x));
}

/**
 * Set rotation around Z axis.
 */
export function setRotationZ(entity: RotatableEntity, z: number): void {
	if (!entity.transformStore) return;
	const halfAngle = z / 2;
	const w = Math.cos(halfAngle);
	const zComponent = Math.sin(halfAngle);
	entity.transformStore.rotation.w = w;
	entity.transformStore.rotation.x = 0;
	entity.transformStore.rotation.y = 0;
	entity.transformStore.rotation.z = zComponent;
	entity.transformStore.dirty.rotation = true;
}

/**
 * Set rotation around Z axis
 */
export function setRotationDegreesZ(entity: RotatableEntity, z: number): void {
	if (!entity.body) return;
	setRotationZ(entity, MathUtils.degToRad(z));
}

/**
 * Set rotation for all axes.
 */
export function setRotation(entity: RotatableEntity, x: number, y: number, z: number): void {
	if (!entity.transformStore) return;
	const quat = new Quaternion().setFromEuler(new Euler(x, y, z));
	entity.transformStore.rotation.w = quat.w;
	entity.transformStore.rotation.x = quat.x;
	entity.transformStore.rotation.y = quat.y;
	entity.transformStore.rotation.z = quat.z;
	entity.transformStore.dirty.rotation = true;
}

/**
 * Set rotation for all axes
 */
export function setRotationDegrees(entity: RotatableEntity, x: number, y: number, z: number): void {
	if (!entity.body) return;
	setRotation(entity, MathUtils.degToRad(x), MathUtils.degToRad(y), MathUtils.degToRad(z));
}

/**
 * Get current rotation
 */
export function getRotation(entity: RotatableEntity): any {
	if (!entity.body) return null;
	return entity.body.rotation();
}

/**
 * Rotatable entity API with bound methods
 */
export interface RotatableEntityAPI extends RotatableEntity {
	rotateInDirection(moveVector: Vector3): void;
	rotateYEuler(amount: number): void;
	rotateEuler(rotation: Vector3): void;
	rotateY(delta: number): void;
	rotateX(delta: number): void;
	rotateZ(delta: number): void;
	setRotationY(y: number): void;
	setRotationX(x: number): void;
	setRotationZ(z: number): void;
	setRotationDegrees(x: number, y: number, z: number): void;
	setRotationDegreesY(y: number): void;
	setRotationDegreesX(x: number): void;
	setRotationDegreesZ(z: number): void;
	setRotation(x: number, y: number, z: number): void;
	getRotation(): any;
}

/**
 * Enhance an entity instance with rotatable methods.
 * Automatically creates a transform store if one doesn't exist.
 */
export function makeRotatable<T extends RotatableEntity>(entity: T): T & RotatableEntityAPI {
	const rotatableEntity = entity as T & RotatableEntityAPI;

	// Create transform store if it doesn't exist
	if (!rotatableEntity.transformStore) {
		rotatableEntity.transformStore = createTransformStore();
	}

	rotatableEntity.rotateInDirection = (moveVector: Vector3) => rotateInDirection(entity, moveVector);
	rotatableEntity.rotateYEuler = (amount: number) => rotateYEuler(entity, amount);
	rotatableEntity.rotateEuler = (rotation: Vector3) => rotateEuler(entity, rotation);
	rotatableEntity.rotateX = (delta: number) => rotateX(entity, delta);
	rotatableEntity.rotateY = (delta: number) => rotateY(entity, delta);
	rotatableEntity.rotateZ = (delta: number) => rotateZ(entity, delta);
	rotatableEntity.setRotationY = (y: number) => setRotationY(entity, y);
	rotatableEntity.setRotationX = (x: number) => setRotationX(entity, x);
	rotatableEntity.setRotationZ = (z: number) => setRotationZ(entity, z);
	rotatableEntity.setRotationDegreesY = (y: number) => setRotationDegreesY(entity, y);
	rotatableEntity.setRotationDegreesX = (x: number) => setRotationDegreesX(entity, x);
	rotatableEntity.setRotationDegreesZ = (z: number) => setRotationDegreesZ(entity, z);
	rotatableEntity.setRotationDegrees = (x: number, y: number, z: number) => setRotationDegrees(entity, x, y, z);
	rotatableEntity.setRotation = (x: number, y: number, z: number) => setRotation(entity, x, y, z);
	rotatableEntity.getRotation = () => getRotation(entity);

	return rotatableEntity;
}