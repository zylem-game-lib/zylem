import { Euler, Vector3, MathUtils } from 'three';
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
 * Set rotation around Y axis
 */
export function setRotationDegreesY(entity: RotatableEntity, y: number): void {
	if (!entity.body) return;
	setRotationY(entity, MathUtils.degToRad(y));
}

/**
 * Set rotation around X axis
 */
export function setRotationX(entity: RotatableEntity, x: number): void {
	if (!entity.body) return;
	entity.body.setRotation({ w: 1, x: x, y: 0, z: 0 }, true);
}

/**
 * Set rotation around X axis
 */
export function setRotationDegreesX(entity: RotatableEntity, x: number): void {
	if (!entity.body) return;
	setRotationX(entity, MathUtils.degToRad(x));
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
 * Set rotation around Z axis
 */
export function setRotationDegreesZ(entity: RotatableEntity, z: number): void {
	if (!entity.body) return;
	setRotationZ(entity, MathUtils.degToRad(z));
}

/**
 * Set rotation for all axes
 */
export function setRotation(entity: RotatableEntity, x: number, y: number, z: number): void {
	if (!entity.body) return;
	entity.body.setRotation({ w: 1, x, y, z }, true);
}

/**
 * Set rotation for all axes
 */
export function setRotationDegrees(entity: RotatableEntity, x: number, y: number, z: number): void {
	if (!entity.body) return;
	entity.body.setRotation(
		{
			w: 1,
			x: MathUtils.degToRad(x),
			y: MathUtils.degToRad(y),
			z: MathUtils.degToRad(z)
		},
		true
	);
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
 * Class decorator to enhance an entity with rotatable methods
 */
export function rotatable<T extends { new(...args: any[]): RotatableEntity }>(constructor: T) {
	return class extends constructor implements RotatableEntityAPI {
		rotateInDirection(moveVector: Vector3): void {
			rotateInDirection(this, moveVector);
		}
		rotateYEuler(amount: number): void {
			rotateYEuler(this, amount);
		}
		rotateEuler(rotation: Vector3): void {
			rotateEuler(this, rotation);
		}
		rotateY(delta: number): void {
			rotateY(this, delta);
		}
		rotateZ(delta: number): void {
			rotateZ(this, delta);
		}
		setRotationY(y: number): void {
			setRotationY(this, y);
		}
		setRotationX(x: number): void {
			setRotationX(this, x);
		}
		setRotationZ(z: number): void {
			setRotationZ(this, z);
		}
		setRotationDegrees(x: number, y: number, z: number): void {
			setRotationDegrees(this, x, y, z);
		}
		setRotationDegreesY(y: number): void {
			setRotationDegreesY(this, y);
		}
		setRotationDegreesX(x: number): void {
			setRotationDegreesX(this, x);
		}
		setRotationDegreesZ(z: number): void {
			setRotationDegreesZ(this, z);
		}
		setRotation(x: number, y: number, z: number): void {
			setRotation(this, x, y, z);
		}
		getRotation(): any {
			return getRotation(this);
		}
	};
}

/**
 * Enhance an entity instance with rotatable methods
 */
export function makeRotatable<T extends RotatableEntity>(entity: T): T & RotatableEntityAPI {
	const rotatableEntity = entity as T & RotatableEntityAPI;

	rotatableEntity.rotateInDirection = (moveVector: Vector3) => rotateInDirection(entity, moveVector);
	rotatableEntity.rotateYEuler = (amount: number) => rotateYEuler(entity, amount);
	rotatableEntity.rotateEuler = (rotation: Vector3) => rotateEuler(entity, rotation);
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