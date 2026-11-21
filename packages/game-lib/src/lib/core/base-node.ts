import {
	DestroyContext,
	DestroyFunction,
	LoadedContext,
	LoadedFunction,
	SetupContext,
	SetupFunction,
	UnloadContext,
	UnloadFunction,
	UpdateContext,
	UpdateFunction,
} from "./base-node-life-cycle";
import { nanoid } from "nanoid";
import { NodeInterface } from "./node-interface";

export type BaseNodeOptions<T = any> = BaseNode | Partial<T>;
export type LifecycleRegistrationMethod =
	| 'onSetup'
	| 'onLoaded'
	| 'onUpdate'
	| 'onDestroy'
	| 'onUnload'
	| 'prependSetup'
	| 'prependUpdate';

export interface LifecycleRegistration {
	method: LifecycleRegistrationMethod;
	callbacks: Function[];
}

/**
 * Lifecycle callback arrays - each lifecycle event can have multiple callbacks
 * that execute in order. An array is `null` until its first callback is
 * registered, so a node with no callbacks allocates none.
 */
export interface LifecycleCallbacks<T> {
	setup: Array<SetupFunction<T>> | null;
	loaded: Array<LoadedFunction<T>> | null;
	update: Array<UpdateFunction<T>> | null;
	destroy: Array<DestroyFunction<T>> | null;
	unload: Array<UnloadFunction<T>> | null;
}

/** Run `callbacks` in order. Reads the length each step, so a callback may register another. */
function runCallbacks<C>(callbacks: Array<(context: C) => void> | null, context: C): void {
	if (callbacks === null) return;
	for (let i = 0; i < callbacks.length; i++) {
		callbacks[i]!(context);
	}
}

export abstract class BaseNode<Options = any, T = any> implements NodeInterface {
	protected parent: NodeInterface | null = null;
	protected children: NodeInterface[] = [];
	public options: Options;
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
		setup: null,
		loaded: null,
		update: null,
		destroy: null,
		unload: null,
	};
	/** Whether `nodeLoaded` has run since the last `nodeSetup`. */
	private hasLoaded: boolean = false;
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
		(this.lifecycleCallbacks.setup ??= []).push(...callbacks);
		this.recordLifecycleRegistration('onSetup', callbacks);
		return this;
	}

	/**
	 * Add loaded callbacks, run in order once per spawn when the node is ready
	 * to use: at the end of its spawn, or once a model that loads late and the
	 * physics that depend on it are in place. Not run if the load fails.
	 */
	public onLoaded(...callbacks: Array<LoadedFunction<this>>): this {
		(this.lifecycleCallbacks.loaded ??= []).push(...callbacks);
		this.recordLifecycleRegistration('onLoaded', callbacks);
		return this;
	}

	/**
	 * Add update callbacks to be executed in order during nodeUpdate
	 */
	public onUpdate(...callbacks: Array<UpdateFunction<this>>): this {
		(this.lifecycleCallbacks.update ??= []).push(...callbacks);
		this.recordLifecycleRegistration('onUpdate', callbacks);
		return this;
	}

	/**
	 * Add destroy callbacks to be executed in order during nodeDestroy
	 */
	public onDestroy(...callbacks: Array<DestroyFunction<this>>): this {
		(this.lifecycleCallbacks.destroy ??= []).push(...callbacks);
		this.recordLifecycleRegistration('onDestroy', callbacks);
		return this;
	}

	/**
	 * Add unload callbacks, run in order right after the destroy callbacks.
	 * Use them to free what this stage session built, or to tidy game state
	 * kept outside the node.
	 */
	public onUnload(...callbacks: Array<UnloadFunction<this>>): this {
		(this.lifecycleCallbacks.unload ??= []).push(...callbacks);
		this.recordLifecycleRegistration('onUnload', callbacks);
		return this;
	}

	/** @deprecated Use {@link onUnload}. */
	public onCleanup(...callbacks: Array<UnloadFunction<this>>): this {
		return this.onUnload(...callbacks);
	}

	/**
	 * Prepend setup callbacks (run before existing ones)
	 */
	public prependSetup(...callbacks: Array<SetupFunction<this>>): this {
		(this.lifecycleCallbacks.setup ??= []).unshift(...callbacks);
		this.recordLifecycleRegistration('prependSetup', callbacks);
		return this;
	}

	/**
	 * Prepend update callbacks (run before existing ones)
	 */
	public prependUpdate(...callbacks: Array<UpdateFunction<this>>): this {
		(this.lifecycleCallbacks.update ??= []).unshift(...callbacks);
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
				case 'onUnload':
					target.onUnload(...callbacks as Array<UnloadFunction<any>>);
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

	protected abstract _loaded(params: LoadedContext<this>): void;

	protected abstract _update(params: UpdateContext<this>): void;

	protected abstract _destroy(params: DestroyContext<this>): void;

	protected abstract _unload(params: UnloadContext<this>): void;

	// ─────────────────────────────────────────────────────────────────────────────
	// Node lifecycle execution - runs internal + callback arrays
	//
	// The stage drives setup, loaded and update for every node it spawned,
	// children included, so a parent does not forward them. Destroy is the
	// exception: a parent takes its children with it.
	// ─────────────────────────────────────────────────────────────────────────────

	public nodeSetup(params: SetupContext<this>): void {
		this.markedForRemoval = false;
		this.hasLoaded = false;
		this._setup(params);
		runCallbacks(this.lifecycleCallbacks.setup, params);
	}

	/** Runs at most once per setup; the stage calls it when the node is ready to use. */
	public nodeLoaded(params: LoadedContext<this>): void {
		if (this.hasLoaded) return;
		this.hasLoaded = true;
		this._loaded(params);
		runCallbacks(this.lifecycleCallbacks.loaded, params);
	}

	public nodeUpdate(params: UpdateContext<this>): void {
		if (this.markedForRemoval) {
			return;
		}
		this._update(params);
		this.runUpdateCallbacks(params);
	}

	/** The user `onUpdate` callbacks, for subclasses that reorder `nodeUpdate`. */
	protected runUpdateCallbacks(params: UpdateContext<this>): void {
		runCallbacks(this.lifecycleCallbacks.update, params);
	}

	public nodeDestroy(params: DestroyContext<this>): void {
		// Guard against re-entry (e.g. destroy called twice during collision loop)
		if (this.markedForRemoval) return;

		const children = this.children;
		for (let i = 0; i < children.length; i++) {
			const child = children[i]!;
			child.nodeDestroy({ ...params, me: child });
		}

		// Destroy phase -- consumer game logic (onDestroy callbacks + _destroy override)
		runCallbacks(this.lifecycleCallbacks.destroy, params);
		this._destroy(params);
		this.markedForRemoval = true;

		// Unload phase -- frees what the stage session built (onUnload callbacks + _unload override)
		runCallbacks(this.lifecycleCallbacks.unload, params);
		this._unload(params);
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
