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

export { type EntityWithBody as E, type MoveableEntity as M, moveable as a, move as b, makeMoveable as m, resetVelocity as r };
