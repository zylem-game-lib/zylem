import { Entity, GameEntity } from '../interfaces/Entity';
import RAPIER from '@dimforge/rapier3d-compat';

export class ZylemWorld implements Entity<ZylemWorld> {
	_type = 'World';
	world: RAPIER.World;
	collisionDictionary: Map<RAPIER.RigidBody, Entity<any>>;

	static async loadPhysics() {
		await RAPIER.init();
		const physicsWorld = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });

		return physicsWorld;
	}

	constructor(world: RAPIER.World) {
		this.world = world;
		this.collisionDictionary = new Map();
	}

	addEntity(entity: GameEntity<any>) {
		this.collisionDictionary.set(entity.body, entity);
	}

	setup() { }

	update(delta: number) {
		if (!this.world) {
			return;
		}
		// this.world.fixedStep();
	}

	destroy() { }

}