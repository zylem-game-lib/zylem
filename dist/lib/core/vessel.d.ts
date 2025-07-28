import { BaseNode } from './base-node';
import { SetupContext, UpdateContext, DestroyContext } from './base-node-life-cycle';
export declare const VESSEL_TYPE: unique symbol;
export declare class Vessel extends BaseNode<{}, Vessel> {
    static type: symbol;
    protected _setup(_params: SetupContext<this>): void;
    protected _update(_params: UpdateContext<this>): void;
    protected _destroy(_params: DestroyContext<this>): void;
    create(): this;
}
export declare function vessel(...args: Array<BaseNode>): BaseNode<{}, Vessel>;
