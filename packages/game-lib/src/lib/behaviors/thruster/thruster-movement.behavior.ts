/**
 * ThrusterMovementBehavior
 * 
 * This is the heart of the thruster movement system - a pure, stateless force generator.
 * Works identically for player, AI, and replay.
 */

import type { ZylemWorld } from '../../collision/world';
import type { PhysicsBodyComponent } from '../components';
import type { ThrusterMovementComponent, ThrusterInputComponent } from './components';

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
	input: ThrusterInputComponent;
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
	 * Query function - returns entities with required thruster components
	 */
	private queryEntities(): ThrusterEntity[] {
		const entities: ThrusterEntity[] = [];
		
		for (const [, entity] of this.world.collisionMap) {
			const gameEntity = entity as any;
			if (
				gameEntity.physics?.body &&
				gameEntity.thruster &&
				gameEntity.input
			) {
				entities.push({
					physics: gameEntity.physics,
					thruster: gameEntity.thruster,
					input: gameEntity.input,
				});
			}
		}
		
		return entities;
	}

	update(_dt: number): void {
		const entities = this.queryEntities();

		for (const e of entities) {
			const body = e.physics.body;
			const thruster = e.thruster;
			const input = e.input;

			// Get Z rotation from quaternion (for 2D sprites)
			const q = body.rotation();
			const rotationZ = Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z));

			// --- Linear thrust (Asteroids-style: adds velocity in forward direction) ---
			if (input.thrust !== 0) {
				const currentVel = body.linvel();
				
				if (input.thrust > 0) {
					// Forward thrust: add velocity in facing direction
					const forwardX = Math.sin(-rotationZ);
					const forwardY = Math.cos(-rotationZ);
					const thrustAmount = thruster.linearThrust * input.thrust * 0.1;
					body.setLinvel({
						x: currentVel.x + forwardX * thrustAmount,
						y: currentVel.y + forwardY * thrustAmount,
						z: currentVel.z
					}, true);
				} else {
					// Brake: reduce current velocity (slow down)
					const brakeAmount = 0.9; // 10% reduction per frame
					body.setLinvel({
						x: currentVel.x * brakeAmount,
						y: currentVel.y * brakeAmount,
						z: currentVel.z
					}, true);
				}
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
	}
}

