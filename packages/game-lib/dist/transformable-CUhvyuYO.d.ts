import { E as EntityWithBody, M as MoveableEntity } from './moveable-B_vyA6cw.js';
import { Vector3 } from 'three';
import { RigidBody } from '@dimforge/rapier3d-compat';

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

export { makeTransformable as a, rotateInDirection as b, makeRotatable as m, rotatable as r };
