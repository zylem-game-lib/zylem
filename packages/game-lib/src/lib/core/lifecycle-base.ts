import { DestroyContext, DestroyFunction, SetupContext, SetupFunction, UpdateContext, UpdateFunction } from './base-node-life-cycle';

/**
 * Provides BaseNode-like lifecycle without ECS/children. Consumers implement
 * the protected hooks and may assign public setup/update/destroy callbacks.
 */
export abstract class LifeCycleBase<TSelf> {
	update: UpdateFunction<TSelf> = () => { };
	setup: SetupFunction<TSelf> = () => { };
	destroy: DestroyFunction<TSelf> = () => { };

	protected abstract _setup(context: SetupContext<TSelf>): void;
	protected abstract _update(context: UpdateContext<TSelf>): void;
	protected abstract _destroy(context: DestroyContext<TSelf>): void;

	nodeSetup(context: SetupContext<TSelf>) {
		if (typeof (this as any)._setup === 'function') {
			this._setup(context);
		}
		if (this.setup) {
			this.setup(context);
		}
	}

	nodeUpdate(context: UpdateContext<TSelf>) {
		if (typeof (this as any)._update === 'function') {
			this._update(context);
		}
		if (this.update) {
			this.update(context);
		}
	}

	nodeDestroy(context: DestroyContext<TSelf>) {
		if (this.destroy) {
			this.destroy(context);
		}
		if (typeof (this as any)._destroy === 'function') {
			this._destroy(context);
		}
	}
}


