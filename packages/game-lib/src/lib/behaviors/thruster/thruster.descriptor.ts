/**
 * Thruster Behavior Descriptor
 * 
 * Type-safe descriptor for the thruster behavior system using the new entity.use() API.
 * This wraps the existing ThrusterMovementBehavior and components.
 */

import type { IWorld } from 'bitecs';
import { defineBehavior } from '../behavior-descriptor';
import type { BehaviorSystem } from '../behavior-system';
import { ThrusterMovementBehavior } from './thruster-movement.behavior';
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

	constructor(private world: any) {
		this.movementBehavior = new ThrusterMovementBehavior(world);
	}

	update(ecs: IWorld, delta: number): void {
		if (!this.world?.collisionMap) return;

		// Initialize ECS components on entities with thruster behavior refs
		for (const [, entity] of this.world.collisionMap) {
			const gameEntity = entity as any;
			
			if (typeof gameEntity.getBehaviorRefs !== 'function') continue;
			
			const refs = gameEntity.getBehaviorRefs();
			const thrusterRef = refs.find((r: any) => 
				r.descriptor.key === Symbol.for('zylem:behavior:thruster')
			);
			
			if (!thrusterRef || !gameEntity.body) continue;

			const options = thrusterRef.options as ThrusterBehaviorOptions;

			// Ensure entity has thruster components (initialized once)
			if (!gameEntity.thruster) {
				gameEntity.thruster = {
					linearThrust: options.linearThrust,
					angularThrust: options.angularThrust,
				} as ThrusterMovementComponent;
			}

			if (!gameEntity.input) {
				gameEntity.input = {
					thrust: 0,
					rotate: 0,
				} as ThrusterInputComponent;
			}

			if (!gameEntity.physics) {
				gameEntity.physics = { body: gameEntity.body };
			}

			// Create FSM lazily and attach to the BehaviorRef for handle.getFSM()
			if (!thrusterRef.fsm && gameEntity.input) {
				thrusterRef.fsm = new ThrusterFSM({ input: gameEntity.input });
			}

			// Update FSM to sync state with input (auto-transitions)
			if (thrusterRef.fsm && gameEntity.input) {
				thrusterRef.fsm.update({
					thrust: gameEntity.input.thrust,
					rotate: gameEntity.input.rotate,
				});
			}
		}

		// Delegate to the existing movement behavior
		this.movementBehavior.update(delta);
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
export const ThrusterBehavior = defineBehavior({
	name: 'thruster',
	defaultOptions,
	systemFactory: (ctx) => new ThrusterBehaviorSystem(ctx.world),
});
