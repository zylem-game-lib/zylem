import { CleanupContext, CleanupFunction, DestroyContext, DestroyFunction, LoadedContext, LoadedFunction, SetupContext, SetupFunction, UpdateContext, UpdateFunction } from "./base-node-life-cycle";
import { NodeInterface } from "./node-interface";
export type BaseNodeOptions<T = any> = BaseNode | Partial<T>;
export declare abstract class BaseNode<Options = any, T = any> implements NodeInterface {
    protected parent: NodeInterface | null;
    protected children: NodeInterface[];
    options: Options;
    eid: number;
    uuid: string;
    name: string;
    markedForRemoval: boolean;
    setup: SetupFunction<this>;
    loaded: LoadedFunction<this>;
    update: UpdateFunction<this>;
    destroy: DestroyFunction<this>;
    cleanup: CleanupFunction<this>;
    constructor(args?: BaseNodeOptions[]);
    setParent(parent: NodeInterface | null): void;
    getParent(): NodeInterface | null;
    add(baseNode: NodeInterface): void;
    remove(baseNode: NodeInterface): void;
    getChildren(): NodeInterface[];
    isComposite(): boolean;
    abstract create(): T;
    protected abstract _setup(params: SetupContext<this>): void;
    protected abstract _loaded(params: LoadedContext<this>): Promise<void>;
    protected abstract _update(params: UpdateContext<this>): void;
    protected abstract _destroy(params: DestroyContext<this>): void;
    protected abstract _cleanup(params: CleanupContext<this>): Promise<void>;
    nodeSetup(params: SetupContext<this>): void;
    nodeUpdate(params: UpdateContext<this>): void;
    nodeDestroy(params: DestroyContext<this>): void;
    getOptions(): Options;
    setOptions(options: Partial<Options>): void;
}
//# sourceMappingURL=base-node.d.ts.map