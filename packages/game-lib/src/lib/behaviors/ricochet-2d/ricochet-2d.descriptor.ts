/**
 * Ricochet2DBehavior
 *
 * Computes 2D ricochet/reflection results for entities during collisions.
 * The behavior computes the result; the consumer decides how to apply it.
 *
 * Use `getRicochet(ctx)` on the behavior handle to compute reflection results.
 */

import type { IWorld } from 'bitecs';
import { defineBehavior, type BehaviorRef } from '../behavior-descriptor';
import type { BehaviorSystem } from '../behavior-system';
import { Ricochet2DFSM, type Ricochet2DResult, type Ricochet2DCollisionContext, type RicochetCallback } from './ricochet-2d-fsm';
export type { Ricochet2DResult };

export interface Ricochet2DOptions {
	/**
	 * Minimum speed after reflection.
	 * Default: 2
	 */
	minSpeed: number;

	/**
	 * Maximum speed after reflection.
	 * Default: 20
	 */
	maxSpeed: number;

	/**
	 * Speed multiplier applied during angled reflection.
	 * Default: 1.05
	 */
	speedMultiplier: number;

	/**
	 * Reflection mode:
	 * - 'simple': Basic axis inversion
	 * - 'angled': Paddle-style deflection based on contact point
	 * Default: 'angled'
	 */
	reflectionMode: 'simple' | 'angled';

	/**
	 * Maximum deflection angle in degrees for angled mode.
	 * Default: 60
	 */
	maxAngleDeg: number;
}

/**
 * Handle methods provided by Ricochet2DBehavior
 */
export interface Ricochet2DHandle {
	/**
	 * Compute a ricochet/reflection result from collision context.
	 * Returns the result for the consumer to apply, or null if invalid input.
	 *
	 * @param ctx - Collision context with selfVelocity and contact normal
	 * @returns Ricochet result with velocity, speed, and normal, or null
	 */
	getRicochet(ctx: Ricochet2DCollisionContext): Ricochet2DResult | null;

	/**
	 * Compute ricochet and apply velocity directly via transformStore.
	 * Emits to onRicochet listeners if successful.
	 *
	 * @param ctx - Collision context with entity and contact normal
	 * @returns true if ricochet was computed and applied, false otherwise
	 */
	applyRicochet(ctx: Ricochet2DCollisionContext): boolean;

	/**
	 * Get the last computed ricochet result, or null if none.
	 */
	getLastResult(): Ricochet2DResult | null;

	/**
	 * Register a listener for ricochet events.
	 * Called whenever a ricochet is computed (from getRicochet or applyRicochet).
	 *
	 * @param callback - Function to call with ricochet result
	 * @returns Unsubscribe function
	 */
	onRicochet(callback: RicochetCallback): () => void;
}

const defaultOptions: Ricochet2DOptions = {
	minSpeed: 2,
	maxSpeed: 20,
	speedMultiplier: 1.05,
	reflectionMode: 'angled',
	maxAngleDeg: 60,
};

/**
 * Creates behavior-specific handle methods for Ricochet2DBehavior.
 */
function createRicochet2DHandle(
	ref: BehaviorRef<Ricochet2DOptions>
): Ricochet2DHandle {
	return {
		getRicochet: (ctx: Ricochet2DCollisionContext) => {
			const fsm = ref.fsm as Ricochet2DFSM | undefined;
			if (!fsm) return null;
			return fsm.computeRicochet(ctx, ref.options);
		},
		applyRicochet: (ctx: Ricochet2DCollisionContext): boolean => {
			const fsm = ref.fsm as Ricochet2DFSM | undefined;
			if (!fsm) return false;

			// Skip if on cooldown (prevents rapid duplicate applications)
			if (fsm.isOnCooldown()) return false;

			const result = fsm.computeRicochet(ctx, ref.options);
			if (!result) return false;

			// Apply velocity via transformStore
			const entity = ctx.entity as any;
			if (entity?.transformStore) {
				entity.transformStore.velocity.x = result.velocity.x;
				entity.transformStore.velocity.y = result.velocity.y;
				entity.transformStore.velocity.z = result.velocity.z ?? 0;
				entity.transformStore.dirty.velocity = true;
			}

			return true;
		},
		getLastResult: () => {
			const fsm = ref.fsm as Ricochet2DFSM | undefined;
			return fsm?.getLastResult() ?? null;
		},
		onRicochet: (callback: RicochetCallback): (() => void) => {
			const fsm = ref.fsm as Ricochet2DFSM | undefined;
			if (!fsm) {
				// FSM not ready yet - queue callback for later
				// System will apply pending callbacks when FSM is created
				if (!(ref as any).pendingListeners) {
					(ref as any).pendingListeners = [];
				}
				(ref as any).pendingListeners.push(callback);
				
				// Return unsubscribe that removes from pending queue
				return () => {
					const pending = (ref as any).pendingListeners as RicochetCallback[];
					const idx = pending.indexOf(callback);
					if (idx >= 0) pending.splice(idx, 1);
				};
			}
			return fsm.addListener(callback);
		},
	};
}

/**
 * Ricochet2DSystem
 *
 * Stage-level system that:
 * - finds entities with this behavior attached
 * - lazily creates FSM instances for each entity
 *
 * Note: This behavior is consumer-driven. The system only manages FSM lifecycle.
 * Consumers call `getRicochet(ctx)` during collision callbacks to compute results.
 */
class Ricochet2DSystem implements BehaviorSystem {
	private elapsedMs: number = 0;

	constructor(private world: any) {}

	update(_ecs: IWorld, delta: number): void {
		// Accumulate elapsed time (delta is in seconds)
		this.elapsedMs += delta * 1000;

		if (!this.world?.collisionMap) return;

		for (const [, entity] of this.world.collisionMap) {
			const gameEntity = entity as any;

			if (typeof gameEntity.getBehaviorRefs !== 'function') continue;

			const refs = gameEntity.getBehaviorRefs();
			const ricochetRef = refs.find(
				(r: any) => r.descriptor.key === Symbol.for('zylem:behavior:ricochet-2d')
			);

			if (!ricochetRef) continue;

			// Create FSM lazily on first update after spawn
			if (!ricochetRef.fsm) {
				ricochetRef.fsm = new Ricochet2DFSM();
				
				// Apply any pending listeners that were registered before FSM existed
				const pending = (ricochetRef as any).pendingListeners as RicochetCallback[] | undefined;
				if (pending) {
					for (const cb of pending) {
						ricochetRef.fsm.addListener(cb);
					}
					(ricochetRef as any).pendingListeners = [];
				}
			}

			// Sync current game time to FSM
			ricochetRef.fsm.setCurrentTimeMs(this.elapsedMs);
		}
	}

	destroy(_ecs: IWorld): void {
		if (!this.world?.collisionMap) return;

		for (const [, entity] of this.world.collisionMap) {
			const gameEntity = entity as any;
			if (typeof gameEntity.getBehaviorRefs !== 'function') continue;

			const refs = gameEntity.getBehaviorRefs();
			const ricochetRef = refs.find(
				(r: any) => r.descriptor.key === Symbol.for('zylem:behavior:ricochet-2d')
			);

			if (ricochetRef?.fsm) {
				ricochetRef.fsm.resetCooldown();
			}
		}
	}
}

/**
 * Ricochet2DBehavior
 *
 * @example
 * ```ts
 * import { Ricochet2DBehavior } from "@zylem/game-lib";
 *
 * const ball = createSphere({ ... });
 * const ricochet = ball.use(Ricochet2DBehavior, {
 *   minSpeed: 3,
 *   maxSpeed: 15,
 *   reflectionMode: 'angled',
 * });
 *
 * ball.onCollision(({ entity, other }) => {
 *   const velocity = entity.body.linvel();
 *   const result = ricochet.getRicochet({
 *     selfVelocity: velocity,
 *     contact: { normal: { x: 1, y: 0 } }, // from collision data
 *   });
 *
 *   if (result) {
 *     entity.body.setLinvel(result.velocity, true);
 *   }
 * });
 * ```
 */
export const Ricochet2DBehavior = defineBehavior({
	name: 'ricochet-2d',
	defaultOptions,
	systemFactory: (ctx) => new Ricochet2DSystem(ctx.world),
	createHandle: createRicochet2DHandle,
});
