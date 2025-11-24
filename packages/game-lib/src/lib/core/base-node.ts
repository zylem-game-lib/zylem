import {
	CleanupContext,
	CleanupFunction,
	DestroyContext,
	DestroyFunction,
	LoadedContext,
	LoadedFunction,
	SetupContext,
	SetupFunction,
	UpdateContext,
	UpdateFunction,
} from "./base-node-life-cycle";
import { DEBUG_FLAG } from "./flags";
import { nanoid } from "nanoid";
import { NodeInterface } from "./node-interface";

export type BaseNodeOptions<T = any> = BaseNode | Partial<T>;

export abstract class BaseNode<Options = any, T = any> implements NodeInterface {
	protected parent: NodeInterface | null = null;
	protected children: NodeInterface[] = [];
	public options: Options;
	public eid: number = 0;
	public uuid: string = '';
	public name: string = '';
	public markedForRemoval: boolean = false;

	setup: SetupFunction<this> = () => { };
	loaded: LoadedFunction<this> = () => { };
	update: UpdateFunction<this> = () => { };
	destroy: DestroyFunction<this> = () => { };
	cleanup: CleanupFunction<this> = () => { };

	constructor(args: BaseNodeOptions[] = []) {
		const options = args
			.filter(arg => !(arg instanceof BaseNode))
			.reduce((acc, opt) => ({ ...acc, ...opt }), {});
		this.options = options as Options;
		this.uuid = nanoid();
	}

	public setParent(parent: NodeInterface | null): void {
		this.parent = parent;
	}

	public getParent(): NodeInterface | null {
		return this.parent;
	}

	public add(baseNode: NodeInterface): void {
		this.children.push(baseNode);
		baseNode.setParent(this);
	}

	public remove(baseNode: NodeInterface): void {
		const index = this.children.indexOf(baseNode);
		if (index !== -1) {
			this.children.splice(index, 1);
			baseNode.setParent(null);
		}
	}

	public getChildren(): NodeInterface[] {
		return this.children;
	}

	public isComposite(): boolean {
		return this.children.length > 0;
	}

	public abstract create(): T;

	protected abstract _setup(params: SetupContext<this>): void;

	protected abstract _loaded(params: LoadedContext<this>): Promise<void>;

	protected abstract _update(params: UpdateContext<this>): void;

	protected abstract _destroy(params: DestroyContext<this>): void;

	protected abstract _cleanup(params: CleanupContext<this>): Promise<void>;

	public nodeSetup(params: SetupContext<this>) {
		if (DEBUG_FLAG) { /**  */ }
		this.markedForRemoval = false;
		if (typeof this._setup === 'function') {
			this._setup(params);
		}
		if (this.setup) {
			this.setup(params);
		}
		this.children.forEach(child => child.nodeSetup(params));
	}

	public nodeUpdate(params: UpdateContext<this>): void {
		if (this.markedForRemoval) {
			return;
		}
		if (typeof this._update === 'function') {
			this._update(params);
		}
		if (this.update) {
			this.update(params);
		}
		this.children.forEach(child => child.nodeUpdate(params));
	}

	public nodeDestroy(params: DestroyContext<this>): void {
		this.children.forEach(child => child.nodeDestroy(params));
		if (this.destroy) {
			this.destroy(params);
		}
		if (typeof this._destroy === 'function') {
			this._destroy(params);
		}
		this.markedForRemoval = true;
	}

	public getOptions(): Options {
		return this.options;
	}

	public setOptions(options: Partial<Options>): void {
		this.options = { ...this.options, ...options };
	}
}