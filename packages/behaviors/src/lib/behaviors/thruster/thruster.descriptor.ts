/**
 * Thruster Behavior Descriptor
 * 
 * Type-safe descriptor for the thruster behavior system using the new entity.use() API.
 * This wraps the existing ThrusterMovementBehavior and components.
 */

import { defineBehavior } from '../behavior-descriptor';
import type { BehaviorEntityLink, BehaviorSystem } from '../behavior-system';
import { ThrusterMovementBehavior, ThrusterEntity } from './thruster-movement.behavior';
import { ThrusterFSM } from './thruster-fsm';
import {
	createThrusterInputComponent,
	createThrusterMovementComponent,
	type ThrusterMovementComponent,
	type ThrusterInputComponent,
} from './components';
import type { WasmStageRuntime } from '../../runtime/wasm-stage-runtime';

/**
 * Thruster behavior options (typed for entity.use() autocomplete)
 */
export interface ThrusterBehaviorOptions {
	/** Forward thrust force (default: 10) */
	linearThrust: number;
	/** Rotation torque (default: 5) */
	angularThrust: number;
	/** Optional linear damping override */
	linearDamping?: number;
}

const defaultOptions: ThrusterBehaviorOptions = {
	linearThrust: 10,
	angularThrust: 5,
	linearDamping: undefined,
};

const THRUSTER_BEHAVIOR_KEY = Symbol.for('zylem:behavior:thruster');

/**
 * Adapter that wraps ThrusterMovementBehavior as a BehaviorSystem.
 * 
 * This bridges the entity.use() pattern with the ECS component-based approach:
 * - Reads options from entity behaviorRefs
 * - Initializes ThrusterMovementComponent and ThrusterInputComponent on entities
 * - Creates FSM lazily and attaches to BehaviorRef for access via handle.getFSM()
 * - Delegates physics to ThrusterMovementBehavior
 * 
 * NOTE: Input is controlled by the user via entity.onUpdate() - set entity.input.thrust/rotate
 */
class ThrusterBehaviorSystem implements BehaviorSystem {
	private movementBehavior: ThrusterMovementBehavior;
	private attachedRuntimeSlots = new Set<number>();

	constructor(
		private world: any,
		private wasmStage: WasmStageRuntime | null,
		private getBehaviorLinks?: (key: symbol) => Iterable<BehaviorEntityLink>,
	) {
		this.movementBehavior = new ThrusterMovementBehavior(world);
	}

	update(_ecs: unknown, delta: number): void {
		const links = this.getBehaviorLinks?.(THRUSTER_BEHAVIOR_KEY);
		if (!links) return;

		for (const link of links) {
			const gameEntity = link.entity as any;
			const thrusterRef = link.ref as any;

			const options = thrusterRef.options as ThrusterBehaviorOptions;

			if (!gameEntity.thruster) {
				gameEntity.thruster = createThrusterMovementComponent(
					options.linearThrust,
					options.angularThrust,
					{ linearDamping: options.linearDamping },
				) as ThrusterMovementComponent;
			}

			if (!gameEntity.$thruster) {
				gameEntity.$thruster = createThrusterInputComponent() as ThrusterInputComponent;
			}

			if (!thrusterRef.fsm && gameEntity.$thruster) {
				thrusterRef.fsm = new ThrusterFSM({ input: gameEntity.$thruster });
			}

			if (thrusterRef.fsm && gameEntity.$thruster) {
				thrusterRef.fsm.update({
					thrust: gameEntity.$thruster.thrust,
					rotate: gameEntity.$thruster.rotate,
					thrustX: gameEntity.$thruster.thrustX,
					thrustY: gameEntity.$thruster.thrustY,
				});
			}

			const handle = (gameEntity.runtimeHandle ?? -1) as number;
			if (this.wasmStage && handle >= 0) {
				this.ensureWasmAttached(handle, options);
				const input = gameEntity.$thruster as ThrusterInputComponent | undefined;
				if (input) {
					this.wasmStage.setThrusterInput(handle, input.thrust, input.rotate);
				}
				continue;
			}

			if (!gameEntity.body) continue;
			if (!gameEntity.physics) {
				gameEntity.physics = { body: gameEntity.body };
			}
			this.movementBehavior.updateEntity(gameEntity, delta);
		}
	}

	private ensureWasmAttached(handle: number, options: ThrusterBehaviorOptions): void {
		if (!this.wasmStage || this.attachedRuntimeSlots.has(handle)) return;
		this.wasmStage.attachThruster(handle, {
			maxSpeed: 50,
			acceleration: options.linearThrust,
			turnRateRadPerSec: options.angularThrust,
			linearDamping: options.linearDamping ?? 0,
		});
		this.attachedRuntimeSlots.add(handle);
	}

	destroy(_ecs: unknown): void {
		this.attachedRuntimeSlots.clear();
	}
}

/**
 * ThrusterBehavior - typed descriptor for thruster movement.
 * 
 * Uses the existing ThrusterMovementBehavior under the hood.
 * 
 * @example
 * ```typescript
 * import { ThrusterBehavior } from "@zylem/game-lib/behavior";
 * 
 * const ship = createSprite({ ... });
 * ship.use(ThrusterBehavior, { linearThrust: 15, angularThrust: 8 });
 * ```
 */
export const ThrusterBehavior = defineBehavior<ThrusterBehaviorOptions, Record<string, never>, ThrusterEntity>({
	name: 'thruster',
	defaultOptions,
	systemFactory: (ctx) =>
		new ThrusterBehaviorSystem(ctx.world, ctx.wasmStage ?? null, ctx.getBehaviorLinks),
});
