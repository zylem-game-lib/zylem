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

		update(delta: number, { inputs }: any) {
			if (!this.body) {
				return;
			}
			const { x, y, z } = this.body.position;
			this.mesh.position.set(x, y, z);
			const _inputs = inputs ?? { moveUp: false, moveDown: false };
			if (this._update === undefined) {
				return;
			}
			this._update(delta, { inputs: _inputs, entity: this });
		}

	};
}