/**
 * CooldownBehavior
 *
 * A stage-scoped behavior that manages named cooldowns via the global CooldownStore.
 * Entities use this to register, check, and fire cooldowns.
 * UI components (CooldownIcon) can read from the same store.
 */

import type { IWorld } from 'bitecs';
import { defineBehavior, type BehaviorRef } from '../behavior-descriptor';
import type { BehaviorEntityLink, BehaviorSystem } from '../behavior-system';
import {
	registerCooldown,
	getCooldown,
	fireCooldown,
	resetCooldown,
	tickCooldowns,
} from './cooldown-store';

// ─────────────────────────────────────────────────────────────────────────────
// Options
// ─────────────────────────────────────────────────────────────────────────────

export interface CooldownConfig {
	/** Duration in seconds */
	duration: number;
	/** Whether the cooldown starts ready (default: true) */
	immediate?: boolean;
}

export interface CooldownOptions {
	/**
	 * Named cooldowns to register.
	 * Keys are the cooldown names, values are their config.
	 */
	cooldowns: Record<string, CooldownConfig>;
}

interface CompiledCooldownEntry {
	name: string;
	duration: number;
	immediate: boolean;
}

const COOLDOWN_BEHAVIOR_KEY = Symbol.for('zylem:behavior:cooldown');

// ─────────────────────────────────────────────────────────────────────────────
// Handle
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handle methods returned by entity.use(CooldownBehavior, ...).
 */
export interface CooldownHandle {
	/** Check if a named cooldown is ready */
	isReady(name: string): boolean;
	/** Fire (trigger) a named cooldown, resetting its timer */
	fire(name: string): void;
	/** Force a cooldown to ready immediately */
	reset(name: string): void;
	/** Get cooldown progress 0..1 (0 = just fired, 1 = ready) */
	getProgress(name: string): number;
}

// ─────────────────────────────────────────────────────────────────────────────
// System
// ─────────────────────────────────────────────────────────────────────────────

class CooldownSystem implements BehaviorSystem {
	constructor(
		private world: any,
		private getBehaviorLinks?: (key: symbol) => Iterable<BehaviorEntityLink>,
	) { }

	update(_ecs: IWorld, delta: number): void {
		const links = this.getBehaviorLinks?.(COOLDOWN_BEHAVIOR_KEY);
		if (links) {
			for (const link of links) {
				ensureCooldownEntriesRegistered(link.ref as BehaviorRef<CooldownOptions>);
			}
		}

		// Tick all active cooldowns
		tickCooldowns(delta);
	}

	destroy(_ecs: IWorld): void { }
}

// ─────────────────────────────────────────────────────────────────────────────
// Handle factory
// ─────────────────────────────────────────────────────────────────────────────

function createCooldownHandle(ref: BehaviorRef<CooldownOptions>): CooldownHandle {
	ensureCooldownEntriesRegistered(ref);

	return {
		isReady: (name: string) => getCooldown(name)?.ready ?? false,
		fire: (name: string) => fireCooldown(name),
		reset: (name: string) => resetCooldown(name),
		getProgress: (name: string) => getCooldown(name)?.progress ?? 1,
	};
}

function getCompiledCooldownEntries(
	ref: BehaviorRef<CooldownOptions>,
): CompiledCooldownEntry[] {
	const compiled = (ref as any).__compiledCooldownEntries as CompiledCooldownEntry[] | undefined;
	if (compiled) return compiled;

	const entries = Object.entries(ref.options.cooldowns).map(([name, config]) => ({
		name,
		duration: config.duration,
		immediate: config.immediate ?? true,
	}));
	(ref as any).__compiledCooldownEntries = entries;
	return entries;
}

function ensureCooldownEntriesRegistered(ref: BehaviorRef<CooldownOptions>): void {
	if ((ref as any).__cooldownsRegistered) return;

	for (const entry of getCompiledCooldownEntries(ref)) {
		registerCooldown(entry.name, entry.duration, entry.immediate);
	}

	(ref as any).__cooldownsRegistered = true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Behavior Definition
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CooldownBehavior
 *
 * @example
 * ```ts
 * import { CooldownBehavior, moveBy } from '@zylem/game-lib';
 *
 * const hero = createBox({ ... });
 * const cd = hero.use(CooldownBehavior, {
 *   cooldowns: {
 *     attack: { duration: 5 },
 *     dash: { duration: 2, immediate: false },
 *   },
 * });
 *
 * hero.onUpdate(({ me, inputs }) => {
 *   if (cd.isReady('attack') && inputs.p1.buttons.A.pressed) {
 *     cd.fire('attack');
 *     // perform attack
 *   }
 *   if (cd.isReady('dash') && inputs.p1.buttons.B.pressed) {
 *     cd.fire('dash');
 *     me.runAction(moveBy({ x: 10, duration: 0.3 }));
 *   }
 * });
 * ```
 */
export const CooldownBehavior = defineBehavior<CooldownOptions, CooldownHandle>({
	name: 'cooldown',
	defaultOptions: { cooldowns: {} },
	systemFactory: (ctx) =>
		new CooldownSystem(ctx.world, ctx.getBehaviorLinks),
	createHandle: createCooldownHandle,
});
