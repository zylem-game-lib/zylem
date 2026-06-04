/**
 * Platformer 3D Behavior Descriptor
 * 
 * Type-safe descriptor for the platformer 3D behavior system.
 * Provides entity.use() API for 3D platformer movement.
 */

import { defineBehavior } from '../behavior-descriptor';
import type { BehaviorEntityLink, BehaviorSystem } from '../behavior-system';
import { Platformer3DBehavior as Platformer3DMovementBehavior, Platformer3DEntity } from './platformer-3d.behavior';
import { Platformer3DFSM, Platformer3DState, PlatformerCollisionContext } from './platformer-3d-fsm';
import {
	createPlatformer3DMovementComponent,
	createPlatformer3DInputComponent,
	createPlatformer3DStateComponent,
} from './components';
import type { WasmStageRuntime } from '../../runtime/wasm-stage-runtime';

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
	/** Enable debug visualization for ground probe rays (default: false) */
	debugGroundProbe?: boolean;
}

const defaultOptions: Platformer3DBehaviorOptions = {
	walkSpeed: 12,
	runSpeed: 24,
	jumpForce: 12,
	maxJumps: 1,
	gravity: 9.82,
	groundRayLength: 1.0,
	debugGroundProbe: false,
};

const PLATFORMER_BEHAVIOR_KEY = Symbol.for('zylem:behavior:platformer-3d');

/**
 * Adapter that wraps Platformer3DBehavior as a BehaviorSystem
 */
class Platformer3DBehaviorSystem implements BehaviorSystem {
	private movementBehavior: Platformer3DMovementBehavior;
	private attachedRuntimeSlots = new Set<number>();

	constructor(
		private world: any,
		private scene: any,
		private wasmStage: WasmStageRuntime | null,
		private getBehaviorLinks?: (key: symbol) => Iterable<BehaviorEntityLink>,
	) {
		this.movementBehavior = new Platformer3DMovementBehavior(world, scene);
	}

	update(_ecs: unknown, delta: number): void {
		const links = this.getBehaviorLinks?.(PLATFORMER_BEHAVIOR_KEY);
		if (!links) return;

		for (const link of links) {
			const gameEntity = link.entity as any;
			const platformerRef = link.ref as any;

			const options = platformerRef.options as Platformer3DBehaviorOptions;

			if (!gameEntity.platformer) {
				gameEntity.platformer = createPlatformer3DMovementComponent(options);
			}
			if (!gameEntity.$platformer) {
				gameEntity.$platformer = createPlatformer3DInputComponent();
			}
			if (!gameEntity.platformerState) {
				gameEntity.platformerState = createPlatformer3DStateComponent();
			}

			if (!platformerRef.fsm && gameEntity.$platformer && gameEntity.platformerState) {
				platformerRef.fsm = new Platformer3DFSM({
					input: gameEntity.$platformer,
					state: gameEntity.platformerState,
				});
			}
			if (platformerRef.fsm && gameEntity.$platformer && gameEntity.platformerState) {
				platformerRef.fsm.update(gameEntity.$platformer, gameEntity.platformerState);
			}

			const handle = (gameEntity.runtimeHandle ?? -1) as number;
			if (this.wasmStage && handle >= 0) {
				this.ensureWasmAttached(handle, options);
				const input = gameEntity.$platformer;
				if (input) {
					this.wasmStage.setPlatformer3DInputAxes(handle, input.moveX ?? 0, input.moveZ ?? 0);
					this.wasmStage.setPlatformer3DInputButtons(handle, !!input.jump, !!input.run);
				}
				continue;
			}

			if (!gameEntity.body) continue;
			this.movementBehavior.updateEntity(gameEntity, delta);
		}
	}

	private ensureWasmAttached(handle: number, options: Platformer3DBehaviorOptions): void {
		if (!this.wasmStage || this.attachedRuntimeSlots.has(handle)) return;
		this.wasmStage.attachPlatformer3D(handle, {
			halfHeight: 0.9,
			radius: 0.4,
			walkSpeed: options.walkSpeed ?? defaultOptions.walkSpeed!,
			runSpeed: options.runSpeed ?? defaultOptions.runSpeed!,
			jumpForce: options.jumpForce ?? defaultOptions.jumpForce!,
			maxJumps: options.maxJumps ?? defaultOptions.maxJumps!,
			gravity: options.gravity ?? defaultOptions.gravity!,
		});
		this.attachedRuntimeSlots.add(handle);
	}

	destroy(_ecs: unknown): void {
		this.movementBehavior.destroy();
		this.attachedRuntimeSlots.clear();
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
 * import { Platformer3DBehavior } from "@zylem/game-lib/behavior";
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
	systemFactory: (ctx) =>
		new Platformer3DBehaviorSystem(
			ctx.world,
			ctx.scene,
			ctx.wasmStage ?? null,
			ctx.getBehaviorLinks,
		),
	createHandle: (ref) => ({
		getState: () => ref.fsm?.getState() ?? Platformer3DState.Idle,
		isGrounded: () => ref.fsm?.isGrounded() ?? false,
		getJumpCount: () => ref.fsm?.getJumpCount() ?? 0,
		onPlatformCollision: (ctx) => ref.fsm?.handleCollision(ctx),
	}),
});
