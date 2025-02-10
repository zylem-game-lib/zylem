import { Behavior } from "~/lib/behaviors/behavior";
import { DestroyContext, SetupContext, UpdateContext } from "./base-node-life-cycle";
import { DEBUG_FLAG } from "./flags";

export type BaseNodeOptions<T = any> = BaseNode | Partial<T>;

export abstract class BaseNode<Options = any, T = any> {
	protected parent: BaseNode | null = null;
	protected children: BaseNode[] = [];
	public behaviors: Behavior[] = [];
	public options: Options;
	public eid: number = 0;
	public name: string = '';

	constructor(args: BaseNodeOptions[] = []) {
		const options = args
			.filter(arg => !(arg instanceof BaseNode))
			.reduce((acc, opt) => ({ ...acc, ...opt }), {});
		this.options = options as Options;
	}

	public setParent(parent: BaseNode | null): void {
		this.parent = parent;
	}

	public getParent(): BaseNode | null {
		return this.parent;
	}

	public add(baseNode: BaseNode): void {
		this.children.push(baseNode);
		baseNode.setParent(this);
	}

	public remove(baseNode: BaseNode): void {
		const index = this.children.indexOf(baseNode);
		if (index !== -1) {
			this.children.splice(index, 1);
			baseNode.setParent(null);
		}
	}

	public getChildren(): BaseNode[] {
		return this.children;
	}

	public isComposite(): boolean {
		return this.children.length > 0;
	}

	public abstract create(): T;

	protected abstract _setup(params: SetupContext<this>): void;

	protected abstract _update(params: UpdateContext<this>): void;

	protected abstract _destroy(params: DestroyContext<this>): void;

	public nodeSetup(params: SetupContext<this>) {
		if (DEBUG_FLAG) { /**  */ }
		if (typeof this._setup === 'function') {
			this._setup(params);
		}
		this.children.forEach(child => child.nodeSetup(params));
	}

	public nodeUpdate(params: UpdateContext<this>): void {
		if (typeof this._update === 'function') {
			this._update(params);
		}
		this.children.forEach(child => child.nodeUpdate(params));
	}

	public nodeDestroy(params: DestroyContext<this>): void {
		if (typeof this._destroy === 'function') {
			this._destroy(params);
		}
		this.children.forEach(child => child.nodeDestroy(params));
	}

	public getOptions(): Options {
		return this.options;
	}

	public setOptions(options: Partial<Options>): void {
		this.options = { ...this.options, ...options };
	}
}