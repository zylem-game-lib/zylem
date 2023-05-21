import { Vec3, Body } from "cannon-es";
import { Constructor } from "./Composable";

export function Moveable<CBase extends Constructor>(Base: CBase) {
	return class Moveable extends Base {
		[x: string]: any;
		moveX(delta: number) {
			this.body.applyLocalForce(new Vec3(delta, 0, 0), new Vec3(0, 0, 0));
		}
		moveY(delta: number) {
			this.body.applyLocalForce(new Vec3(0, delta, 0), new Vec3(0, 0, 0));
		}
		moveZ(delta: number) {
			this.body.applyLocalForce(new Vec3(0, 0, delta), new Vec3(0, 0, 0));
		}
		setPosition(x: number, y: number, z: number) {
			this.body.position.set(x, y, z);
		}
	};
}