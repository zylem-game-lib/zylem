import { Vector } from '@dimforge/rapier3d-compat';
import { Vector3 } from 'three';
import { OptionalVector } from '~/lib/interfaces/entity';
import { GameEntity } from '../core/game-entity';
import { EntityErrors } from '../core/errors';
declare const Moveable_base: import('ts-mixer/dist/types/types').Class<any[], GameEntity<unknown> & EntityErrors, (new (options: import('~/lib/interfaces/entity').GameEntityOptions<{
    collision?: import('~/lib/interfaces/entity').CollisionOption<unknown> | undefined;
}, unknown>) => GameEntity<unknown>) & typeof EntityErrors>;
export declare class Moveable extends Moveable_base {
	moveX(delta: number): void;
	moveY(delta: number): void;
	moveZ(delta: number): void;
	moveXY(deltaX: number, deltaY: number): void;
	moveXZ(deltaX: number, deltaZ: number): void;
	moveEntity(movementVector: Vector3): void;
	resetVelocity(): void;
	moveForwardXY(delta: number): void;
	velocity: Vector3;
	_rotation2DAngle: number;
	_normalizeAngleTo2Pi(angle: number): number;
	rotateInDirection(moveVector: Vector3): void;
	rotateYEuler(amount: number): void;
	rotateEuler(rotation: Vector3): void;
	rotate(delta: number): void;
	rotateY(delta: number): void;
	rotateZ(delta: number): void;
	setRotationY(y: number): void;
	setRotationX(x: number): void;
	setRotationZ(z: number): void;
	newRotation(x: number, y: number, z: number): void;
	setRotation(x: number, y: number, z: number): void;
	getRotation(): any;
	setPosition(x: number, y: number, z: number): void;
	getPosition(): Vector;
	getVelocity(): Vector;
	getDirection2D(): OptionalVector;
	wrapAroundXY(boundsX: number, boundsY: number): void;
}
export {};
