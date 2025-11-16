import { BaseNode } from './base-node';
import { SetupContext, UpdateContext, DestroyContext, LoadedContext, CleanupContext } from './base-node-life-cycle';
export declare class Vessel extends BaseNode<{}, Vessel> {
    static type: symbol;
    protected _setup(_params: SetupContext<this>): void;
    protected _loaded(_params: LoadedContext<this>): Promise<void>;
    protected _update(_params: UpdateContext<this>): void;
    protected _destroy(_params: DestroyContext<this>): void;
    protected _cleanup(_params: CleanupContext<this>): Promise<void>;
    create(): this;
}
export declare function vessel(...args: Array<BaseNode>): BaseNode<{}, Vessel>;
//# sourceMappingURL=vessel.d.ts.map