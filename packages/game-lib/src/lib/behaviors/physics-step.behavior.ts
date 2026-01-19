/**
 * PhysicsStepBehavior
 * 
 * Single authoritative place where Rapier advances.
 * Runs after all force-producing behaviors.
 */

import type { World } from '@dimforge/rapier3d-compat';
import type { Behavior } from './thruster/thruster-movement.behavior';

/**
 * PhysicsStepBehavior - Authoritative physics step
 * 
 * This behavior is responsible for advancing the Rapier physics simulation.
 * It should run AFTER all force-producing behaviors (like ThrusterMovementBehavior).
 */
export class PhysicsStepBehavior implements Behavior {
	constructor(private physicsWorld: World) {}

	update(dt: number): void {
		this.physicsWorld.timestep = dt;
		this.physicsWorld.step();
	}
}
