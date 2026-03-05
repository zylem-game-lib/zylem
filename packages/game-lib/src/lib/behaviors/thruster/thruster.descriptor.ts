/**
 * Thruster Behavior Descriptor
 * 
 * Type-safe descriptor for the thruster behavior system using the new entity.use() API.
 * This wraps the existing ThrusterMovementBehavior and components.
 */

import type { IWorld } from 'bitecs';
import { defineBehavior } from '../behavior-descriptor';
import type { BehaviorEntityLink, BehaviorSystem } from '../behavior-system';
import { ThrusterMovementBehavior, ThrusterEntity } from './thruster-movement.behavior';
import { ThrusterFSM } from './thruster-fsm';
import type { ThrusterMovementComponent, ThrusterInputComponent } from './components';

/**
 * Thruster behavior options (typed for entity.use() autocomplete)
 */
export interface ThrusterBehaviorOptions {
	/** Forward thrust force (default: 10) */
	linearThrust: number;
	/** Rotation torque (default: 5) */
	angularThrust: number;
}

const defaultOptions: ThrusterBehaviorOptions = {
	linearThrust: 10,
	angularThrust: 5,
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

	constructor(
		private world: any,
		private getBehaviorLinks?: (key: symbol) => Iterable<BehaviorEntityLink>,
	) {
		this.movementBehavior = new ThrusterMovementBehavior(world);
	}

	update(_ecs: IWorld, delta: number): void {
		const links = this.getBehaviorLinks?.(THRUSTER_BEHAVIOR_KEY);
		if (!links) return;

		for (const link of links) {
			const gameEntity = link.entity as any;
			const thrusterRef = link.ref as any;
			if (!gameEntity.body) continue;

			const options = thrusterRef.options as ThrusterBehaviorOptions;

			// Ensure entity has thruster components (initialized once)
			if (!gameEntity.thruster) {
				gameEntity.thruster = {
					linearThrust: options.linearThrust,
					angularThrust: options.angularThrust,
				} as ThrusterMovementComponent;
			}

			if (!gameEntity.$thruster) {
				gameEntity.$thruster = {
					thrust: 0,
					rotate: 0,
				} as ThrusterInputComponent;
			}

			if (!gameEntity.physics) {
				gameEntity.physics = { body: gameEntity.body };
			}

			// Create FSM lazily and attach to the BehaviorRef for handle.getFSM()
			if (!thrusterRef.fsm && gameEntity.$thruster) {
				thrusterRef.fsm = new ThrusterFSM({ input: gameEntity.$thruster });
			}

			// Update FSM to sync state with input (auto-transitions)
			if (thrusterRef.fsm && gameEntity.$thruster) {
				thrusterRef.fsm.update({
					thrust: gameEntity.$thruster.thrust,
					rotate: gameEntity.$thruster.rotate,
				});
			}

			this.movementBehavior.updateEntity(gameEntity, delta);
		}
	}

	destroy(_ecs: IWorld): void {
		// Cleanup if needed
	}
}

/**
 * ThrusterBehavior - typed descriptor for thruster movement.
 * 
 * Uses the existing ThrusterMovementBehavior under the hood.
 * 
 * @example
 * ```typescript
 * import { ThrusterBehavior } from "@zylem/game-lib";
 * 
 * const ship = createSprite({ ... });
 * ship.use(ThrusterBehavior, { linearThrust: 15, angularThrust: 8 });
 * ```
 */
export const ThrusterBehavior = defineBehavior<ThrusterBehaviorOptions, Record<string, never>, ThrusterEntity>({
	name: 'thruster',
	defaultOptions,
	systemFactory: (ctx) =>
		new ThrusterBehaviorSystem(ctx.world, ctx.getBehaviorLinks),
});
