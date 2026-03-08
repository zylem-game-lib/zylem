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
export type LifecycleRegistrationMethod =
	| 'onSetup'
	| 'onLoaded'
	| 'onUpdate'
	| 'onDestroy'
	| 'onCleanup'
	| 'prependSetup'
	| 'prependUpdate';

export interface LifecycleRegistration {
	method: LifecycleRegistrationMethod;
	callbacks: Function[];
}

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
	 * Uses `any` for the type parameter to avoid invariance issues when subclasses
	 * are assigned to BaseNode references. Type safety is enforced by the public
	 * onSetup/onUpdate/etc. methods which are typed with `this`.
	 */
	protected lifecycleCallbacks: LifecycleCallbacks<any> = {
		setup: [],
		loaded: [],
		update: [],
		destroy: [],
		cleanup: [],
	};
	private trackLifecycleRegistrations: boolean = false;
	private userLifecycleRegistrations: LifecycleRegistration[] = [];

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
		this.recordLifecycleRegistration('onSetup', callbacks);
		return this;
	}

	/**
	 * Add loaded callbacks to be executed in order during nodeLoaded
	 */
	public onLoaded(...callbacks: Array<LoadedFunction<this>>): this {
		this.lifecycleCallbacks.loaded.push(...callbacks);
		this.recordLifecycleRegistration('onLoaded', callbacks);
		return this;
	}

	/**
	 * Add update callbacks to be executed in order during nodeUpdate
	 */
	public onUpdate(...callbacks: Array<UpdateFunction<this>>): this {
		this.lifecycleCallbacks.update.push(...callbacks);
		this.recordLifecycleRegistration('onUpdate', callbacks);
		return this;
	}

	/**
	 * Add destroy callbacks to be executed in order during nodeDestroy
	 */
	public onDestroy(...callbacks: Array<DestroyFunction<this>>): this {
		this.lifecycleCallbacks.destroy.push(...callbacks);
		this.recordLifecycleRegistration('onDestroy', callbacks);
		return this;
	}

	/**
	 * Add cleanup callbacks to be executed in order during nodeCleanup
	 */
	public onCleanup(...callbacks: Array<CleanupFunction<this>>): this {
		this.lifecycleCallbacks.cleanup.push(...callbacks);
		this.recordLifecycleRegistration('onCleanup', callbacks);
		return this;
	}

	/**
	 * Prepend setup callbacks (run before existing ones)
	 */
	public prependSetup(...callbacks: Array<SetupFunction<this>>): this {
		this.lifecycleCallbacks.setup.unshift(...callbacks);
		this.recordLifecycleRegistration('prependSetup', callbacks);
		return this;
	}

	/**
	 * Prepend update callbacks (run before existing ones)
	 */
	public prependUpdate(...callbacks: Array<UpdateFunction<this>>): this {
		this.lifecycleCallbacks.update.unshift(...callbacks);
		this.recordLifecycleRegistration('prependUpdate', callbacks);
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

	public enableUserLifecycleTracking(): void {
		this.trackLifecycleRegistrations = true;
	}

	protected replayUserLifecycleRegistrationsTo(
		target: BaseNode<any, any>,
		wrap?: <T extends Function>(callback: T) => T,
	): void {
		for (const registration of this.userLifecycleRegistrations) {
			const callbacks = wrap
				? registration.callbacks.map((callback) => wrap(callback as never))
				: [...registration.callbacks];

			switch (registration.method) {
				case 'onSetup':
					target.onSetup(...callbacks as Array<SetupFunction<any>>);
					break;
				case 'onLoaded':
					target.onLoaded(...callbacks as Array<LoadedFunction<any>>);
					break;
				case 'onUpdate':
					target.onUpdate(...callbacks as Array<UpdateFunction<any>>);
					break;
				case 'onDestroy':
					target.onDestroy(...callbacks as Array<DestroyFunction<any>>);
					break;
				case 'onCleanup':
					target.onCleanup(...callbacks as Array<CleanupFunction<any>>);
					break;
				case 'prependSetup':
					target.prependSetup(...callbacks as Array<SetupFunction<any>>);
					break;
				case 'prependUpdate':
					target.prependUpdate(...callbacks as Array<UpdateFunction<any>>);
					break;
			}
		}
	}

	protected cloneChildrenInto(target: BaseNode<any, any>): void {
		for (const child of this.children) {
			target.add(cloneNode(child));
		}
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// Abstract methods for subclass implementation
	// ─────────────────────────────────────────────────────────────────────────────

	public abstract create(): T;

	protected abstract _setup(params: SetupContext<this>): void;

	protected abstract _loaded(params: LoadedContext<this>): Promise<void>;

	protected abstract _update(params: UpdateContext<this>): void;

	protected abstract _destroy(params: DestroyContext<this>): void;

	protected abstract _cleanup(params: CleanupContext<this>): void;

	// ─────────────────────────────────────────────────────────────────────────────
	// Node lifecycle execution - runs internal + callback arrays
	// ─────────────────────────────────────────────────────────────────────────────

	public nodeSetup(params: SetupContext<this>) {
		if (DEBUG_FLAG) { /**  */ }
		this.markedForRemoval = false;
		if (typeof this._setup === 'function') {
			this._setup(params);
		}
		for (const callback of this.lifecycleCallbacks.setup) {
			callback(params);
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
		// Tick entity actions before user callbacks so state is fresh
		if (typeof (this as any)._tickActions === 'function') {
			(this as any)._tickActions(params.delta);
		}
		for (const callback of this.lifecycleCallbacks.update) {
			callback(params);
		}
		this.children.forEach(child => child.nodeUpdate(params));
	}

	public nodeDestroy(params: DestroyContext<this>): void {
		// Guard against re-entry (e.g. destroy called twice during collision loop)
		if (this.markedForRemoval) return;

		this.children.forEach(child => child.nodeDestroy(params));

		// Destroy phase -- consumer game logic (onDestroy callbacks + _destroy override)
		for (const callback of this.lifecycleCallbacks.destroy) {
			callback(params);
		}
		if (typeof this._destroy === 'function') {
			this._destroy(params);
		}
		this.markedForRemoval = true;

		// Cleanup phase -- engine-internal resource disposal (onCleanup callbacks + _cleanup override)
		for (const callback of this.lifecycleCallbacks.cleanup) {
			callback(params);
		}
		if (typeof this._cleanup === 'function') {
			this._cleanup(params);
		}
	}

	public async nodeLoaded(params: LoadedContext<this>): Promise<void> {
		if (typeof this._loaded === 'function') {
			await this._loaded(params);
		}
		for (const callback of this.lifecycleCallbacks.loaded) {
			callback(params);
		}
	}

	public nodeCleanup(params: CleanupContext<this>): void {
		this.children.forEach(child => (child as any).nodeCleanup?.(params));
		for (const callback of this.lifecycleCallbacks.cleanup) {
			callback(params);
		}
		if (typeof this._cleanup === 'function') {
			this._cleanup(params);
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

	private recordLifecycleRegistration(
		method: LifecycleRegistrationMethod,
		callbacks: Function[],
	): void {
		if (!this.trackLifecycleRegistrations || callbacks.length === 0) {
			return;
		}

		this.userLifecycleRegistrations.push({
			method,
			callbacks: [...callbacks],
		});
	}
}

export function cloneNode(node: NodeInterface): NodeInterface {
	const maybeClone = (node as any)?.clone;
	if (typeof maybeClone !== 'function') {
		throw new Error(
			`Cannot clone child node "${node.name || node.uuid || 'unknown'}": missing clone() support.`,
		);
	}
	return maybeClone.call(node);
}
