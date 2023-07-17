import { Vector3 } from "three";
import { Constructor } from "./Composable";

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
		setPosition(x: number, y: number, z: number) {
			this.body.setTranslation({ x, y, z });
		}
		getPosition(): Vector3 {
			return this.body.translation();
		}
		getVelocity(): Vector3 {
			return this.body.linvel();
		}
	};
}