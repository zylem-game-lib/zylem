import { Constructor } from "./Composable";
import { gameState } from "../../state";
import { Vector3 } from "three";
import { OptionalVector } from "~/interfaces/Entity";

export function Interactive<CBase extends Constructor>(Base: CBase) {
	return class Interactive extends Base {
		[x: string]: any;

		setup() {
			if (this._setup === undefined) {
				return;
			}
			this._setup(this);
		}

		destroy() {
			if (this._destroy === undefined) {
				return;
			}
			this._destroy(gameState);
			this.body.setEnabled(false);
			// TODO: refactor stageRef with accessor
			this.stageRef.scene.scene.remove(this.group);
		}

		update(delta: number, { inputs, globals }: any) {
			// TODO: it's possible that we want to create an entity without a body or mesh?
			if (!this.body) {
				return;
			}
			const { x, y, z } = this.body.translation();
			// TODO: this is a hack to get around the fact that we're using a quaternion for rotation
			const { x: rx, y: ry, z: rz } = this.rotation;
			this.group.position.set(x, y, z);
			this.group.rotation.set(rx, ry, rz);
			// TODO: inputs should not go here
			const _inputs = inputs ?? { moveUp: false, moveDown: false };
			if (this._update === undefined) {
				return;
			}
			if (this.sprites) {
				// @ts-ignore
				this.sprites.forEach((sprite, index) => {
					// @ts-ignore
					sprite.material.rotation = rz;
				});
			}
			this._update(delta, { inputs: _inputs, entity: this, globals });
		}

		spawn(T: any, options: any) {
			const stage = this.stageRef;
			stage?.spawnEntity(T(options));
		}

		// TODO: unfortunately we might need to take into account whether the game is 2d or 3d
		// in 2D the only rotations that occur are around the Z axis
		spawnRelative(T: any, options: any, offset: OptionalVector) {
			const stage = this.stageRef;
			const { x, y, z } = this.body.translation();
			const { z: rz } = this.rotation;
			const offsetX = Math.sin(-rz) * (offset.x ?? 0);
			const offsetY = Math.cos(-rz) * (offset.y ?? 0);
			options.position = new Vector3(x + offsetX, y + offsetY, z + (offset.z ?? 0));
			stage?.spawnEntity(T(options));
		}

	};
}