import { Entity, GameEntity } from '../interfaces/Entity';
import { gameState } from '../state';
import RAPIER from '@dimforge/rapier3d-compat';

export class ZylemWorld implements Entity<ZylemWorld> {
	_type = 'World';
	world: RAPIER.World;
	collisionDictionary: Map<number, Entity<any>>;

	static async loadPhysics() {
		await RAPIER.init();
		const physicsWorld = new RAPIER.World({ x: 0.0, y: 0.0, z: 0.0 });

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
		// entity.body.setEnabledRotations(false, false, true, true);
		entity.body.lockTranslations(true, true);
		const colliderDesc = entity.createCollider();
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
			})
		}
	}

	destroy() { }

}