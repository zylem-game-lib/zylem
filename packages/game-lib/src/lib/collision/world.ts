import { Vector3 } from 'three';
import RAPIER, { World } from '@dimforge/rapier3d-compat';

import { Entity } from '../interfaces/entity';
import { state } from '../game/game-state';
import { UpdateContext } from '../core/base-node-life-cycle';
import { ZylemActor } from '../entities/actor';
import {
	GameEntity,
	type CollisionDispatchMetadata,
	type CollisionPhase,
} from '../entities/entity';
import { PhysicsProxy } from '../physics/physics-proxy';
import { serializeBodyDesc, serializeColliderDesc, serializeCharacterController } from '../physics/serialize-descriptors';
import type { CollisionPair } from '../physics/physics-protocol';
import {
	commitDirectBodyPoseHistoryStep,
	collapseDirectBodyPoseHistory,
	prepareDirectBodyPoseHistoryStep,
	registerDirectBodyPoseHistory,
} from '../physics/physics-pose';

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

export interface CollisionSnapshotEntry {
	uuidA: string;
	uuidB: string;
	hasContact: boolean;
	hasIntersection: boolean;
}

function createCollisionSnapshotKey(uuidA: string, uuidB: string): string {
	return uuidA < uuidB ? `${uuidA}|${uuidB}` : `${uuidB}|${uuidA}`;
}

export function buildCollisionSnapshot(
	pairs: CollisionPair[],
): Map<string, CollisionSnapshotEntry> {
	const snapshot = new Map<string, CollisionSnapshotEntry>();

	for (const pair of pairs) {
		if (pair.uuidA === pair.uuidB) {
			continue;
		}

		const key = createCollisionSnapshotKey(pair.uuidA, pair.uuidB);
		const uuidA = pair.uuidA < pair.uuidB ? pair.uuidA : pair.uuidB;
		const uuidB = pair.uuidA < pair.uuidB ? pair.uuidB : pair.uuidA;
		const existing = snapshot.get(key);

		if (existing) {
			if (pair.contactType === 'contact') {
				existing.hasContact = true;
			} else {
				existing.hasIntersection = true;
			}
			continue;
		}

		snapshot.set(key, {
			uuidA,
			uuidB,
			hasContact: pair.contactType === 'contact',
			hasIntersection: pair.contactType === 'intersection',
		});
	}

	return snapshot;
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
	private activeCollisionPairs: Map<string, CollisionSnapshotEntry> = new Map();
	private currentCollisionTimeMs = 0;

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
	private readonly trackedDirectBodies = new WeakSet<RAPIER.RigidBody>();

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
		if (entity.physicsAttached) {
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
		entity.physicsAttached = true;
		entity.body.userData = { uuid: entity.uuid, ref: entity };
		registerDirectBodyPoseHistory(rigidBody);
		this.patchDirectBodyPoseTracking(rigidBody);
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

		// Rotation lock applies to every controlled actor (including platformer
		// entities that drive their body via setLinvel). The character-controller
		// allocation below is opt-in per entity — platformer 3D does not use it,
		// and allocating it for every actor was producing orphan Rapier resources.
		if (entity.controlledRotation || entity instanceof ZylemActor) {
			entity.body.lockRotations(true, true);
		}

		if (entity.useCharacterController) {
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
				try { this.world.removeCollider(collider, true); } catch { /* noop */ }
			}
		} else if (entity.collider) {
			try { this.world.removeCollider(entity.collider, true); } catch { /* noop */ }
		}
		if (entity.body) {
			try { this.world.removeRigidBody(entity.body); } catch { /* noop */ }
			this.removeEntityFromTracking(entity.uuid);
		}
		this.clearEntityPhysicsState(entity);
	}

	private updateDirect(params: UpdateContext<any>) {
		const { delta } = params;
		if (!this.world) {
			return;
		}

		this.currentCollisionTimeMs += delta * 1000;
		this.processPendingRemovals();
		this.accumulator += delta;

		const maxAccumulator = this.fixedTimestep * ZylemWorld.MAX_STEPS_PER_FRAME;
		this.accumulator = Math.min(this.accumulator, maxAccumulator);

		while (this.accumulator >= this.fixedTimestep) {
			this.captureDirectBodyPreviousPoses();
			this.world.step();
			this.captureDirectBodyCurrentPoses();
			this.accumulator -= this.fixedTimestep;
		}

		this.processCollisionPairs(
			this.collectCollisionPairsFromWorld(),
			delta,
			this.currentCollisionTimeMs,
		);
		this.interpolationAlpha = this.accumulator / this.fixedTimestep;
	}

	private captureDirectBodyPreviousPoses() {
		for (const [, collider] of this.collisionMap) {
			const body = (collider as GameEntity<any>).body as RAPIER.RigidBody | null;
			if (body) {
				prepareDirectBodyPoseHistoryStep(body);
			}
		}
	}

	private captureDirectBodyCurrentPoses() {
		for (const [, collider] of this.collisionMap) {
			const body = (collider as GameEntity<any>).body as RAPIER.RigidBody | null;
			if (body) {
				commitDirectBodyPoseHistoryStep(body);
			}
		}
	}

	private patchDirectBodyPoseTracking(body: RAPIER.RigidBody) {
		if (this.trackedDirectBodies.has(body)) {
			return;
		}

		const trackedBody = body as RAPIER.RigidBody & {
			setTranslation: (
				translation: { x: number; y: number; z: number },
				wakeUp: boolean,
			) => void;
			setRotation: (
				rotation: { x: number; y: number; z: number; w: number },
				wakeUp: boolean,
			) => void;
		};
		const originalSetTranslation = body.setTranslation.bind(body);
		const originalSetRotation = body.setRotation.bind(body);

		trackedBody.setTranslation = (translation, wakeUp) => {
			originalSetTranslation(translation, wakeUp);
			collapseDirectBodyPoseHistory(body);
		};
		trackedBody.setRotation = (rotation, wakeUp) => {
			originalSetRotation(rotation, wakeUp);
			collapseDirectBodyPoseHistory(body);
		};

		this.trackedDirectBodies.add(body);
	}

	// ─── Worker Mode Implementation ──────────────────────────────────────

	private addEntityWorker(entity: any) {
		if (!this.proxy) return;

		const bodyDesc = serializeBodyDesc(entity.bodyDesc);
		const colliderDescs = (entity.colliderDescs?.length > 0 ? entity.colliderDescs : [entity.colliderDesc])
			.filter(Boolean)
			.map(serializeColliderDesc);

		const charCtrl = entity.useCharacterController ? serializeCharacterController() : undefined;

		const handle = this.proxy.addBody(entity.uuid, bodyDesc, colliderDescs, charCtrl);

		// Replace entity.body with the handle. The handle provides the same
		// read API (translation(), rotation(), linvel(), angvel()) and queues
		// write operations as commands for the worker.
		entity.body = handle as any;
		entity.physicsAttached = true;
		entity.collider = null;
		entity.colliders = [];

		this.collisionMap.set(entity.uuid, entity);
	}

	private destroyEntityWorker(entity: GameEntity<any>) {
		if (!this.proxy) return;
		this.proxy.removeBody(entity.uuid);
		this.removeEntityFromTracking(entity.uuid);
		this.clearEntityPhysicsState(entity);
	}

	private updateWorker(params: UpdateContext<any>) {
		if (!this.proxy) return;

		const { delta } = params;
		this.currentCollisionTimeMs += delta * 1000;
		this.processPendingRemovals();
		const collisionTimeMs = this.currentCollisionTimeMs;
		this._pendingStep = this.proxy.step(delta).then((result) => {
			this.interpolationAlpha = result.interpolationAlpha;
			this.processCollisionPairs(result.collisions, delta, collisionTimeMs);
		});
	}

	// ─── Shared collision behavior processing ────────────────────────────

	updatePostCollisionBehaviors(delta: number) {
		const dictionaryRef = this.collisionBehaviorMap;
		for (let [id, collider] of dictionaryRef) {
			const gameEntity = collider as any;
			if (!isCollisionHandlerDelegate(gameEntity)) {
				continue;
			}
			const active = gameEntity.handlePostCollision({ entity: gameEntity, delta });
			if (!active) {
				this.collisionBehaviorMap.delete(id);
			}
		}
	}

	private processPendingRemovals() {
		if (this._removalMap.size === 0) {
			return;
		}

		for (const [, entity] of this._removalMap) {
			this.destroyEntity(entity);
		}
		this._removalMap.clear();
	}

	private removeEntityFromTracking(uuid: string) {
		this.collisionMap.delete(uuid);
		this._removalMap.delete(uuid);
		this.pruneActiveCollisionPairs(uuid);
	}

	private pruneActiveCollisionPairs(uuid: string) {
		for (const [key, pair] of this.activeCollisionPairs) {
			if (pair.uuidA === uuid || pair.uuidB === uuid) {
				this.activeCollisionPairs.delete(key);
			}
		}
	}

	private collectCollisionPairsFromWorld(): CollisionPair[] {
		const pairs: CollisionPair[] = [];
		if (!this.world) {
			return pairs;
		}

		for (const [, collider] of this.collisionMap) {
			const gameEntity = collider as GameEntity<any>;
			const body = gameEntity.body as RAPIER.RigidBody | null;
			if (!body) {
				continue;
			}

			const primaryCollider = body.collider(0);
			if (!primaryCollider) {
				continue;
			}

			this.world.contactsWith(primaryCollider, (otherCollider) => {
				const otherBody = otherCollider.parent();
				const otherUuid = (otherBody?.userData as any)?.uuid as string | undefined;
				if (otherUuid) {
					pairs.push({
						uuidA: gameEntity.uuid,
						uuidB: otherUuid,
						contactType: 'contact',
					});
				}
			});

			this.world.intersectionsWith(primaryCollider, (otherCollider) => {
				const otherBody = otherCollider.parent();
				const otherUuid = (otherBody?.userData as any)?.uuid as string | undefined;
				if (otherUuid) {
					pairs.push({
						uuidA: gameEntity.uuid,
						uuidB: otherUuid,
						contactType: 'intersection',
					});
				}
			});
		}

		return pairs;
	}

	private entityHasCollisionPhaseListener(
		entity: GameEntity<any> | undefined,
		phase: CollisionPhase,
	): boolean {
		const registrations = entity?.collisionDelegate.collision;
		if (!registrations?.length) {
			return false;
		}

		for (const registration of registrations) {
			if (registration.options.phase === phase) {
				return true;
			}
		}

		return false;
	}

	private processCollisionPairs(
		pairs: CollisionPair[],
		delta: number,
		nowMs: number = this.currentCollisionTimeMs,
	) {
		const snapshot = buildCollisionSnapshot(pairs);

		for (const [key, pair] of snapshot) {
			const entityA = this.collisionMap.get(pair.uuidA);
			const entityB = this.collisionMap.get(pair.uuidB);
			const wasActive = this.activeCollisionPairs.has(key);
			if (!wasActive) {
				this.dispatchCollisionPhase(pair, 'enter', nowMs);
			}

			if (
				this.entityHasCollisionPhaseListener(entityA, 'stay')
				|| this.entityHasCollisionPhaseListener(entityB, 'stay')
			) {
				this.dispatchCollisionPhase(pair, 'stay', nowMs);
			}

			if (pair.hasIntersection) {
				this.dispatchIntersectionDelegates(pair, delta);
			}
		}

		this.updatePostCollisionBehaviors(delta);
		this.activeCollisionPairs = snapshot;
	}

	private dispatchCollisionPhase(
		pair: CollisionSnapshotEntry,
		phase: CollisionPhase,
		nowMs: number,
	) {
		const dispatch: CollisionDispatchMetadata = { phase, nowMs };
		const entityA = this.collisionMap.get(pair.uuidA);
		const entityB = this.collisionMap.get(pair.uuidB);

		if (entityA && entityB) {
			entityA._collision(entityB, state.globals, dispatch);
		}

		const refreshedA = this.collisionMap.get(pair.uuidA);
		const refreshedB = this.collisionMap.get(pair.uuidB);
		if (refreshedA && refreshedB) {
			refreshedB._collision(refreshedA, state.globals, dispatch);
		}
	}

	private dispatchIntersectionDelegates(
		pair: CollisionSnapshotEntry,
		delta: number,
	) {
		const entityA = this.collisionMap.get(pair.uuidA);
		const entityB = this.collisionMap.get(pair.uuidB);

		if (entityA && entityB && isCollisionHandlerDelegate(entityA)) {
			entityA.handleIntersectionEvent({
				entity: entityA,
				other: entityB,
				delta,
			});
			this.collisionBehaviorMap.set(entityA.uuid, entityA);
		}

		const refreshedA = this.collisionMap.get(pair.uuidA);
		const refreshedB = this.collisionMap.get(pair.uuidB);
		if (refreshedA && refreshedB && isCollisionHandlerDelegate(refreshedB)) {
			refreshedB.handleIntersectionEvent({
				entity: refreshedB,
				other: refreshedA,
				delta,
			});
			this.collisionBehaviorMap.set(refreshedB.uuid, refreshedB);
		}
	}

	// ─── Cleanup ─────────────────────────────────────────────────────────

	destroy() {
		try {
			if (this.workerMode) {
				for (const [, entity] of this.collisionMap) {
					this.clearEntityPhysicsState(entity);
				}
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
			this.activeCollisionPairs.clear();
		} catch { /* noop */ }
	}

	private clearEntityPhysicsState(entity: GameEntity<any>): void {
		entity.physicsAttached = false;
		entity.body = null;
		entity.collider = undefined;
		entity.colliders = [];
		(entity as any).characterController = null;
	}

}
