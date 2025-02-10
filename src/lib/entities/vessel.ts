import { BaseNode } from '../core/base-node';
import {
	SetupContext,
	UpdateContext,
	DestroyContext,
	SetupFunction,
	UpdateFunction,
	DestroyFunction,
} from '../core/base-node-life-cycle';
import { EntityOptions } from './entity';

export const VESSEL_TYPE = Symbol('vessel');

export class ZylemVessel extends BaseNode<{}> {
	static type = VESSEL_TYPE;

	public update: UpdateFunction<this> | null = null;
	public setup: SetupFunction<this> | null = null;
	public destroy: DestroyFunction<this> | null = null;

	constructor(options?: EntityOptions) {
		super();
		this.options = { ...options };
	}

	public create(): this {
		return this;
	}

	protected _setup(params: SetupContext<this>): void {
		if (typeof this.setup === 'function') {
			this.setup(params);
		}
	};

	protected _update(params: UpdateContext<this>): void {
		if (typeof this.update === 'function') {
			this.update(params);
		}
	}

	protected _destroy(params: DestroyContext<this>): void {
		if (typeof this.destroy === 'function') {
			this.destroy(params);
		}
	};
}

export function vessel(...args: Array<BaseNode | Partial<{}>>): ZylemVessel {
	const instance = new ZylemVessel();

	for (const arg of args) {
		if (arg instanceof BaseNode) {
			instance.add(arg);
		} else {
			instance.setOptions(arg as Partial<{}>);
		}
	}

	return instance;
}
