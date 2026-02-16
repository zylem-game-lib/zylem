import { Vector3 } from 'three';
import RAPIER, { World } from '@dimforge/rapier3d-compat';

import { Entity } from '../interfaces/entity';
import { state } from '../game/game-state';
import { UpdateContext } from '../core/base-node-life-cycle';
import { ZylemActor } from '../entities/actor';
import { GameEntity } from '../entities/entity';
import { PhysicsProxy } from '../physics/physics-proxy';
import { PhysicsBodyHandle } from '../physics/physics-body-handle';
import { serializeBodyDesc, serializeColliderDesc, serializeCharacterController } from '../physics/serialize-descriptors';
import type { CollisionPair } from '../physics/physics-protocol';

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

/**
 * Physics world wrapper supporting two modes:
 *
 * - **Direct mode** (default): Rapier world lives on the main thread.
 *   This is the original behavior with the Phase-1 fixed-timestep accumulator.
 *
 * - **Worker mode**: Physics runs in a Web Worker via {@link PhysicsProxy}.
 *   Entity bodies are replaced with {@link PhysicsBodyHandle} instances that
 *   cache transforms and queue write commands. Collision events are delivered
 *   asynchronously (one frame latency).
 */
export class ZylemWorld implements Entity<ZylemWorld> {
	type = 'World';

	/** Rapier world instance (null in worker mode). */
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

	// ─── Worker Mode ─────────────────────────────────────────────────────

	/** When true, physics runs in a Web Worker via the proxy. */
	readonly workerMode: boolean;
	/** Physics worker proxy (only set in worker mode). */
	private proxy: PhysicsProxy | null = null;
	/** Pending step promise (worker mode). */
	private _pendingStep: Promise<void> | null = null;

	static async loadPhysics(gravity: Vector3) {
		await RAPIER.init();
		const physicsWorld = new RAPIER.World(gravity);
		return physicsWorld;
	}

	/**
	 * Initialize physics in worker mode. Returns a ZylemWorld that
	 * delegates all physics to a Web Worker.
	 *
	 * @param gravity World gravity.
	 * @param physicsRate Physics tick rate in Hz.
	 * @param workerUrl Optional URL to the worker script.
	 */
	static async loadPhysicsWorker(
		gravity: Vector3,
		physicsRate = 60,
		workerUrl?: URL,
	): Promise<ZylemWorld> {
		const proxy = new PhysicsProxy();
		await proxy.init(
			[gravity.x, gravity.y, gravity.z],
			physicsRate,
			workerUrl,
		);

		const zw = new ZylemWorld(null as unknown as World, physicsRate, true);
		zw.proxy = proxy;

		proxy.onCollision((pair) => {
			zw.handleWorkerCollision(pair);
		});

		return zw;
	}

	/**
	 * @param world The Rapier physics world instance (null in worker mode).
	 * @param physicsRate Physics update rate in Hz (default 60).
	 * @param useWorker Whether to use worker mode (default false).
	 */
	constructor(world: World, physicsRate = 60, useWorker = false) {
		this.world = world;
		this.workerMode = useWorker;
		this.fixedTimestep = 1 / physicsRate;
		if (!useWorker && world) {
			this.world.integrationParameters.dt = this.fixedTimestep;
		}
	}

	// ─── Entity Management ───────────────────────────────────────────────

	addEntity(entity: any) {
		if (this.workerMode) {
			this.addEntityWorker(entity);
			return;
		}
		this.addEntityDirect(entity);
	}

	setForRemoval(entity: any) {
		if (entity.body) {
			this._removalMap.set(entity.uuid, entity);
		}
	}

	destroyEntity(entity: GameEntity<any>) {
		if (this.workerMode) {
			this.destroyEntityWorker(entity);
			return;
		}
		this.destroyEntityDirect(entity);
	}

	setup() { }

	// ─── Update ──────────────────────────────────────────────────────────

	/**
	 * Advance the physics simulation.
	 *
	 * In direct mode, uses the fixed-timestep accumulator on the main thread.
	 * In worker mode, sends a step command and awaits the result.
	 */
	update(params: UpdateContext<any>) {
		if (this.workerMode) {
			this.updateWorker(params);
			return;
		}
		this.updateDirect(params);
	}

	/**
	 * In worker mode, the step is async. Call this to await the
	 * pending step before reading transform data.
	 */
	async awaitStep(): Promise<void> {
		if (this._pendingStep) {
			await this._pendingStep;
			this._pendingStep = null;
		}
	}

	// ─── Direct Mode Implementation ──────────────────────────────────────

	private addEntityDirect(entity: any) {
		const rigidBody = this.world.createRigidBody(entity.bodyDesc);
		entity.body = rigidBody;
		entity.body.userData = { uuid: entity.uuid, ref: entity };
		if (this.world.gravity.x === 0 && this.world.gravity.y === 0 && this.world.gravity.z === 0) {
			entity.body.lockTranslations(true, true);
			entity.body.lockRotations(true, true);
		}

		const collider = this.world.createCollider(entity.colliderDesc, entity.body);
		entity.collider = collider;
		entity.colliders = [collider];

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

	private destroyEntityDirect(entity: GameEntity<any>) {
		if ((entity as any).characterController) {
			try { (entity as any).characterController.free(); } catch { /* noop */ }
			(entity as any).characterController = null;
		}
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

	private updateDirect(params: UpdateContext<any>) {
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

	// ─── Worker Mode Implementation ──────────────────────────────────────

	private addEntityWorker(entity: any) {
		if (!this.proxy) return;

		const bodyDesc = serializeBodyDesc(entity.bodyDesc);
		const colliderDescs = (entity.colliderDescs?.length > 0 ? entity.colliderDescs : [entity.colliderDesc])
			.filter(Boolean)
			.map(serializeColliderDesc);

		const needsCharCtrl = entity.controlledRotation || entity instanceof ZylemActor;
		const charCtrl = needsCharCtrl ? serializeCharacterController() : undefined;

		const handle = this.proxy.addBody(entity.uuid, bodyDesc, colliderDescs, charCtrl);

		// Replace entity.body with the handle. The handle provides the same
		// read API (translation(), rotation(), linvel(), angvel()) and queues
		// write operations as commands for the worker.
		entity.body = handle as any;
		entity.collider = null;
		entity.colliders = [];

		this.collisionMap.set(entity.uuid, entity);
	}

	private destroyEntityWorker(entity: GameEntity<any>) {
		if (!this.proxy) return;
		this.proxy.removeBody(entity.uuid);
		this.collisionMap.delete(entity.uuid);
		this._removalMap.delete(entity.uuid);
	}

	private updateWorker(params: UpdateContext<any>) {
		if (!this.proxy) return;

		// Process removals before stepping
		for (const [uuid, entity] of this._removalMap) {
			this.destroyEntityWorker(entity);
		}
		this._removalMap.clear();

		const { delta } = params;
		this._pendingStep = this.proxy.step(delta).then((result) => {
			this.interpolationAlpha = result.interpolationAlpha;
		});
	}

	/**
	 * Handle a collision pair reported by the worker.
	 * Looks up entities by UUID and fires their collision callbacks.
	 */
	private handleWorkerCollision(pair: CollisionPair) {
		const entityA = this.collisionMap.get(pair.uuidA);
		const entityB = this.collisionMap.get(pair.uuidB);

		if (entityA?._collision && entityB) {
			entityA._collision(entityB, state.globals);
		}

		if (pair.contactType === 'intersection' && entityB) {
			if (isCollisionHandlerDelegate(entityB)) {
				entityB.handleIntersectionEvent({
					entity: entityB,
					other: entityA,
					delta: this.fixedTimestep,
				});
				this.collisionBehaviorMap.set(pair.uuidB, entityB);
			}
		}
	}

	// ─── Shared collision behavior processing ────────────────────────────

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

	// ─── Cleanup ─────────────────────────────────────────────────────────

	destroy() {
		try {
			if (this.workerMode) {
				this.proxy?.dispose();
				this.proxy = null;
			} else {
				for (const [, entity] of this.collisionMap) {
					try { this.destroyEntityDirect(entity); } catch { /* noop */ }
				}
				try { this.world?.free(); } catch { /* noop */ }
				// @ts-ignore
				this.world = undefined as any;
			}
			this.collisionMap.clear();
			this.collisionBehaviorMap.clear();
			this._removalMap.clear();
		} catch { /* noop */ }
	}

}