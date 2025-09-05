import { Vector3 } from 'three';
import { RigidBody, Vector } from '@dimforge/rapier3d-compat';
export interface EntityWithBody {
    body: RigidBody | null;
}
/**
 * Move an entity along the X axis, preserving other velocities
 */
export declare function moveX(entity: EntityWithBody, delta: number): void;
/**
 * Move an entity along the Y axis, preserving other velocities
 */
export declare function moveY(entity: EntityWithBody, delta: number): void;
/**
 * Move an entity along the Z axis, preserving other velocities
 */
export declare function moveZ(entity: EntityWithBody, delta: number): void;
/**
 * Move an entity along the X and Y axis, preserving Z velocity
 */
export declare function moveXY(entity: EntityWithBody, deltaX: number, deltaY: number): void;
/**
 * Move an entity along the X and Z axis, preserving Y velocity
 */
export declare function moveXZ(entity: EntityWithBody, deltaX: number, deltaZ: number): void;
/**
 * Move entity based on a vector, adding to existing velocities
 */
export declare function move(entity: EntityWithBody, vector: Vector3): void;
/**
 * Reset entity velocity
 */
export declare function resetVelocity(entity: EntityWithBody): void;
/**
 * Move entity forward in 2D space, preserving Z velocity
 */
export declare function moveForwardXY(entity: EntityWithBody, delta: number, rotation2DAngle: number): void;
/**
 * Get entity position
 */
export declare function getPosition(entity: EntityWithBody): Vector | null;
/**
 * Get entity velocity
 */
export declare function getVelocity(entity: EntityWithBody): Vector | null;
/**
 * Set entity position
 */
export declare function setPosition(entity: EntityWithBody, x: number, y: number, z: number): void;
/**
 * Set entity X position
 */
export declare function setPositionX(entity: EntityWithBody, x: number): void;
/**
 * Set entity Y position
 */
export declare function setPositionY(entity: EntityWithBody, y: number): void;
/**
 * Set entity Z position
 */
export declare function setPositionZ(entity: EntityWithBody, z: number): void;
/**
 * Wrap entity around 2D bounds
 */
export declare function wrapAroundXY(entity: EntityWithBody, boundsX: number, boundsY: number): void;
/**
 * Wrap entity around 3D bounds
 */
export declare function wrapAround3D(entity: EntityWithBody, boundsX: number, boundsY: number, boundsZ: number): void;
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
    wrapAround3D(boundsX: number, boundsY: number, boundsZ: number): void;
}
/**
 * Class decorator to enhance an entity with additive movement methods
 */
export declare function moveable<T extends {
    new (...args: any[]): EntityWithBody;
}>(constructor: T): {
    new (...args: any[]): {
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
        wrapAround3D(boundsX: number, boundsY: number, boundsZ: number): void;
        body: RigidBody | null;
    };
} & T;
/**
 * Enhance an entity with additive movement methods (retained for compatibility)
 */
export declare function makeMoveable<T extends EntityWithBody>(entity: T): T & MoveableEntity;
/**
 * Wrap a standalone function with movement capabilities
 */
export declare function withMovement<T extends (...args: any[]) => any>(fn: T, entity: EntityWithBody): (...args: Parameters<T>) => ReturnType<T> & MoveableEntity;
