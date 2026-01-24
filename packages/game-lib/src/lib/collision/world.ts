import { Vector3 } from 'three';
import RAPIER, { World } from '@dimforge/rapier3d-compat';

import { Entity } from '../interfaces/entity';
import { state } from '../game/game-state';
import { UpdateContext } from '../core/base-node-life-cycle';
import { ZylemActor } from '../entities/actor';
import { GameEntity } from '../entities/entity';

/**
 * Interface for entities that handle collision events.
 */
export interface CollisionHandlerDelegate {
	handlePostCollision(params: any): boolean;
	handleIntersectionEvent(params: any): void;
}

/**
 * Type guard to check if an object implements CollisionHandlerDelegate.
 */
export function isCollisionHandlerDelegate(obj: any): obj is CollisionHandlerDelegate {
	return typeof obj?.handlePostCollision === "function" && typeof obj?.handleIntersectionEvent === "function";
}

export class ZylemWorld implements Entity<ZylemWorld> {
	type = 'World';
	world: World;
	collisionMap: Map<string, GameEntity<any>> = new Map();
	collisionBehaviorMap: Map<string, GameEntity<any>> = new Map();
	_removalMap: Map<string, GameEntity<any>> = new Map();

	static async loadPhysics(gravity: Vector3) {
		await RAPIER.init();
		const physicsWorld = new RAPIER.World(gravity);
		return physicsWorld;
	}

	constructor(world: World) {
		this.world = world;
	}

	addEntity(entity: any) {
		const rigidBody = this.world.createRigidBody(entity.bodyDesc);
		entity.body = rigidBody;
		// TODO: consider passing in more specific data
		entity.body.userData = { uuid: entity.uuid, ref: entity };
		if (this.world.gravity.x === 0 && this.world.gravity.y === 0 && this.world.gravity.z === 0) {
			entity.body.lockTranslations(true, true);
			entity.body.lockRotations(true, true);
		}
		const collider = this.world.createCollider(entity.colliderDesc, entity.body);
		entity.collider = collider;
		if (entity.controlledRotation || entity instanceof ZylemActor) {
			entity.body.lockRotations(true, true);
			entity.characterController = this.world.createCharacterController(0.01);
			entity.characterController.setMaxSlopeClimbAngle(45 * Math.PI / 180);
			entity.characterController.setMinSlopeSlideAngle(30 * Math.PI / 180);
			entity.characterController.enableSnapToGround(0.01);
			entity.characterController.setSlideEnabled(true);
			entity.characterController.setApplyImpulsesToDynamicBodies(true);
			entity.characterController.setCharacterMass(1);
		}
		this.collisionMap.set(entity.uuid, entity);
	}

	setForRemoval(entity: any) {
		if (entity.body) {
			this._removalMap.set(entity.uuid, entity);
		}
	}

	destroyEntity(entity: GameEntity<any>) {
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
			if (!isCollisionHandlerDelegate(gameEntity)) {
				return;
			}
			const active = gameEntity.handlePostCollision({ entity: gameEntity, delta });
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
			if (this._removalMap.get(gameEntity.uuid)) {
				this.destroyEntity(gameEntity);
				continue;
			}
			this.world.contactsWith(gameEntity.body.collider(0), (otherCollider) => {
				if (!otherCollider) {
					return;
				}
				// @ts-ignore
				const uuid = otherCollider._parent.userData.uuid;
				const entity = dictionaryRef.get(uuid);
				if (!entity) {
					return;
				}
				if (gameEntity._collision) {
					gameEntity._collision(entity, state.globals);
				}
			});
			this.world.intersectionsWith(gameEntity.body.collider(0), (otherCollider) => {
				if (!otherCollider) {
					return;
				}
				// @ts-ignore
				const uuid = otherCollider._parent.userData.uuid;
				const entity = dictionaryRef.get(uuid);
				if (!entity) {
					return;
				}
				if (gameEntity._collision) {
					gameEntity._collision(entity, state.globals);
				}
				if (isCollisionHandlerDelegate(entity)) {
					entity.handleIntersectionEvent({ entity, other: gameEntity, delta });
					this.collisionBehaviorMap.set(uuid, entity);
				}
			});
		}
	}

	destroy() {
		try {
			for (const [, entity] of this.collisionMap) {
				try { this.destroyEntity(entity); } catch { /* noop */ }
			}
			this.collisionMap.clear();
			this.collisionBehaviorMap.clear();
			this._removalMap.clear();
			// @ts-ignore
			this.world = undefined as any;
		} catch { /* noop */ }
	}

}