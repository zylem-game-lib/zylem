import { Vector3 } from 'three';
import { RigidBody, Vector } from '@dimforge/rapier3d-compat';

interface EntityWithBody {
    body: RigidBody | null;
}
/**
 * Move entity based on a vector, adding to existing velocities
 */
declare function move(entity: EntityWithBody, vector: Vector3): void;
/**
 * Reset entity velocity
 */
declare function resetVelocity(entity: EntityWithBody): void;
/**
 * Enhanced moveable entity with bound methods
 */
interface MoveableEntity extends EntityWithBody {
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
declare function moveable<T extends {
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
declare function makeMoveable<T extends EntityWithBody>(entity: T): T & MoveableEntity;

interface RotatableEntity {
    body: RigidBody | null;
    group: any;
}
/**
 * Rotate an entity in the direction of a movement vector
 */
declare function rotateInDirection(entity: RotatableEntity, moveVector: Vector3): void;
/**
 * Rotatable entity API with bound methods
 */
interface RotatableEntityAPI extends RotatableEntity {
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
declare function rotatable<T extends {
    new (...args: any[]): RotatableEntity;
}>(constructor: T): {
    new (...args: any[]): {
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
        body: RigidBody | null;
        group: any;
    };
} & T;
/**
 * Enhance an entity instance with rotatable methods
 */
declare function makeRotatable<T extends RotatableEntity>(entity: T): T & RotatableEntityAPI;

/**
 * Enhance an entity with both movement and rotation capabilities.
 */
declare function makeTransformable<T extends RotatableEntity & EntityWithBody>(entity: T): T & MoveableEntity & RotatableEntityAPI;

export { makeRotatable as a, makeTransformable as b, moveable as c, rotateInDirection as d, move as e, resetVelocity as f, makeMoveable as m, rotatable as r };
