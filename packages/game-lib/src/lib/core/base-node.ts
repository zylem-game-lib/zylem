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

/**
 * Lifecycle callback arrays - each lifecycle event can have multiple callbacks
 * that execute in order.
 */
export interface LifecycleCallbacks<T> {
	setup: Array<SetupFunction<T>>;
	loaded: Array<LoadedFunction<T>>;
	update: Array<UpdateFunction<T>>;
	destroy: Array<DestroyFunction<T>>;
	cleanup: Array<CleanupFunction<T>>;
}

export abstract class BaseNode<Options = any, T = any> implements NodeInterface {
	protected parent: NodeInterface | null = null;
	protected children: NodeInterface[] = [];
	public options: Options;
	public eid: number = 0;
	public uuid: string = '';
	public name: string = '';
	public markedForRemoval: boolean = false;

	/**
	 * Lifecycle callback arrays - use onSetup(), onUpdate(), etc. to add callbacks
	 */
	protected lifecycleCallbacks: LifecycleCallbacks<this> = {
		setup: [],
		loaded: [],
		update: [],
		destroy: [],
		cleanup: [],
	};

	constructor(args: BaseNodeOptions[] = []) {
		const options = args
			.filter(arg => !(arg instanceof BaseNode))
			.reduce((acc, opt) => ({ ...acc, ...opt }), {});
		this.options = options as Options;
		this.uuid = nanoid();
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// Fluent API for adding lifecycle callbacks
	// ─────────────────────────────────────────────────────────────────────────────

	/**
	 * Add setup callbacks to be executed in order during nodeSetup
	 */
	public onSetup(...callbacks: Array<SetupFunction<this>>): this {
		this.lifecycleCallbacks.setup.push(...callbacks);
		return this;
	}

	/**
	 * Add loaded callbacks to be executed in order during nodeLoaded
	 */
	public onLoaded(...callbacks: Array<LoadedFunction<this>>): this {
		this.lifecycleCallbacks.loaded.push(...callbacks);
		return this;
	}

	/**
	 * Add update callbacks to be executed in order during nodeUpdate
	 */
	public onUpdate(...callbacks: Array<UpdateFunction<this>>): this {
		this.lifecycleCallbacks.update.push(...callbacks);
		return this;
	}

	/**
	 * Add destroy callbacks to be executed in order during nodeDestroy
	 */
	public onDestroy(...callbacks: Array<DestroyFunction<this>>): this {
		this.lifecycleCallbacks.destroy.push(...callbacks);
		return this;
	}

	/**
	 * Add cleanup callbacks to be executed in order during nodeCleanup
	 */
	public onCleanup(...callbacks: Array<CleanupFunction<this>>): this {
		this.lifecycleCallbacks.cleanup.push(...callbacks);
		return this;
	}

	/**
	 * Prepend setup callbacks (run before existing ones)
	 */
	public prependSetup(...callbacks: Array<SetupFunction<this>>): this {
		this.lifecycleCallbacks.setup.unshift(...callbacks);
		return this;
	}

	/**
	 * Prepend update callbacks (run before existing ones)
	 */
	public prependUpdate(...callbacks: Array<UpdateFunction<this>>): this {
		this.lifecycleCallbacks.update.unshift(...callbacks);
		return this;
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// Tree structure
	// ─────────────────────────────────────────────────────────────────────────────

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

	// ─────────────────────────────────────────────────────────────────────────────
	// Abstract methods for subclass implementation
	// ─────────────────────────────────────────────────────────────────────────────

	public abstract create(): T;

	protected abstract _setup(params: SetupContext<this>): void;

	protected abstract _loaded(params: LoadedContext<this>): Promise<void>;

	protected abstract _update(params: UpdateContext<this>): void;

	protected abstract _destroy(params: DestroyContext<this>): void;

	protected abstract _cleanup(params: CleanupContext<this>): Promise<void>;

	// ─────────────────────────────────────────────────────────────────────────────
	// Node lifecycle execution - runs internal + callback arrays
	// ─────────────────────────────────────────────────────────────────────────────

	public nodeSetup(params: SetupContext<this>) {
		if (DEBUG_FLAG) { /**  */ }
		this.markedForRemoval = false;

		// 1. Internal setup
		if (typeof this._setup === 'function') {
			this._setup(params);
		}

		// 2. Run all setup callbacks in order
		for (const callback of this.lifecycleCallbacks.setup) {
			callback(params);
		}

		// 3. Setup children
		this.children.forEach(child => child.nodeSetup(params));
	}

	public nodeUpdate(params: UpdateContext<this>): void {
		if (this.markedForRemoval) {
			return;
		}

		// 1. Internal update
		if (typeof this._update === 'function') {
			this._update(params);
		}

		// 2. Run all update callbacks in order
		for (const callback of this.lifecycleCallbacks.update) {
			callback(params);
		}

		// 3. Update children
		this.children.forEach(child => child.nodeUpdate(params));
	}

	public nodeDestroy(params: DestroyContext<this>): void {
		// 1. Destroy children first
		this.children.forEach(child => child.nodeDestroy(params));

		// 2. Run all destroy callbacks in order
		for (const callback of this.lifecycleCallbacks.destroy) {
			callback(params);
		}

		// 3. Internal destroy
		if (typeof this._destroy === 'function') {
			this._destroy(params);
		}

		this.markedForRemoval = true;
	}

	public async nodeLoaded(params: LoadedContext<this>): Promise<void> {
		// 1. Internal loaded
		if (typeof this._loaded === 'function') {
			await this._loaded(params);
		}

		// 2. Run all loaded callbacks in order
		for (const callback of this.lifecycleCallbacks.loaded) {
			callback(params);
		}
	}

	public async nodeCleanup(params: CleanupContext<this>): Promise<void> {
		// 1. Run all cleanup callbacks in order
		for (const callback of this.lifecycleCallbacks.cleanup) {
			callback(params);
		}

		// 2. Internal cleanup
		if (typeof this._cleanup === 'function') {
			await this._cleanup(params);
		}
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// Options
	// ─────────────────────────────────────────────────────────────────────────────

	public getOptions(): Options {
		return this.options;
	}

	public setOptions(options: Partial<Options>): void {
		this.options = { ...this.options, ...options };
	}
}