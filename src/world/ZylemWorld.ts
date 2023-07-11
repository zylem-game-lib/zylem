import { Entity, GameEntity } from '../interfaces/Entity';
import * as CANNON from 'cannon-es';


export class ZylemWorld implements Entity<ZylemWorld> {
	_type = 'World';
	world: CANNON.World;
	collisionDictionary: Map<CANNON.Body, Entity<any>>;

	constructor() {
		this.world = new CANNON.World({
			// gravity: new CANNON.Vec3(0, -9.82, 0),
			gravity: new CANNON.Vec3(0, 0, 0),
		});
		this.collisionDictionary = new Map();
	}

	addEntity(entity: GameEntity<any>) {
		this.world.addBody(entity.body);
		if (entity.constraintBodies) {
			entity.constraintBodies.forEach(body => {
				this.world.addBody(body);
			});
			entity.constraints?.forEach(constraint => {
				this.world.addConstraint(constraint);
			});
		}
		this.collisionDictionary.set(entity.body, entity);
		entity.body.addEventListener('collide', (event: { body: any; contact: any; }) => {
			const myEntity = this.collisionDictionary.get(event.body);
			const otherEntity = this.collisionDictionary.get(event.contact.sj.body);
			if (myEntity && myEntity._collision) {
				myEntity._collision(myEntity, otherEntity);
			}
		});
	}

	setup() { }

	update(delta: number) {
		if (!this.world) {
			return;
		}
		this.world.fixedStep();
	}

	destroy() { }

}