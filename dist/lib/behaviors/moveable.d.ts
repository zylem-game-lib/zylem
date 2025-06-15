import { Vector3 } from 'three';
import { RigidBody, Vector } from '@dimforge/rapier3d-compat';
export interface MoveableEntity {
    body: RigidBody | null;
}
/**
 * Move an entity along the X axis
 */
export declare function moveX(entity: MoveableEntity, delta: number): void;
/**
 * Move an entity along the Y axis
 */
export declare function moveY(entity: MoveableEntity, delta: number): void;
/**
 * Move an entity along the Z axis
 */
export declare function moveZ(entity: MoveableEntity, delta: number): void;
/**
 * Move an entity along the X and Y axis
 */
export declare function moveXY(entity: MoveableEntity, deltaX: number, deltaY: number): void;
/**
 * Move an entity along the X and Z axis
 */
export declare function moveXZ(entity: MoveableEntity, deltaX: number, deltaZ: number): void;
/**
 * Move entity based on a vector
 */
export declare function move(entity: MoveableEntity, vector: Vector3): void;
/**
 * Reset entity velocity
 */
export declare function resetVelocity(entity: MoveableEntity): void;
/**
 * Move entity forward in 2D space
 */
export declare function moveForwardXY(entity: MoveableEntity, delta: number, rotation2DAngle: number): void;
/**
 * Get entity position
 */
export declare function getPosition(entity: MoveableEntity): Vector | null;
/**
 * Get entity velocity
 */
export declare function getVelocity(entity: MoveableEntity): Vector | null;
/**
 * Set entity position
 */
export declare function setPosition(entity: MoveableEntity, x: number, y: number, z: number): void;
/**
 * Set entity X position
 */
export declare function setPositionX(entity: MoveableEntity, x: number): void;
/**
 * Set entity Y position
 */
export declare function setPositionY(entity: MoveableEntity, y: number): void;
/**
 * Set entity Z position
 */
export declare function setPositionZ(entity: MoveableEntity, z: number): void;
/**
 * Wrap entity around 2D bounds
 */
export declare function wrapAroundXY(entity: MoveableEntity, boundsX: number, boundsY: number): void;
