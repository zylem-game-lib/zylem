import { Vec3 } from "cannon-es";
import { Constructor } from "./Composable";

export function Moveable<CBase extends Constructor>(Base: CBase) {
	return class Moveable extends Base {
		[x: string]: any;
		moveX(delta: number) {
			this.body.position.vadd(new Vec3(delta, 0, 0), this.body.position);
		}
		moveY(delta: number) {
			this.body.position.vadd(new Vec3(0, delta, 0), this.body.position);
		}
		moveZ(delta: number) {
			this.body.position.vadd(new Vec3(0, 0, delta), this.body.position);
		}
		setPosition(x: number, y: number, z: number) {
			this.body.position.set(x, y, z);
		}
		setRadius(radius: number) {
			this.body.shapes[0].radius = radius;
			this.mesh.geometry.parameters.radius = radius;
			this.mesh.scale.set(radius, radius, radius);
		}
	};
}