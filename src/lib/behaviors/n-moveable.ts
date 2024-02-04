import { RigidBody, Vector } from "@dimforge/rapier3d-compat";
import { Vector3 } from "three";
import { OptionalVector } from "~/lib/interfaces/entity";


export class Moveable {
	[x: string]: any;

	moveX(delta: number) {
		(this.body as RigidBody).setLinvel(new Vector3(delta, 0, 0), true);
	}

	moveY(delta: number) {
		(this.body as RigidBody).setLinvel(new Vector3(0, delta, 0), true);
	}

	moveZ(delta: number) {
		(this.body as RigidBody).setLinvel(new Vector3(0, 0, delta), true);
	}

	moveXY(deltaX: number, deltaY: number) {
		(this.body as RigidBody).setLinvel(new Vector3(deltaX, deltaY, 0), true);
	}

	moveForwardXY(delta: number) {
		const z = this._rotation2DAngle;
		const deltaX = Math.sin(-z) * delta;
		const deltaY = Math.cos(-z) * delta;
		this.velocity.x += deltaX;
		this.velocity.y += deltaY;
		this.moveXY(this.velocity.x, this.velocity.y);
	}

	velocity: Vector3 = new Vector3(0, 0, 0);
	_rotation2DAngle: number = 0;

	_normalizeAngleTo2Pi(angle: number) {
		const normalized = angle % (2 * Math.PI);
		return normalized >= 0 ? normalized : normalized + 2 * Math.PI;
	}

	rotate(delta: number) {
		this._rotation2DAngle += delta;
		this._rotation2DAngle = this._normalizeAngleTo2Pi(this._rotation2DAngle);
		this.setRotationZ(this._rotation2DAngle);
	}

	rotateY(delta: number) {
		this.setRotationY(delta);
	}

	rotateZ(delta: number) {
		this.setRotationZ(delta);
	}

	setRotationY(y: number) {
		this.body.setRotation({ w: 1, x: 0, y: y, z: 0 }, true);
	}

	setRotationX(x: number) {
		this.body.setRotation({ w: 1, x: x, y: 0, z: 0 }, true);
	}

	setRotationZ(z: number) {
		const halfAngle = z / 2;
		const w = Math.cos(halfAngle);
		const zComponent = Math.sin(halfAngle);

		this.body?.setRotation({ w: w, x: 0, y: 0, z: zComponent }, true);
	}

	newRotation(x: number, y: number, z: number) {
		(this.body as RigidBody).applyTorqueImpulse(new Vector3(x, y, z), true);
		// this.body?.setAngvel(new Vector3(x, y, z), true);
	}

	setRotation(x: number, y: number, z: number) {
		this.body.setRotation({ w: 1, x, y, z }, true);
	}

	getRotation(): any {
		return this.body.rotation();
	}

	setPosition(x: number, y: number, z: number) {
		this.body.setTranslation({ x, y, z }, true);
	}

	getPosition(): Vector {
		return this.body.translation();
	}

	getVelocity(): Vector {
		return this.body.linvel();
	}

	getDirection2D(): OptionalVector {
		return {
			x: Math.sin(-this._rotation2DAngle),
			y: Math.cos(-this._rotation2DAngle),
		};
	}

	wrapAroundXY(boundsX: number, boundsY: number) {
		const { x, y } = this.getPosition();

		const newX = x > boundsX ? -boundsX : (x < -boundsX ? boundsX : x);
		const newY = y > boundsY ? -boundsY : (y < -boundsY ? boundsY : y);

		if (newX !== x || newY !== y) {
			this.setPosition(newX, newY, 0);
		}
	}
};
