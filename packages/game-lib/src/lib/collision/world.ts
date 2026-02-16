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

	/** Fixed timestep in seconds used for each physics step. */
	readonly fixedTimestep: number;
	/** Unprocessed time carried over between frames. */
	private accumulator = 0;
	/** Maximum number of physics steps allowed per frame to prevent spiral-of-death. */
	private static readonly MAX_STEPS_PER_FRAME = 5;
	/**
	 * Interpolation alpha (0..1) representing the fraction of an unprocessed
	 * timestep remaining after the last physics step. Can be used to interpolate
	 * rendering transforms between the previous and current physics state.
	 */
	interpolationAlpha = 0;

	static async loadPhysics(gravity: Vector3) {
		await RAPIER.init();
		const physicsWorld = new RAPIER.World(gravity);
		return physicsWorld;
	}

	/**
	 * @param world The Rapier physics world instance.
	 * @param physicsRate Physics update rate in Hz (default 60).
	 */
	constructor(world: World, physicsRate = 60) {
		this.world = world;
		this.fixedTimestep = 1 / physicsRate;
		this.world.integrationParameters.dt = this.fixedTimestep;
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

		// Create primary collider
		const collider = this.world.createCollider(entity.colliderDesc, entity.body);
		entity.collider = collider;
		entity.colliders = [collider];

		// Create additional compound colliders (if any)
		if (entity.colliderDescs?.length > 1) {
			for (let i = 1; i < entity.colliderDescs.length; i++) {
				const additionalCollider = this.world.createCollider(entity.colliderDescs[i], entity.body);
				entity.colliders.push(additionalCollider);
			}
		}

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
		// Free character controller WASM resource if present
		if ((entity as any).characterController) {
			try { (entity as any).characterController.free(); } catch { /* noop */ }
			(entity as any).characterController = null;
		}
		// Remove all colliders (compound support)
		if (entity.colliders?.length) {
			for (const collider of entity.colliders) {
				this.world.removeCollider(collider, true);
			}
		} else if (entity.collider) {
			this.world.removeCollider(entity.collider, true);
		}
		if (entity.body) {
			this.world.removeRigidBody(entity.body);
			this.collisionMap.delete(entity.uuid);
			this._removalMap.delete(entity.uuid);
		}
	}

	setup() { }

	/**
	 * Advance the physics simulation using a fixed-timestep accumulator.
	 * The world is stepped zero or more times per frame so that physics
	 * runs at a consistent rate regardless of the display refresh rate.
	 */
	update(params: UpdateContext<any>) {
		const { delta } = params;
		if (!this.world) {
			return;
		}

		this.accumulator += delta;

		const maxAccumulator = this.fixedTimestep * ZylemWorld.MAX_STEPS_PER_FRAME;
		this.accumulator = Math.min(this.accumulator, maxAccumulator);

		while (this.accumulator >= this.fixedTimestep) {
			this.updateColliders(this.fixedTimestep);
			this.updatePostCollisionBehaviors(this.fixedTimestep);
			this.world.step();
			this.accumulator -= this.fixedTimestep;
		}

		this.interpolationAlpha = this.accumulator / this.fixedTimestep;
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
		// Body may have been invalidated by a destroy() call inside a collision callback
		if (!gameEntity.body || gameEntity.markedForRemoval) {
			continue;
		}
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
			// Free WASM-backed Rapier world before dropping the reference
			try { this.world?.free(); } catch { /* noop */ }
			// @ts-ignore
			this.world = undefined as any;
		} catch { /* noop */ }
	}

}