/**
 * PhysicsSyncBehavior
 * 
 * Syncs physics state (position, rotation) from Rapier bodies to ECS TransformComponents.
 * This is what keeps Three.js honest - rendering reads from TransformComponent.
 */

import type { ZylemWorld } from '../collision/world';
import type { TransformComponent, PhysicsBodyComponent } from './components';
import type { Behavior } from './thruster/thruster-movement.behavior';

/**
 * Entity with physics body and transform components
 */
interface PhysicsSyncEntity {
	physics: PhysicsBodyComponent;
	transform: TransformComponent;
}

/**
 * PhysicsSyncBehavior - Physics → ECS sync
 * 
 * Responsibilities:
 * - Query entities with PhysicsBodyComponent and TransformComponent
 * - Copy position from body.translation() to transform.position
 * - Copy rotation from body.rotation() to transform.rotation
 * 
 * This runs AFTER PhysicsStepBehavior, before rendering.
 */
export class PhysicsSyncBehavior implements Behavior {
	constructor(private world: ZylemWorld) {}

	/**
	 * Query entities that have both physics body and transform components
	 */
	private queryEntities(): PhysicsSyncEntity[] {
		const entities: PhysicsSyncEntity[] = [];
		
		for (const [, entity] of this.world.collisionMap) {
			const gameEntity = entity as any;
			if (gameEntity.physics?.body && gameEntity.transform) {
				entities.push({
					physics: gameEntity.physics,
					transform: gameEntity.transform,
				});
			}
		}
		
		return entities;
	}

	update(_dt: number): void {
		const entities = this.queryEntities();

		for (const e of entities) {
			const body = e.physics.body;
			const transform = e.transform;

			// Sync position
			const p = body.translation();
			transform.position.set(p.x, p.y, p.z);

			// Sync rotation
			const r = body.rotation();
			transform.rotation.set(r.x, r.y, r.z, r.w);
		}
	}
}
