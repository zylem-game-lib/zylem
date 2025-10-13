import { BaseNode } from './base-node';
import {
	SetupContext,
	UpdateContext,
	DestroyContext,
	LoadedContext,
	CleanupContext,
} from './base-node-life-cycle';

export const VESSEL_TYPE = Symbol('vessel');

export class Vessel extends BaseNode<{}, Vessel> {
	static type = VESSEL_TYPE;

	protected _setup(_params: SetupContext<this>): void { }

	protected async _loaded(_params: LoadedContext<this>): Promise<void> { }

	protected _update(_params: UpdateContext<this>): void { }

	protected _destroy(_params: DestroyContext<this>): void { }

	protected async _cleanup(_params: CleanupContext<this>): Promise<void> { }

	public create(): this {
		return this;
	}
}

export function vessel(...args: Array<BaseNode>): BaseNode<{}, Vessel> {
	const instance = new Vessel();
	args.forEach(arg => instance.add(arg));
	return instance as unknown as BaseNode<{}, Vessel>;
}
