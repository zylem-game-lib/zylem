import type {
	BehaviorDescriptor,
	BehaviorEntityLink,
	BehaviorHandle,
	BehaviorRef,
} from '@zylem/behaviors/core';

/**
 * What a spawned entity's behaviors talk to: the stage that runs the behavior
 * systems. An entity outside a stage has no host, and its behaviors only
 * record whether they are enabled.
 */
export interface BehaviorHost {
	/** Start an enabled behavior: create its system on first use and attach the link. */
	linkBehavior(link: BehaviorEntityLink): void;
	/**
	 * Stop a running behavior.
	 * @throws When the behavior's system has no `detach`. Nothing changes.
	 */
	unlinkBehavior(link: BehaviorEntityLink): void;
	/** Stop every running behavior on the entity, for instance before its body is rebuilt. */
	suspendBehaviors(entity: BehaviorSlotOwner): void;
	/** Start every enabled behavior on the entity. */
	resumeBehaviors(entity: BehaviorSlotOwner): void;
}

/** The part of an entity the stage needs to run its behaviors. */
export interface BehaviorSlotOwner {
	behaviorHost: BehaviorHost | null;
	getBehaviorSlots(): readonly BehaviorSlot[];
}

/**
 * One behavior on one entity. Created by the first `entity.use(Descriptor)`
 * and kept until `entity.unuse(Descriptor)`, so switching the behavior on and
 * off reuses the same ref, handle and link.
 */
export interface BehaviorSlot<O extends Record<string, any> = Record<string, any>> {
	readonly ref: BehaviorRef<O>;
	readonly handle: BehaviorHandle<O, any>;
	/** The one link the stage and the behavior's system see for this slot. */
	readonly link: BehaviorEntityLink;
	readonly table: BehaviorSlotTable;
	/** False once `unuse()` has dropped the slot. */
	owned: boolean;
}

/**
 * Slot substitutions for the callback that is running. A cloned entity
 * replays its source's callbacks, which closed over the source's handles;
 * while one runs, those handles act on the clone's slots.
 */
const slotAliasStack: Array<ReadonlyMap<BehaviorSlot, BehaviorSlot>> = [];

function resolveSlot(slot: BehaviorSlot): BehaviorSlot {
	// Innermost first: a clone of a clone maps source to first clone, then
	// first clone to second.
	for (let i = slotAliasStack.length - 1; i >= 0; i--) {
		slot = slotAliasStack[i]!.get(slot) ?? slot;
	}
	return slot;
}

/** Run `callback` with `aliases` substituted for the handles it uses. */
export function withSlotAliases<T>(
	aliases: ReadonlyMap<BehaviorSlot, BehaviorSlot>,
	callback: () => T,
): T {
	slotAliasStack.push(aliases);
	try {
		return callback();
	} finally {
		slotAliasStack.pop();
	}
}

/** The name a behavior was defined with, for error messages. */
export function behaviorName(descriptor: BehaviorDescriptor<any, any>): string {
	return descriptor.key.description?.replace(/^zylem:behavior:/, '') ?? 'unnamed';
}

/**
 * The behaviors declared on one entity, one slot per descriptor key.
 *
 * Enabling and disabling a behavior changes a flag and tells the host. It
 * creates no objects and resizes no collection.
 */
export class BehaviorSlotTable {
	/** The stage the entity is spawned in. Set and cleared by that stage. */
	host: BehaviorHost | null = null;

	private readonly slots: BehaviorSlot[] = [];
	/** Enabled refs in `use()` order, rebuilt on demand. */
	private readonly enabledRefs: BehaviorRef[] = [];
	private enabledRefsStale = false;

	constructor(private readonly entity: object) {}

	getSlots(): readonly BehaviorSlot[] {
		return this.slots;
	}

	/**
	 * Declare a behavior, or update and enable the one already declared.
	 * @returns The slot's handle, the same object on every call.
	 */
	use<O extends Record<string, any>, H extends Record<string, any>>(
		descriptor: BehaviorDescriptor<O, H>,
		options?: Partial<O>,
	): BehaviorHandle<O, H> {
		const existing = this.find(descriptor.key);
		if (existing) {
			if (options) this.setOptions(existing, options);
			this.setEnabled(existing, true);
			return existing.handle as BehaviorHandle<O, H>;
		}

		const slot = this.createSlot(descriptor, options);
		this.slots.push(slot);
		this.enabledRefsStale = true;
		this.host?.linkBehavior(slot.link);
		return slot.handle as BehaviorHandle<O, H>;
	}

	/**
	 * Stop a behavior and drop its slot. Its handle stops working.
	 * @returns False when the behavior was never declared.
	 * @throws On a spawned entity when the behavior is enabled and its system
	 * cannot detach.
	 */
	unuse(descriptor: BehaviorDescriptor<any, any>): boolean {
		const index = this.indexOf(descriptor.key);
		if (index === -1) return false;

		const slot = this.slots[index]!;
		this.setEnabled(slot, false);
		slot.owned = false;
		this.slots.splice(index, 1);
		return true;
	}

	/** The handle for a declared behavior, enabled or not. */
	handleFor<O extends Record<string, any>, H extends Record<string, any>>(
		descriptor: BehaviorDescriptor<O, H>,
	): BehaviorHandle<O, H> | null {
		return (this.find(descriptor.key)?.handle as BehaviorHandle<O, H> | undefined) ?? null;
	}

	/** The ref for a behavior that is declared and enabled. */
	enabledRef<O extends Record<string, any>>(
		descriptor: BehaviorDescriptor<O, any>,
	): BehaviorRef<O> | null {
		const slot = this.find(descriptor.key);
		return slot && slot.ref.enabled !== false ? (slot.ref as BehaviorRef<O>) : null;
	}

	/** Refs of the enabled behaviors, in `use()` order. */
	getEnabledRefs(): BehaviorRef[] {
		if (this.enabledRefsStale) {
			const refs = this.enabledRefs;
			let count = 0;
			for (let i = 0; i < this.slots.length; i++) {
				const ref = this.slots[i]!.ref;
				if (ref.enabled !== false) refs[count++] = ref;
			}
			refs.length = count;
			this.enabledRefsStale = false;
		}
		return this.enabledRefs;
	}

	/**
	 * Declare this table's behaviors on `target` with copies of their options
	 * and the same enabled state.
	 * @returns Each of this table's slots mapped to its counterpart.
	 */
	copyTo(
		target: BehaviorSlotTable,
		cloneOptions: <T>(options: T) => T,
	): Map<BehaviorSlot, BehaviorSlot> {
		const aliases = new Map<BehaviorSlot, BehaviorSlot>();
		for (const slot of this.slots) {
			target.use(slot.ref.descriptor, cloneOptions(slot.ref.options));
			const copy = target.find(slot.ref.descriptor.key)!;
			if (slot.ref.enabled === false) target.setEnabled(copy, false);
			aliases.set(slot, copy);
		}
		return aliases;
	}

	private find(key: symbol): BehaviorSlot | undefined {
		const index = this.indexOf(key);
		return index === -1 ? undefined : this.slots[index];
	}

	private indexOf(key: symbol): number {
		for (let i = 0; i < this.slots.length; i++) {
			if (this.slots[i]!.ref.descriptor.key === key) return i;
		}
		return -1;
	}

	private createSlot<O extends Record<string, any>, H extends Record<string, any>>(
		descriptor: BehaviorDescriptor<O, H>,
		options?: Partial<O>,
	): BehaviorSlot {
		const ref: BehaviorRef<O> = {
			descriptor: descriptor as BehaviorDescriptor<O, any>,
			options: { ...descriptor.defaultOptions, ...options } as O,
			enabled: true,
		};

		// The handle's own methods find their slot through `resolveSlot`, so
		// inside a cloned callback they act on the clone.
		const handle = {
			getFSM: () => ref.fsm ?? null,
			getOptions: () => ref.options,
			ref,
			get enabled(): boolean {
				const target = resolveSlot(slot);
				return target.owned && target.ref.enabled !== false;
			},
			enable: (): void => {
				const target = resolveSlot(slot);
				target.table.requireOwned(target).setEnabled(target, true);
			},
			disable: (): void => {
				const target = resolveSlot(slot);
				if (target.owned) target.table.setEnabled(target, false);
			},
			setOptions: (partial: Partial<O>): void => {
				const target = resolveSlot(slot);
				target.table.requireOwned(target).setOptions(target, partial);
			},
		};
		// Assigned onto the base so its `enabled` getter survives.
		Object.assign(handle, descriptor.createHandle?.(ref));

		const slot: BehaviorSlot = {
			ref: ref as BehaviorRef<any>,
			handle: handle as unknown as BehaviorHandle<any, any>,
			link: { entity: this.entity, ref, slotIndex: -1 },
			table: this,
			owned: true,
		};
		return slot;
	}

	private requireOwned(slot: BehaviorSlot): this {
		if (!slot.owned) {
			throw new Error(
				`Behavior "${behaviorName(slot.ref.descriptor)}" was removed with unuse(). Call use() to declare it again.`,
			);
		}
		return this;
	}

	private setEnabled(slot: BehaviorSlot, enabled: boolean): void {
		const ref = slot.ref;
		if ((ref.enabled !== false) === enabled) return;

		if (enabled) {
			ref.enabled = true;
			this.enabledRefsStale = true;
			this.host?.linkBehavior(slot.link);
		} else {
			// Unlink first: when the system cannot detach this throws, and the
			// behavior stays enabled.
			this.host?.unlinkBehavior(slot.link);
			ref.enabled = false;
			this.enabledRefsStale = true;
		}
	}

	/** Merge `partial` into the slot's options; a running behavior restarts with them. */
	private setOptions(slot: BehaviorSlot, partial: Record<string, any>): void {
		const host = slot.ref.enabled !== false ? this.host : null;
		host?.unlinkBehavior(slot.link);
		Object.assign(slot.ref.options, partial);
		host?.linkBehavior(slot.link);
	}
}
