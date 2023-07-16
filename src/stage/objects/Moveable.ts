import { Vector3 } from "three";
import { Constructor } from "./Composable";

// TODO: moveable needs to change
export function Moveable<CBase extends Constructor>(Base: CBase) {
	return class Moveable extends Base {
		[x: string]: any;
		moveX(delta: number) {
			this.body.angularDamping = 0;
			this.body.position.vadd(new Vector3(delta, 0, 0), this.body.position);
		}
		moveY(delta: number) {
			this.body.angularDamping = 0;
			this.body.position.vadd(new Vector3(0, delta, 0), this.body.position);
		}
		moveZ(delta: number) {
			this.body.angularDamping = 0;
			this.body.position.vadd(new Vector3(0, 0, delta), this.body.position);
		}
		setPosition(x: number, y: number, z: number) {
			this.body.position.set(x, y, z);
		}
		setRadius(radius: number) {
			this.body.shapes[0].radius = radius;
			this.mesh.geometry.parameters.radius = radius;
			this.mesh.scale.set(radius, radius, radius);
		}
		getPosition(): Vector3 {
			return this.body.position;
		}
	};
}