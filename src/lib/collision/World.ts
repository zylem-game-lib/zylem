import { Vector3 } from 'three';
import { Entity, GameEntity } from '../interfaces/entity';
import { gameState } from '../state';
import RAPIER from '@dimforge/rapier3d-compat';

export class ZylemWorld implements Entity<ZylemWorld> {
	_type = 'World';
	world: RAPIER.World;
	collisionDictionary: Map<number, Entity<any>>;

	static async loadPhysics(gravity: Vector3) {
		await RAPIER.init();
		const physicsWorld = new RAPIER.World(gravity);
		return physicsWorld;
	}

	constructor(world: RAPIER.World) {
		this.world = world;
		this.collisionDictionary = new Map();
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
		this.collisionDictionary.set(entity.body.handle, entity);
	}

	setup() { }

	update(delta: number) {
		if (!this.world) {
			return;
		}
		this.updateColliders();
		this.world.step();
	}

	updateColliders() {
		const dictionaryRef = this.collisionDictionary;
		for (let [, collider] of dictionaryRef) {
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
			});
		}
	}

	destroy() { }

}