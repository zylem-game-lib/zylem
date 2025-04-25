import { Vector3 } from 'three';
import RAPIER, { World } from '@dimforge/rapier3d-compat';

import { Entity } from '../interfaces/entity';
import { StageEntity } from '../entities/stage-entity';
import { state$ } from '../state';
import { UpdateContext } from '../core/base-node-life-cycle';
import { ZylemActor } from '../entities/actor';

export class ZylemWorld implements Entity<ZylemWorld> {
	type = 'World';
	world: World;
	collisionMap: Map<string, Entity<any>> = new Map();
	collisionBehaviorMap: Map<string, Entity<any>> = new Map();
	_removalMap: Map<string, Entity<any>> = new Map();

	static async loadPhysics(gravity: Vector3) {
		await RAPIER.init();
		const physicsWorld = new RAPIER.World(gravity);
		return physicsWorld;
	}

	constructor(world: World) {
		this.world = world;
	}

	addEntity(entity: any) {
		const rigidBody = this.world.createRigidBody(entity.rigidBody);
		entity.body = rigidBody;
		entity.body.userData = { uuid: entity.uuid };
		let useSensor = false;
		if (this.world.gravity.x === 0 && this.world.gravity.y === 0 && this.world.gravity.z === 0) {
			entity.body.lockTranslations(true, true);
			entity.body.lockRotations(true, true);
		} else {
			useSensor = entity.sensor ?? false;
		}
		const collider = this.world.createCollider(entity.collider, entity.body);
		if (entity.controlledRotation || entity instanceof ZylemActor) {
			entity.body.lockRotations(true, true);
			entity.characterController = this.world.createCharacterController(0.01);
			entity.characterController.setUp({ x: 0.0, y: 1.0, z: 0.0 });
			entity.characterController.setMaxSlopeClimbAngle(45 * Math.PI / 180);
			entity.characterController.setMinSlopeSlideAngle(45 * Math.PI / 180);
			entity.characterController.enableSnapToGround(0.01);
			entity.collider = collider;
		}
		this.collisionMap.set(entity.uuid, entity);
	}

	setForRemoval(entity: any) {
		if (entity.body) {
			this._removalMap.set(entity.uuid, entity);
		}
	}

	destroyEntity(entity: StageEntity) {
		if (entity.collider) {
			this.world.removeCollider(entity.collider, true);
		}
		if (entity.body) {
			this.world.removeRigidBody(entity.body);
			this.collisionMap.delete(entity.uuid);
			this._removalMap.delete(entity.uuid);
		}
	}

	setup() { }

	update(params: UpdateContext<any>) {
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
			const gameEntity = collider as any;
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
			const gameEntity = collider as any;
			if (!gameEntity.body) {
				continue;
			}
			if (this._removalMap.get(gameEntity.uuid)) {
				this.destroyEntity(gameEntity);
				continue;
			}
			this.world.contactsWith(gameEntity.body.collider(0), (otherCollider) => {
				// @ts-ignore
				const uuid = otherCollider._parent.userData.uuid;
				const entity = dictionaryRef.get(uuid);
				if (!entity) {
					return;
				}
				if (entity._collision) {
					entity._collision(entity, gameEntity, state$.globals);
				}
			});
			this.world.intersectionsWith(gameEntity.body.collider(0), (otherCollider) => {
				// @ts-ignore
				const uuid = otherCollider._parent.userData.uuid;
				const entity = dictionaryRef.get(uuid);
				if (!entity) {
					return;
				}
				if (entity._collision) {
					entity._collision(entity, gameEntity, state$.globals);
				}
				// @ts-ignore
				if (entity._internalCollisionBehavior) {
					// @ts-ignore
					entity._internalCollisionBehavior({ entity, other: gameEntity, delta });
					this.collisionBehaviorMap.set(uuid, entity);
				}
			});
		}
	}

	destroy() { }

}