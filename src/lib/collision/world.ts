import { Vector3 } from 'three';
import { Entity, GameEntity } from '../interfaces/entity';
import { gameState } from '../state';
import RAPIER from '@dimforge/rapier3d-compat';
import { UpdateParameters } from '../core/entity';

export class ZylemWorld implements Entity<ZylemWorld> {
	_type = 'World';
	world: RAPIER.World;
	collisionMap: Map<number, Entity<any>> = new Map();
	collisionBehaviorMap: Map<number, Entity<any>> = new Map();

	static async loadPhysics(gravity: Vector3) {
		await RAPIER.init();
		const physicsWorld = new RAPIER.World(gravity);
		return physicsWorld;
	}

	constructor(world: RAPIER.World) {
		this.world = world;
	}

	addEntity(entity: GameEntity<any>) {
		const rigidBody = this.world.createRigidBody(entity.bodyDescription);
		entity.body = rigidBody;
		entity.body.lockRotations(true, true);
		let useSensor = false;
		if (this.world.gravity.x === 0 && this.world.gravity.y === 0 && this.world.gravity.z === 0) {
			entity.body.lockTranslations(true, true);
		} else {
			useSensor = entity.sensor ?? false;
		}
		const colliderDesc = entity.createCollider(useSensor);
		this.world.createCollider(colliderDesc, entity.body);
		this.collisionMap.set(entity.body.handle, entity);
	}

	setup() { }

	update(params: UpdateParameters<any>) {
		const { delta } = params;
		if (!this.world) {
			return;
		}
		this.updateColliders(delta);
		this.updatePostCollisionBehaviors(delta);
		this.world.step();
	}

	updatePostCollisionBehaviors(delta: number) {
		const dictionaryRef = this.collisionBehaviorMap;
		for (let [id, collider] of dictionaryRef) {
			const gameEntity = collider as GameEntity<any>;
			// @ts-ignore
			if (!gameEntity._internalPostCollisionBehavior) {
				return;
			}
			// @ts-ignore
			const active = gameEntity._internalPostCollisionBehavior({ entity: gameEntity, delta });
			if (!active) {
				this.collisionBehaviorMap.delete(id);
			}
		}
	}

	updateColliders(delta: number) {
		const dictionaryRef = this.collisionMap;
		for (let [id, collider] of dictionaryRef) {
			const gameEntity = collider as GameEntity<any>;
			if (!gameEntity.body) {
				continue;
			}
			this.world.contactsWith(gameEntity.body.collider(0), (otherCollider) => {
				const entity = dictionaryRef.get(otherCollider.handle);
				if (!entity) {
					return;
				}
				if (entity._collision) {
					entity._collision(entity, gameEntity, { gameState });
				}
			});
			this.world.intersectionsWith(gameEntity.body.collider(0), (otherCollider) => {
				const entity = dictionaryRef.get(otherCollider.handle);
				if (!entity) {
					return;
				}
				if (entity._collision) {
					entity._collision(entity, gameEntity, { gameState });
				}
				// @ts-ignore
				if (entity._internalCollisionBehavior) {
					// @ts-ignore
					entity._internalCollisionBehavior({ entity, other: gameEntity, delta });
					this.collisionBehaviorMap.set(otherCollider.handle, entity);
				}
			});
		}
	}

	destroy() { }

}