/**
 * CooldownBehavior
 *
 * A stage-scoped behavior that manages named cooldowns via the global CooldownStore.
 * Entities use this to register, check, and fire cooldowns.
 * UI components (CooldownIcon) can read from the same store.
 */

import type { IWorld } from 'bitecs';
import { defineBehavior, type BehaviorRef } from '../behavior-descriptor';
import type { BehaviorSystem } from '../behavior-system';
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
	private initialized = false;

	constructor(private world: any) { }

	update(_ecs: IWorld, delta: number): void {
		// Register cooldowns from entities on first update
		if (!this.initialized && this.world?.collisionMap) {
			for (const [, entity] of this.world.collisionMap) {
				const gameEntity = entity as any;
				if (typeof gameEntity.getBehaviorRefs !== 'function') continue;

				const refs = gameEntity.getBehaviorRefs();
				const cdRef = refs.find(
					(r: any) => r.descriptor.key === Symbol.for('zylem:behavior:cooldown'),
				);
				if (!cdRef) continue;

				const options = cdRef.options as CooldownOptions;
				for (const [name, config] of Object.entries(options.cooldowns)) {
					registerCooldown(name, config.duration, config.immediate ?? true);
				}
			}
			this.initialized = true;
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
	// Also register cooldowns eagerly so the handle works before the system initializes
	const options = ref.options;
	for (const [name, config] of Object.entries(options.cooldowns)) {
		registerCooldown(name, config.duration, config.immediate ?? true);
	}

	return {
		isReady: (name: string) => getCooldown(name)?.ready ?? false,
		fire: (name: string) => fireCooldown(name),
		reset: (name: string) => resetCooldown(name),
		getProgress: (name: string) => getCooldown(name)?.progress ?? 1,
	};
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
	systemFactory: (ctx) => new CooldownSystem(ctx.world),
	createHandle: createCooldownHandle,
});
