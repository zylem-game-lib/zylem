import { BaseNode } from './base-node';
import {
	SetupContext,
	UpdateContext,
	DestroyContext,
	LoadedContext,
	CleanupContext,
} from './base-node-life-cycle';
import type { NodeInterface } from './node-interface';

const VESSEL_TYPE = Symbol('vessel');

/**
 * A Vessel is an empty container entity that holds child entities.
 * It has no geometry, physics, or rendering of its own, but propagates
 * lifecycle events to its children and provides a logical grouping mechanism.
 *
 * Child entities added to a Vessel will be individually spawned into the
 * stage's physics world and render scene when the Vessel is spawned.
 */
export class Vessel extends BaseNode<{}, Vessel> {
	static type = VESSEL_TYPE;

	protected _setup(_params: SetupContext<this>): void { }

	protected async _loaded(_params: LoadedContext<this>): Promise<void> { }

	protected _update(_params: UpdateContext<this>): void { }

	protected _destroy(_params: DestroyContext<this>): void { }

	protected _cleanup(_params: CleanupContext<this>): void { }

	public create(): this {
		return this;
	}

	/**
	 * Add one or more child entities to this vessel.
	 * Overrides parent to support multiple arguments.
	 * @returns this for chaining
	 */
	public add(...nodes: NodeInterface[]): this {
		for (const node of nodes) {
			super.add(node);
		}
		return this;
	}
}

/**
 * Create a vessel containing the given child entities.
 * @param args Child BaseNode entities to add
 * @returns A new Vessel with the children added
 */
export function vessel(...args: Array<BaseNode>): Vessel {
	const instance = new Vessel();
	args.forEach(arg => instance.add(arg));
	return instance;
}
