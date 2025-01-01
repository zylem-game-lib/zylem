import { BaseNode, BaseNodeOptions } from '../core/base-node';
import { DestroyFunction, SetupFunction, UpdateFunction } from '../core/base-node-life-cycle';

interface Vessel {
	children: BaseNode[];
	options: BaseNodeOptions;
	update: UpdateFunction<Vessel>;
	setup: SetupFunction<Vessel>;
	destroy: DestroyFunction<Vessel>
}

export class ZylemVessel extends BaseNode<{}> {
	create(): Vessel {
		return {
			children: this.children,
			options: this.options,
			update: this.update,
			setup: this.setup,
			destroy: this.destroy
		};
	}
}

export function vessel(...args: Array<BaseNode | Partial<{}>>): Vessel {
	const instance = new ZylemVessel();

	for (const arg of args) {
		if (arg instanceof BaseNode) {
			instance.add(arg);
		} else {
			instance.setOptions(arg as Partial<{}>);
		}
	}

	return instance.create();
}
