import { Constructor } from "./Composable";

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
			this._destroy(this);
		}

		update(delta: number, { inputs, globals }: any) {
			// TODO: it's possible that we want to create an entity without a body or mesh?
			if (!this.body) {
				return;
			}
			if (!this.mesh) {
				return;
			}
			const { x, y, z } = this.body.translation();
			const { x: rx, y: ry, z: rz } = this.body.rotation();
			this.mesh.position.set(x, y, z);
			this.mesh.rotation.set(rx, ry, rz);
			const _inputs = inputs ?? { moveUp: false, moveDown: false };
			if (this._update === undefined) {
				return;
			}
			this._update(delta, { inputs: _inputs, entity: this, globals });
		}

	};
}