import { Vector3 } from "three";
import { Constructor } from "./Composable";
import { OptionalVector } from "~/interfaces/Entity";

// TODO: moveable needs to change
export function Moveable<CBase extends Constructor>(Base: CBase) {
	return class Moveable extends Base {
		[x: string]: any;

		moveX(delta: number) {
			this.body.setLinvel(new Vector3(delta, 0, 0));
		}

		moveY(delta: number) {
			this.body.setLinvel(new Vector3(0, delta, 0));
		}

		moveZ(delta: number) {
			this.body.setLinvel(new Vector3(0, 0, delta));
		}

		moveXY(deltaX: number, deltaY: number) {
			this.body.setLinvel(new Vector3(deltaX, deltaY, 0));
		}

		moveForwardXY(delta: number) {
			const { z } = this.rotation;
			const deltaX = Math.sin(-z) * delta;
			const deltaY = Math.cos(-z) * delta;
			this.velocity.x += deltaX;
			this.velocity.y += deltaY;
			this.moveXY(this.velocity.x, this.velocity.y);
		}

		velocity: Vector3 = new Vector3(0, 0, 0);
		rotation: Vector3 = new Vector3(0, 0, 0);

		_normalizeAngleTo2Pi(angle: number) {
			const normalized = angle % (2 * Math.PI);
			return normalized >= 0 ? normalized : normalized + 2 * Math.PI;
		}

		rotate(delta: number) {
			this.rotation.z += delta;
			this.rotation.z = this._normalizeAngleTo2Pi(this.rotation.z);
			this.setRotationZ(this.rotation.z);
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
			this.body.setRotation({ w: 1, x: 0, y: 0, z: z }, true);
		}

		setPosition(x: number, y: number, z: number) {
			this.body.setTranslation({ x, y, z });
		}

		getPosition(): Vector3 {
			return this.body.translation();
		}

		getVelocity(): Vector3 {
			return this.body.linvel();
		}

		getDirectionXY(): OptionalVector {
			return {
				x: Math.sin(-this.rotation.z),
				y: Math.cos(-this.rotation.z),
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
}