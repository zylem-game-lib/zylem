/**
 * ThrusterMovementBehavior
 * 
 * This is the heart of the thruster movement system - a pure, stateless force generator.
 * Works identically for player, AI, and replay.
 */

import type { ZylemWorld } from '../../collision/world';
import type { PhysicsBodyComponent } from '../components';
import type { ThrusterMovementComponent, ThrusterInputComponent } from './components';
import {
	getRotationAngle2D,
	normalizeDirection2D,
} from '../shared/direction-2d';

/**
 * Zylem-style Behavior interface
 */
export interface Behavior {
	update(dt: number): void;
}

/**
 * Entity with thruster components
 */
export interface ThrusterEntity {
	physics: PhysicsBodyComponent;
	thruster: ThrusterMovementComponent;
	$thruster: ThrusterInputComponent;
}

/**
 * ThrusterMovementBehavior - Force generator for thruster-equipped entities
 * 
 * Responsibilities:
 * - Query entities with PhysicsBody, ThrusterMovement, and ThrusterInput components
 * - Apply velocities based on thrust input (2D mode)
 * - Apply angular velocity based on rotation input
 */
export class ThrusterMovementBehavior implements Behavior {
	constructor(private world: ZylemWorld) {}

	/**
	 * Update a single thruster-enabled entity.
	 */
	updateEntity(gameEntity: any, _dt: number): void {
		if (!gameEntity.physics?.body || !gameEntity.thruster || !gameEntity.$thruster) {
			return;
		}

		const e: ThrusterEntity = {
			physics: gameEntity.physics,
			thruster: gameEntity.thruster,
			$thruster: gameEntity.$thruster,
		};

		const body = e.physics.body;
		const thruster = e.thruster;
		const input = e.$thruster;

		if (thruster.linearDamping != null && typeof body.setLinearDamping === 'function') {
			body.setLinearDamping(thruster.linearDamping);
		}

		// Get Z rotation from quaternion (for 2D sprites)
		const rotationZ = getRotationAngle2D(body.rotation());
		const currentVel = body.linvel();
		const vectorThrust = normalizeDirection2D(input.thrustX, input.thrustY);

		// --- Linear thrust ---
		if (vectorThrust) {
			const thrustScale = Math.min(1, Math.hypot(input.thrustX, input.thrustY));
			const thrustAmount = thruster.linearThrust * thrustScale * 0.1;
			body.setLinvel({
				x: currentVel.x + vectorThrust.x * thrustAmount,
				y: currentVel.y + vectorThrust.y * thrustAmount,
				z: currentVel.z,
			}, true);
		} else if (input.thrust !== 0) {
			const forwardX = Math.sin(-rotationZ);
			const forwardY = Math.cos(-rotationZ);
			const thrustAmount = thruster.linearThrust * input.thrust * 0.1;
			body.setLinvel({
				x: currentVel.x + forwardX * thrustAmount,
				y: currentVel.y + forwardY * thrustAmount,
				z: currentVel.z
			}, true);
		}

		// --- Angular thrust (Z-axis for 2D) ---
		if (input.rotate !== 0) {
			body.setAngvel({ x: 0, y: 0, z: -thruster.angularThrust * input.rotate }, true);
		} else {
			// Stop rotation when no input
			const angVel = body.angvel();
			body.setAngvel({ x: angVel.x, y: angVel.y, z: 0 }, true);
		}
	}

	update(dt: number): void {
		if (!this.world?.collisionMap) return;
		for (const [, entity] of this.world.collisionMap) {
			this.updateEntity(entity, dt);
		}
	}
}
