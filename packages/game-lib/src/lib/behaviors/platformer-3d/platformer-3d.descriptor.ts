/**
 * Platformer 3D Behavior Descriptor
 * 
 * Type-safe descriptor for the platformer 3D behavior system.
 * Provides entity.use() API for 3D platformer movement.
 */

import type { IWorld } from 'bitecs';
import { defineBehavior } from '../behavior-descriptor';
import type { BehaviorSystem } from '../behavior-system';
import { Platformer3DBehavior as Platformer3DMovementBehavior, Platformer3DEntity } from './platformer-3d.behavior';
import { Platformer3DFSM, Platformer3DState, PlatformerCollisionContext } from './platformer-3d-fsm';
import {
	createPlatformer3DMovementComponent,
	createPlatformer3DInputComponent,
	createPlatformer3DStateComponent,
} from './components';

/**
 * Platformer behavior options (typed for entity.use() autocomplete)
 */
export interface Platformer3DBehaviorOptions {
	/** Base walking speed (default: 12) */
	walkSpeed?: number;
	/** Sprint/run speed (default: 24) */
	runSpeed?: number;
	/** Initial jump force (default: 12) */
	jumpForce?: number;
	/** Maximum number of jumps (default: 1) */
	maxJumps?: number;
	/** Gravity force (default: 9.82) */
	gravity?: number;
	/** Ray length for ground detection (default: 1.0) */
	groundRayLength?: number;
}

const defaultOptions: Platformer3DBehaviorOptions = {
	walkSpeed: 12,
	runSpeed: 24,
	jumpForce: 12,
	maxJumps: 1,
	gravity: 9.82,
	groundRayLength: 1.0,
};

/**
 * Adapter that wraps Platformer3DBehavior as a BehaviorSystem
 */
class Platformer3DBehaviorSystem implements BehaviorSystem {
	private movementBehavior: Platformer3DMovementBehavior;

	constructor(private world: any, private scene: any) {
		this.movementBehavior = new Platformer3DMovementBehavior(world, scene);
	}

	update(ecs: IWorld, delta: number): void {
		if (!this.world?.collisionMap) return;

		// Initialize ECS components on entities with platformer behavior refs
		for (const [, entity] of this.world.collisionMap) {
			const gameEntity = entity as any;

			if (typeof gameEntity.getBehaviorRefs !== 'function') continue;

			const refs = gameEntity.getBehaviorRefs();
			const platformerRef = refs.find((r: any) =>
				r.descriptor.key === Symbol.for('zylem:behavior:platformer-3d')
			);

			if (!platformerRef || !gameEntity.body) continue;

			const options = platformerRef.options as Platformer3DBehaviorOptions;

			// Ensure entity has platformer components (initialized once)
			if (!gameEntity.platformer) {
				gameEntity.platformer = createPlatformer3DMovementComponent(options);
			}

			if (!gameEntity.$platformer) {
				gameEntity.$platformer = createPlatformer3DInputComponent();
			}

			if (!gameEntity.platformerState) {
				gameEntity.platformerState = createPlatformer3DStateComponent();
			}

			// Create FSM lazily and attach to the BehaviorRef
			if (!platformerRef.fsm && gameEntity.$platformer && gameEntity.platformerState) {
				platformerRef.fsm = new Platformer3DFSM({
					input: gameEntity.$platformer,
					state: gameEntity.platformerState,
				});
			}

			// Update FSM to sync state with physics
			if (platformerRef.fsm && gameEntity.$platformer && gameEntity.platformerState) {
				platformerRef.fsm.update(gameEntity.$platformer, gameEntity.platformerState);
			}
		}

		// Delegate to the movement behavior
		this.movementBehavior.update(delta);
	}

	destroy(_ecs: IWorld): void {
		this.movementBehavior.destroy();
	}
}

/**
 * Platformer3DBehavior - typed descriptor for 3D platformer movement
 * 
 * Provides complete 3D platformer physics including:
 * - Walking and running
 * - Jumping with multi-jump support
 * - Gravity and falling
 * - Ground detection
 * 
 * @example
 * ```typescript
 * import { Platformer3DBehavior } from "@zylem/game-lib";
 * 
 * const player = await playgroundActor('player');
 * const platformer = player.use(Platformer3DBehavior, {
 *   walkSpeed: 12,
 *   runSpeed: 24,
 *   jumpForce: 12,
 *   maxJumps: 2, // Double jump!
 * });
 * 
 * // In update loop
 * player.onUpdate(({ inputs }) => {
 *   player.$platformer.moveX = inputs.p1.axes.Horizontal.value;
 *   player.$platformer.moveZ = inputs.p1.axes.Vertical.value;
 *   player.$platformer.jump = inputs.p1.buttons.A.held > 0;
 *   player.$platformer.run = inputs.p1.shoulders.LTrigger.held > 0;
 *   
 *   const state = platformer.getState();
 *   const grounded = platformer.isGrounded();
 * });
 * ```
 */
export const Platformer3DBehavior = defineBehavior<
	Platformer3DBehaviorOptions,
	{
		getState: () => Platformer3DState;
		isGrounded: () => boolean;
		getJumpCount: () => number;
		onPlatformCollision: (ctx: PlatformerCollisionContext) => void;
	},
	Platformer3DEntity
>({
	name: 'platformer-3d',
	defaultOptions,
	systemFactory: (ctx) => new Platformer3DBehaviorSystem(ctx.world, ctx.scene),
	createHandle: (ref) => ({
		getState: () => ref.fsm?.getState() ?? Platformer3DState.Idle,
		isGrounded: () => ref.fsm?.isGrounded() ?? false,
		getJumpCount: () => ref.fsm?.getJumpCount() ?? 0,
		onPlatformCollision: (ctx) => ref.fsm?.handleCollision(ctx),
	}),
});
