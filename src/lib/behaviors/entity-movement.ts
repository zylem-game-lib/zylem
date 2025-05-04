import { Vector3 } from 'three';
import { RigidBody } from '@dimforge/rapier3d-compat';
import { OptionalVector } from '~/lib/interfaces/entity';
import { EntityErrors } from '../core/errors';
import { applyMixins } from '../core/composable';
import * as rotatable from './rotatable';
import * as moveable from './moveable';

export class EntityMovement {
	public body: RigidBody | null = null;
	public velocity: Vector3 = new Vector3(0, 0, 0);
	protected _rotation2DAngle: number = 0;

	protected _normalizeAngleTo2Pi(angle: number) {
		const normalized = angle % (2 * Math.PI);
		return normalized >= 0 ? normalized : normalized + 2 * Math.PI;
	}

	// Delegate movement methods to the moveable module
	moveX(delta: number) {
		moveable.moveX(this, delta);
	}

	moveY(delta: number) {
		moveable.moveY(this, delta);
	}

	moveZ(delta: number) {
		moveable.moveZ(this, delta);
	}

	moveXY(deltaX: number, deltaY: number) {
		moveable.moveXY(this, deltaX, deltaY);
	}

	moveXZ(deltaX: number, deltaZ: number) {
		moveable.moveXZ(this, deltaX, deltaZ);
	}

	move(vector: Vector3) {
		moveable.move(this, vector);
	}

	resetVelocity() {
		moveable.resetVelocity(this);
	}

	moveForwardXY(delta: number) {
		moveable.moveForwardXY(this, delta, this._rotation2DAngle);
	}

	// Delegate rotation methods to the rotatable module
	rotateInDirection(moveVector: Vector3) {
		rotatable.rotateInDirection(this, moveVector);
	}

	rotateYEuler(amount: number) {
		rotatable.rotateYEuler(this, amount);
	}

	rotateEuler(rotation: Vector3) {
		rotatable.rotateEuler(this, rotation);
	}

	rotate(delta: number) {
		this._rotation2DAngle += delta;
		this._rotation2DAngle = this._normalizeAngleTo2Pi(this._rotation2DAngle);
		rotatable.setRotationZ(this, this._rotation2DAngle);
	}

	rotateY(delta: number) {
		rotatable.rotateY(this, delta);
	}

	rotateZ(delta: number) {
		rotatable.rotateZ(this, delta);
	}

	setRotationY(y: number) {
		rotatable.setRotationY(this, y);
	}

	setRotationX(x: number) {
		rotatable.setRotationX(this, x);
	}

	setRotationZ(z: number) {
		rotatable.setRotationZ(this, z);
	}

	setRotation(x: number, y: number, z: number) {
		rotatable.setRotation(this, x, y, z);
	}

	getRotation() {
		return rotatable.getRotation(this);
	}

	newRotation(x: number, y: number, z: number) {
		if (!this.body) return;
		(this.body as RigidBody).applyTorqueImpulse(new Vector3(x, y, z), true);
	}

	setPosition(x: number, y: number, z: number) {
		moveable.setPosition(this, x, y, z);
	}

	setPositionX(x: number) {
		moveable.setPositionX(this, x);
	}

	setPositionY(y: number) {
		moveable.setPositionY(this, y);
	}

	setPositionZ(z: number) {
		moveable.setPositionZ(this, z);
	}

	getPosition() {
		return moveable.getPosition(this);
	}

	getVelocity() {
		return moveable.getVelocity(this);
	}

	getDirection2D(): OptionalVector {
		return {
			x: Math.sin(-this._rotation2DAngle),
			y: Math.cos(-this._rotation2DAngle),
		};
	}

	wrapAroundXY(boundsX: number, boundsY: number) {
		moveable.wrapAroundXY(this, boundsX, boundsY);
	}
}

export interface EntityMovement extends EntityErrors {
	group: any;
}
applyMixins(EntityMovement, [EntityErrors]); 