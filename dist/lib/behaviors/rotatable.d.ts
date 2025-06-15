import { Vector3 } from 'three';
import { RigidBody } from '@dimforge/rapier3d-compat';
export interface RotatableEntity {
    body: RigidBody | null;
    group: any;
}
/**
 * Rotate an entity in the direction of a movement vector
 */
export declare function rotateInDirection(entity: RotatableEntity, moveVector: Vector3): void;
/**
 * Rotate an entity around the Y axis using Euler angles
 */
export declare function rotateYEuler(entity: RotatableEntity, amount: number): void;
/**
 * Rotate an entity using Euler angles
 */
export declare function rotateEuler(entity: RotatableEntity, rotation: Vector3): void;
/**
 * Rotate an entity around the Y axis
 */
export declare function rotateY(entity: RotatableEntity, delta: number): void;
/**
 * Rotate an entity around the Z axis
 */
export declare function rotateZ(entity: RotatableEntity, delta: number): void;
/**
 * Set rotation around Y axis
 */
export declare function setRotationY(entity: RotatableEntity, y: number): void;
/**
 * Set rotation around X axis
 */
export declare function setRotationX(entity: RotatableEntity, x: number): void;
/**
 * Set rotation around Z axis
 */
export declare function setRotationZ(entity: RotatableEntity, z: number): void;
/**
 * Set rotation for all axes
 */
export declare function setRotation(entity: RotatableEntity, x: number, y: number, z: number): void;
/**
 * Get current rotation
 */
export declare function getRotation(entity: RotatableEntity): any;
