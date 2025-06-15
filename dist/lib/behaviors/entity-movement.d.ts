import { Vector3 } from 'three';
import { RigidBody } from '@dimforge/rapier3d-compat';
import { OptionalVector } from '~/lib/interfaces/entity';
import { EntityErrors } from '../core/errors';
export declare class EntityMovement {
    body: RigidBody | null;
    velocity: Vector3;
    protected _rotation2DAngle: number;
    protected _normalizeAngleTo2Pi(angle: number): number;
    moveX(delta: number): void;
    moveY(delta: number): void;
    moveZ(delta: number): void;
    moveXY(deltaX: number, deltaY: number): void;
    moveXZ(deltaX: number, deltaZ: number): void;
    move(vector: Vector3): void;
    resetVelocity(): void;
    moveForwardXY(delta: number): void;
    rotateInDirection(moveVector: Vector3): void;
    rotateYEuler(amount: number): void;
    rotateEuler(rotation: Vector3): void;
    rotate(delta: number): void;
    rotateY(delta: number): void;
    rotateZ(delta: number): void;
    setRotationY(y: number): void;
    setRotationX(x: number): void;
    setRotationZ(z: number): void;
    setRotation(x: number, y: number, z: number): void;
    getRotation(): any;
    newRotation(x: number, y: number, z: number): void;
    setPosition(x: number, y: number, z: number): void;
    setPositionX(x: number): void;
    setPositionY(y: number): void;
    setPositionZ(z: number): void;
    getPosition(): import("@dimforge/rapier3d-compat").Vector | null;
    getVelocity(): import("@dimforge/rapier3d-compat").Vector | null;
    getDirection2D(): OptionalVector;
    wrapAroundXY(boundsX: number, boundsY: number): void;
}
export interface EntityMovement extends EntityErrors {
    group: any;
}
