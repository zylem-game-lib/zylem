import { DestroyContext, DestroyFunction, SetupContext, SetupFunction, UpdateContext, UpdateFunction } from './base-node-life-cycle';
/**
 * Provides BaseNode-like lifecycle without ECS/children. Consumers implement
 * the protected hooks and may assign public setup/update/destroy callbacks.
 */
export declare abstract class LifeCycleBase<TSelf> {
    update: UpdateFunction<TSelf>;
    setup: SetupFunction<TSelf>;
    destroy: DestroyFunction<TSelf>;
    protected abstract _setup(context: SetupContext<TSelf>): void;
    protected abstract _update(context: UpdateContext<TSelf>): void;
    protected abstract _destroy(context: DestroyContext<TSelf>): void;
    nodeSetup(context: SetupContext<TSelf>): void;
    nodeUpdate(context: UpdateContext<TSelf>): void;
    nodeDestroy(context: DestroyContext<TSelf>): void;
}
