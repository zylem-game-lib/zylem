import { Vector3 } from 'three';
import {
	createSimulation,
	StageBodyKind,
	type EntityHandle,
	type Simulation,
	type SimulationBodyDefinition,
	type SimulationColliderDefinition,
	type SimulationEvent,
} from '@zylem/behaviors/core';

import { Entity } from '../interfaces/entity';
import type { Vec3Components } from '../core/vector';
import { state } from '../game/game-state';
import { UpdateContext } from '../core/base-node-life-cycle';
import { ZylemActor } from '../entities/actor';
import {
	GameEntity,
	type CollisionDispatchMetadata,
	type CollisionPhase,
} from '../entities/entity';
import { SimulationBody, type SimulationStepClock } from './simulation-body';

/**
 * Collision pair surfaced by the world after each physics step.
 *
 * Kept as a runtime-internal type because it is the canonical shape consumed
 * by collision dispatch and a couple of unit tests.
 */
export interface CollisionPair {
	uuidA: string;
	uuidB: string;
	contactType: 'contact' | 'intersection';
}

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

/** Live contact/intersection bookkeeping per collision-pair key. */
interface LivePairEntry {
	uuidA: string;
	uuidB: string;
	contactCount: number;
	intersectionCount: number;
}

/**
 * Physics world wrapper.
 *
 * Owns a `@zylem/behaviors` {@link Simulation} (wasm ECS + physics) and
 * translates its handle-based API into game-lib's uuid/entity world model:
 * spawning entities from their body/collider definitions, tracking live
 * collision pairs from simulation events, and dispatching game collision
 * callbacks each frame.
 */
export class ZylemWorld implements Entity<ZylemWorld> {
	type = 'World';

	readonly simulation: Simulation;

	collisionMap: Map<string, GameEntity<any>> = new Map();
	collisionBehaviorMap: Map<string, GameEntity<any>> = new Map();
	_removalMap: Map<string, GameEntity<any>> = new Map();
	private activeCollisionPairs: Map<string, CollisionSnapshotEntry> = new Map();
	private livePairs: Map<string, LivePairEntry> = new Map();
	private handleIdToUuid: Map<number, string> = new Map();
	private currentCollisionTimeMs = 0;
	private readonly zeroGravity: boolean;

	/** Fixed timestep in seconds used for each physics step. */
	readonly fixedTimestep: number;
	/**
	 * Interpolation alpha (0..1) representing the fraction of an unprocessed
	 * timestep remaining after the last physics step. Used to interpolate
	 * rendering transforms between the previous and current physics state.
	 */
	interpolationAlpha = 0;

	/** Shared step counter handed to every {@link SimulationBody}. */
	private readonly stepClock: SimulationStepClock = { steps: 0 };

	/**
	 * Create the wasm-backed physics world for a stage.
	 * @param gravity World gravity.
	 * @param physicsRate Physics update rate in Hz (default 60).
	 */
	static async create(
		gravity: Vector3 | Vec3Components,
		physicsRate = 60,
	): Promise<ZylemWorld> {
		const g = {
			x: gravity?.x ?? 0,
			y: gravity?.y ?? 0,
			z: gravity?.z ?? 0,
		};
		const simulation = await createSimulation({
			gravity: [g.x, g.y, g.z],
			fixedTimestep: 1 / physicsRate,
			initialCapacity: 4096,
		});
		return new ZylemWorld(simulation, physicsRate, g.x === 0 && g.y === 0 && g.z === 0);
	}

	constructor(simulation: Simulation, physicsRate = 60, zeroGravity = false) {
		this.simulation = simulation;
		this.fixedTimestep = 1 / physicsRate;
		this.zeroGravity = zeroGravity;
		// Collision-event collection is expensive with many touching bodies;
		// keep it off until the first collision listener registers.
		// (Optional call: unit tests construct with a bare mock simulation.)
		this.simulation?.setEventsEnabled?.(false);
	}

	// ─── Entity Management ───────────────────────────────────────────────

	addEntity(entity: any) {
		const bodyDef: SimulationBodyDefinition = { ...(entity.bodyDesc ?? {}) };
		const colliders: SimulationColliderDefinition[] =
			entity.colliderDescs?.length
				? entity.colliderDescs
				: entity.colliderDesc
					? [entity.colliderDesc]
					: [];

		// Match legacy behavior: in a zero-gravity world every body is fully
		// locked (entities move only through explicit teleports), and
		// controlled actors never tumble from physics.
		if (this.zeroGravity) {
			bodyDef.lockTranslation = [true, true, true];
			bodyDef.lockRotation = [true, true, true];
		}
		if (entity.controlledRotation || entity instanceof ZylemActor) {
			bodyDef.lockRotation = [true, true, true];
		}

		const handle = this.simulation.spawn({ body: bodyDef, colliders });
		if (!handle) {
			console.warn(`ZylemWorld: failed to spawn entity ${entity.uuid} into simulation`);
			return;
		}

		entity.body = new SimulationBody(this.simulation, handle, this.stepClock);
		entity.physicsAttached = true;
		entity.physicsWorldRef = this;
		entity.simulationHandle = handle;
		entity.runtimeHandle = handle.slot;
		entity.runtimeAttached = true;
		entity.wasmStageRef = this.simulation.adapter;

		this.handleIdToUuid.set(handle.id, entity.uuid);
		this.collisionMap.set(entity.uuid, entity);
	}

	setForRemoval(entity: any) {
		if (entity.physicsAttached) {
			this._removalMap.set(entity.uuid, entity);
		}
	}

	destroyEntity(entity: GameEntity<any>) {
		// If this entity was re-registered into a different world (e.g. a shared
		// instance reused by an incoming stage), the handle here belongs to that
		// other world's simulation. Only prune our own tracking in that case.
		const ownedByThisWorld = (entity as any).physicsWorldRef === this;
		if (!ownedByThisWorld) {
			this.removeEntityFromTracking(entity.uuid);
			return;
		}

		const handle = (entity as any).simulationHandle as EntityHandle | undefined;
		if (handle) {
			try { this.simulation.despawn(handle); } catch { /* noop */ }
			this.handleIdToUuid.delete(handle.id);
		}
		this.removeEntityFromTracking(entity.uuid);
		this.clearEntityPhysicsState(entity);
	}

	setup() { }

	// ─── Update ──────────────────────────────────────────────────────────

	/**
	 * Advance the physics simulation. The fixed-timestep accumulator lives
	 * inside the Simulation; this method translates its events into game
	 * collision dispatch.
	 */
	update(params: UpdateContext<any>) {
		const { delta } = params;

		this.currentCollisionTimeMs += delta * 1000;
		this.processPendingRemovals();

		// Enable wasm event collection lazily, before stepping, so the frame
		// a listener first appears still receives events. Once on, stays on
		// (the wasm re-emits started edges for live overlaps when enabling,
		// so late listeners observe current state).
		const hasListeners = this.hasCollisionPhaseListeners();
		if (hasListeners && !this.simulation.areEventsEnabled) {
			this.simulation.setEventsEnabled?.(true);
		}

		const frame = this.simulation.update(delta);
		this.stepClock.steps += frame.stepsTaken;
		this.interpolationAlpha = frame.alpha;

		if (hasListeners) {
			this.applyCollisionEvents(frame.events);
			this.processCollisionPairs(delta, this.currentCollisionTimeMs);
		}
	}

	private hasCollisionPhaseListeners(): boolean {
		for (const entity of this.collisionMap.values()) {
			if (entity?.collisionDelegate?.collision?.length) {
				return true;
			}
		}
		return false;
	}

	// ─── Collision event translation ─────────────────────────────────────

	private applyCollisionEvents(events: SimulationEvent[]): void {
		for (const event of events) {
			if (event.type !== 'collisionStarted' && event.type !== 'collisionStopped') {
				continue;
			}
			const uuidA = event.a ? this.handleIdToUuid.get(event.a.id) : undefined;
			const uuidB = event.b ? this.handleIdToUuid.get(event.b.id) : undefined;
			if (!uuidA || !uuidB || uuidA === uuidB) {
				continue;
			}

			const key = createCollisionSnapshotKey(uuidA, uuidB);
			let entry = this.livePairs.get(key);
			if (!entry) {
				entry = {
					uuidA: uuidA < uuidB ? uuidA : uuidB,
					uuidB: uuidA < uuidB ? uuidB : uuidA,
					contactCount: 0,
					intersectionCount: 0,
				};
				this.livePairs.set(key, entry);
			}

			const deltaCount = event.type === 'collisionStarted' ? 1 : -1;
			if (event.sensor) {
				entry.intersectionCount = Math.max(0, entry.intersectionCount + deltaCount);
			} else {
				entry.contactCount = Math.max(0, entry.contactCount + deltaCount);
			}
			if (entry.contactCount === 0 && entry.intersectionCount === 0) {
				this.livePairs.delete(key);
			}
		}
	}

	private snapshotLivePairs(): Map<string, CollisionSnapshotEntry> {
		const snapshot = new Map<string, CollisionSnapshotEntry>();
		for (const [key, entry] of this.livePairs) {
			snapshot.set(key, {
				uuidA: entry.uuidA,
				uuidB: entry.uuidB,
				hasContact: entry.contactCount > 0,
				hasIntersection: entry.intersectionCount > 0,
			});
		}
		return snapshot;
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
		for (const [key, pair] of this.livePairs) {
			if (pair.uuidA === uuid || pair.uuidB === uuid) {
				this.livePairs.delete(key);
			}
		}
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
		delta: number,
		nowMs: number = this.currentCollisionTimeMs,
	) {
		const snapshot = this.snapshotLivePairs();

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

	// ─── Diagnostics ─────────────────────────────────────────────────────

	/**
	 * Physics raycast resolved to game entities. Used by debug tooling
	 * (hover/select/delete picking).
	 */
	raycast(
		origin: { x: number; y: number; z: number },
		direction: { x: number; y: number; z: number },
		maxDistance: number,
	): { uuid: string | null; distance: number; normal: [number, number, number] } | null {
		const hit = this.simulation.castRay(
			[origin.x, origin.y, origin.z],
			[direction.x, direction.y, direction.z],
			maxDistance,
			true,
		);
		if (!hit) return null;
		return {
			uuid: hit.entity ? this.handleIdToUuid.get(hit.entity.id) ?? null : null,
			distance: hit.distance,
			normal: hit.normal,
		};
	}

	// ─── Cleanup ─────────────────────────────────────────────────────────

	destroy() {
		try {
			for (const [, entity] of this.collisionMap) {
				try { this.clearEntityPhysicsState(entity); } catch { /* noop */ }
			}
			try { this.simulation.dispose(); } catch { /* noop */ }
			this.collisionMap.clear();
			this.collisionBehaviorMap.clear();
			this._removalMap.clear();
			this.activeCollisionPairs.clear();
			this.livePairs.clear();
			this.handleIdToUuid.clear();
		} catch { /* noop */ }
	}

	private clearEntityPhysicsState(entity: GameEntity<any>): void {
		entity.physicsAttached = false;
		entity.body = null;
		entity.runtimeHandle = -1;
		entity.runtimeAttached = false;
		entity.wasmStageRef = null;
		(entity as any).simulationHandle = undefined;
		// Only release ownership if we still own it; a re-registered instance
		// has already had its ref reassigned to the new world.
		if ((entity as any).physicsWorldRef === this) {
			(entity as any).physicsWorldRef = null;
		}
	}

}
