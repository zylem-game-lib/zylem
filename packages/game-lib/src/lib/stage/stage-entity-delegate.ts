/**
 * The stage's entity lifecycle engine.
 *
 * Owns everything about entities within a stage: queuing (sync, async, and
 * factory inputs), progressive load via a yielding generator, spawning into
 * scene/world/runtime, instanced-mesh batching, deferred-model handling,
 * removal, name/UUID lookup, and ECS behavior-system registration/indexing.
 * Extracted from `ZylemStage` so entity bookkeeping lives in one cohesive place
 * and can be shared with the debug delegate and transform system.
 */
import { ZylemWorld } from '../collision/world';
import { ZylemScene } from '../graphics/zylem-scene';
import { ZylemCamera } from '../camera/zylem-camera';
import { RenderStrategyManager } from '../graphics/render-strategy-manager';
import { resolveRenderCategory, isManagedRenderEntity } from '../graphics/render-category';
import { StageBodyKind } from '@zylem/behaviors/core';
import { clearVariables } from './stage-state';
import { zylemEventBus } from '../events';
import { debugState } from '../debug/debug-state';
import { getGlobals } from '../game/game-state';
import { BaseNode } from '../core/base-node';
import { GameEntity, create } from '../entities/entity';
import type { CreateEntityFn } from '@zylem/behaviors/core';
import { ZylemActor } from '../entities/actor';
import {
	confirmSpawnPlacement,
	beginSpawnPlacement,
	endSpawnPlacement,
	finalizeSpawnPlacement,
	markSpawnPlacementReady,
	revealSpawnPlacement,
	syncRenderPositionFromBody,
} from '../entities/spawn-placement';
import { BaseEntityInterface } from '../types/entity-types';
import { StageLoadingDelegate } from './stage-loading-delegate';
import { StageEntityModelDelegate } from './stage-entity-model-delegate';
import { isBaseNode, isThenable } from '../core/utility/options-parser';
import type {
	BehaviorEntityLink,
	BehaviorRuntime,
	BehaviorSystem,
	BehaviorSystemFactory,
} from '@zylem/behaviors/core';
import { Vessel } from '../core/vessel';

type NodeLike = { create: Function };
export type StageEntityInput = NodeLike | Promise<any> | (() => NodeLike | Promise<any>);

/**
 * How many detached entities stay recoverable.
 *
 * Sized above the editor's undo depth (100) so a uuid still referenced by the
 * history stack is never quietly unrecoverable. Anything evicted past this is
 * fully destroyed.
 */
const MAX_DETACHED_ENTITIES = 200;

/** A detached entity plus the pose to restore it at. */
interface DetachedEntity {
	entity: any;
	position: { x: number; y: number; z: number } | null;
	rotation: { x: number; y: number; z: number; w: number } | null;
}

/**
 * Runtime context provided by ZylemStage after scene and world are initialized.
 */
export interface EntityDelegateContext {
	scene: ZylemScene;
	world: ZylemWorld;
	renderStrategy: RenderStrategyManager | null;
	/** Resolved camera for entity setup contexts. */
	camera: ZylemCamera;
}

/**
 * Delegate responsible for entity spawning, tracking, queuing, removal, and lookup.
 *
 * Owns all entity-related state and exposes it to ZylemStage for orchestration
 * and to external consumers (debug delegate, transform system) via public getters.
 */
export class StageEntityDelegate {
	private static readonly EMPTY_BEHAVIOR_LINKS: readonly BehaviorEntityLink[] = [];

	/** Entities queued before load completes. */
	children: BaseNode[] = [];

	/** UUID → BaseNode map of all live entities. */
	readonly childrenMap: Map<string, BaseNode> = new Map();

	/** UUID → BaseNode map populated when debug mode is active. */
	readonly debugMap: Map<string, BaseNode> = new Map();

	/**
	 * Entities detached from the stage but kept alive so an editor undo can put
	 * them back. See {@link StageEntityDelegate.detachEntity}.
	 */
	readonly detachedMap: Map<string, DetachedEntity> = new Map();

	private pendingEntities: StageEntityInput[] = [];
	private pendingPromises: Promise<BaseNode>[] = [];
	private _isLoaded = false;

	private entityAddedHandlers: Array<(entity: BaseNode) => void> = [];

	/** ECS behavior systems auto-registered from entity refs or manually added. */
	readonly behaviorSystems: BehaviorSystem[] = [];
	readonly behaviorSystemByKey: Map<symbol, BehaviorSystem> = new Map();
	readonly registeredSystemKeys: Set<symbol> = new Set();
	readonly behaviorEntityIndex: Map<symbol, Set<BehaviorEntityLink>> = new Map();
	private readonly behaviorLinksByUuid: Map<string, BehaviorEntityLink[]> = new Map();

	// Runtime context — set via attach() during stage load
	private scene: ZylemScene | null = null;
	private world: ZylemWorld | null = null;
	private renderStrategy: RenderStrategyManager | null = null;
	private camera: ZylemCamera | null = null;
	/**
	 * The behaviors runtime adapter backing the world's Simulation; shared with
	 * descriptor `systemFactory` calls as `ctx.wasmStage`.
	 */
	wasmStage: BehaviorRuntime | null = null;

	private loadingDelegate: StageLoadingDelegate;
	private entityModelDelegate: StageEntityModelDelegate;

	constructor(
		loadingDelegate: StageLoadingDelegate,
		entityModelDelegate: StageEntityModelDelegate,
	) {
		this.loadingDelegate = loadingDelegate;
		this.entityModelDelegate = entityModelDelegate;
	}

	get isLoaded(): boolean {
		return this._isLoaded;
	}

	set isLoaded(value: boolean) {
		this._isLoaded = value;
	}

	/**
	 * Bind runtime context after scene and world are initialized.
	 * Must be called before any spawn/enqueue operations.
	 */
	attach(context: EntityDelegateContext): void {
		this.scene = context.scene;
		this.world = context.world;
		this.renderStrategy = context.renderStrategy;
		this.camera = context.camera;
		this.wasmStage = context.world.simulation.adapter;
	}

	// ─── Spawning ────────────────────────────────────────────────────────────

	/**
	 * Create, register, and add an entity to the scene/world.
	 * Safe to call only after `attach` when scene/world exist.
	 */
	async spawnEntity(child: BaseNode): Promise<void> {
		if (!this.scene || !this.world) {
			return;
		}

		if (child instanceof Vessel) {
			child.create();
			for (const childEntity of child.getChildren()) {
				if (childEntity instanceof BaseNode) {
					await this.spawnEntity(childEntity);
				}
			}

			child.nodeSetup({
				me: child,
				globals: getGlobals(),
				camera: this.camera!,
			});

			this.addEntityToStage(child);
			return;
		}

		const entity = child.create();

		beginSpawnPlacement(entity);
		this.registerBehaviorLinks(entity);
		this.ensureEnvironmentStatic(entity);
		this.maybeAttachEntityPhysics(entity);

		for (const childNode of child.getChildren()) {
			if (childNode instanceof BaseNode) {
				await this.spawnEntity(childNode);
			}
		}

		child.nodeSetup({
			me: child,
			globals: getGlobals(),
			camera: this.camera!,
		});

		this.tryRegisterRenderStrategy(entity);
		if (!isManagedRenderEntity(entity)) {
			this.scene.addEntityGroup(entity);
		}
		finalizeSpawnPlacement(entity);
		this.addEntityToStage(entity);
		this.entityModelDelegate.observe(entity);
		endSpawnPlacement(entity);
	}

	handleLateModelReady(entity: GameEntity<any>): void {
		if (!this.world || !this.scene || !this.childrenMap.has(entity.uuid)) {
			return;
		}
		this.ensureEnvironmentStatic(entity);
		this.maybeAttachEntityPhysics(entity);
		this.tryRegisterRenderStrategy(entity);
		if (!isManagedRenderEntity(entity)) {
			this.scene.addEntityGroup(entity);
		}
		finalizeSpawnPlacement(entity);
	}

	// ─── Render strategy registration ────────────────────────────────────────

	/**
	 * Register an entity for bundle or instanced rendering when opted in via
	 * `category: 'environment'` or `category: 'pack'`.
	 */
	private tryRegisterRenderStrategy(entity: GameEntity<any>): void {
		if (!this.renderStrategy) return;
		this.renderStrategy.register(entity);
	}

	/**
	 * Environment bundles require static bodies. Force static collision and
	 * patch any already-built body description.
	 */
	private ensureEnvironmentStatic(entity: GameEntity<any>): void {
		if (resolveRenderCategory(entity.options) !== 'environment') {
			return;
		}

		const collision = entity.options.collision ?? {};
		if (collision.static !== true) {
			console.warn(
				`category 'environment' forces static collision for entity '${entity.name || entity.uuid}'`,
			);
			entity.options.collision = { ...collision, static: true };
		}

		if (entity.bodyDesc && entity.bodyDesc.kind !== StageBodyKind.Static) {
			entity.bodyDesc.kind = StageBodyKind.Static;
		}
	}

	private maybeAttachEntityPhysics(entity: GameEntity<any>): void {
		if (!this.world || entity.physicsAttached || !entity.colliderDesc) {
			return;
		}

		if (entity instanceof ZylemActor) {
			if (entity.needsDeferredModelCollision()) {
				return;
			}
			entity.synchronizeRuntimeCollider();
		}

		this.world.addEntity(entity);
	}

	// ─── Stage registration ──────────────────────────────────────────────────

	/** Add the entity to internal maps and notify listeners. */
	addEntityToStage(entity: BaseNode): void {
		this.childrenMap.set(entity.uuid, entity);
		if (debugState.enabled) {
			this.debugMap.set(entity.uuid, entity);
		}
		for (const handler of this.entityAddedHandlers) {
			try {
				handler(entity);
			} catch (e) {
				console.error('onEntityAdded handler failed', e);
			}
		}
	}

	// ─── Removal ─────────────────────────────────────────────────────────────

	/**
	 * Remove an entity from the stage by its UUID.
	 *
	 * Detaches rather than destroys, so an editor undo can put the same
	 * instance back. See {@link StageEntityDelegate.detachEntity}.
	 *
	 * @returns true if removed, false if not found or stage not ready
	 */
	removeEntityByUuid(uuid: string): boolean {
		return this.detachEntity(uuid);
	}

	/**
	 * Take an entity out of the stage while keeping the instance alive.
	 *
	 * The editor cannot rebuild an entity — all it ever receives is a summary of
	 * name, type, and transform, with no material, behaviors, or collider
	 * config. So undoing a delete has to restore the original object, which
	 * means holding onto it here. Keeping the same instance also keeps its uuid
	 * stable, which every other entry in the undo stack depends on.
	 *
	 * Observers are still told the entity is gone: from the outside it has left
	 * the stage, and leaving it in the editor's list or the thumbnail cache
	 * would leak.
	 *
	 * @returns true when the entity was found and detached.
	 */
	detachEntity(uuid: string): boolean {
		if (!this.scene || !this.world) return false;

		// @ts-ignore - collisionMap is public Map<string, GameEntity<any>>
		const mapEntity = this.world.collisionMap.get(uuid) as any | undefined;
		const entityFromChildren = this.childrenMap.get(uuid);
		const entity: any = mapEntity ?? entityFromChildren ?? this.debugMap.get(uuid);
		if (!entity) return false;

		// Captured before the body is despawned; the body definition still
		// points at wherever the entity originally spawned.
		const pose = typeof entity.getPose === 'function' ? entity.getPose() : null;

		this.unregisterBehaviorLinks(entity);
		this.entityModelDelegate.unobserve(uuid);

		if (isManagedRenderEntity(entity)) {
			this.renderStrategy?.unregister(entity);
		}

		this.world.destroyEntity(entity);

		if (entity.group) {
			this.scene.scene.remove(entity.group);
		} else if (entity.mesh) {
			this.scene.scene.remove(entity.mesh);
		}

		this.childrenMap.delete(uuid);
		this.debugMap.delete(uuid);

		this.detachedMap.set(uuid, {
			entity,
			position: pose?.position ?? null,
			rotation: pose?.rotation ?? null,
		});
		this.evictOldestDetached();

		zylemEventBus.emit('entity:destroyed', { entityId: uuid });
		return true;
	}

	/**
	 * Put a detached entity back into the stage at the pose it left.
	 *
	 * Unlike {@link StageEntityDelegate.spawnEntity} this never calls
	 * `create()`: the entity is already fully built, and rebuilding it would
	 * discard its meshes and colliders along with any editor scale applied to
	 * them.
	 *
	 * @returns true when the entity was found and restored.
	 */
	restoreEntity(uuid: string): boolean {
		if (!this.scene || !this.world) return false;

		const detached = this.detachedMap.get(uuid);
		if (!detached) return false;
		this.detachedMap.delete(uuid);

		const { entity, position, rotation } = detached;

		// The body is respawned from its definition, so point that at the pose
		// the entity was detached at rather than its original spawn point.
		if (entity.bodyDesc) {
			if (position) {
				entity.bodyDesc.position = [position.x, position.y, position.z];
			}
			if (rotation) {
				entity.bodyDesc.rotation = [rotation.x, rotation.y, rotation.z, rotation.w];
			}
		}

		this.registerBehaviorLinks(entity);
		this.maybeAttachEntityPhysics(entity);
		this.tryRegisterRenderStrategy(entity);
		if (!isManagedRenderEntity(entity)) {
			this.scene.addEntityGroup(entity);
		}

		// The render transform is driven from the body each frame, but seed it
		// now so a paused stage shows the entity in the right place immediately.
		syncRenderPositionFromBody(entity);
		revealSpawnPlacement(entity);

		this.addEntityToStage(entity);
		this.entityModelDelegate.observe(entity);
		return true;
	}

	/** Whether a uuid is currently recoverable via {@link restoreEntity}. */
	isDetached(uuid: string): boolean {
		return this.detachedMap.has(uuid);
	}

	/**
	 * Destroy detached entities past the recoverable window. Insertion-ordered,
	 * so the oldest detachments go first.
	 */
	private evictOldestDetached(): void {
		while (this.detachedMap.size > MAX_DETACHED_ENTITIES) {
			const oldest = this.detachedMap.keys().next();
			if (oldest.done) return;
			const detached = this.detachedMap.get(oldest.value);
			this.detachedMap.delete(oldest.value);
			if (!detached) continue;
			try {
				detached.entity.nodeDestroy?.({ me: detached.entity, globals: getGlobals() });
			} catch { /* noop */ }
			clearVariables(detached.entity);
		}
	}

	// ─── Lookup ──────────────────────────────────────────────────────────────

	/** Get an entity by its name; returns null if not found. */
	getEntityByName(name: string): BaseNode | null {
		for (const child of this.childrenMap.values()) {
			if (child.name === name) return child;
		}
		console.warn(`Entity ${name} not found`);
		return null;
	}

	/** Build a serializable state snapshot for an entity. */
	buildEntityState(child: BaseNode): Partial<BaseEntityInterface> {
		if (child instanceof GameEntity) {
			return { ...child.buildInfo() } as Partial<BaseEntityInterface>;
		}
		return {
			uuid: child.uuid,
			name: child.name,
		} as Partial<BaseEntityInterface>;
	}

	// ─── Subscriptions ───────────────────────────────────────────────────────

	/**
	 * Subscribe to entity-added events.
	 * @param callback Invoked for each entity when added
	 * @param options.replayExisting If true and stage already loaded, replays existing entities
	 * @returns Unsubscribe function
	 */
	onEntityAdded(
		callback: (entity: BaseNode) => void,
		options?: { replayExisting?: boolean },
	): () => void {
		this.entityAddedHandlers.push(callback);
		if (options?.replayExisting && this._isLoaded) {
			this.childrenMap.forEach((entity) => {
				try {
					callback(entity);
				} catch (e) {
					console.error('onEntityAdded replay failed', e);
				}
			});
		}
		return () => {
			this.entityAddedHandlers = this.entityAddedHandlers.filter((h) => h !== callback);
		};
	}

	// ─── Queuing ─────────────────────────────────────────────────────────────

	/**
	 * Enqueue items to be spawned. Items can be:
	 * - BaseNode instances (immediate or deferred until load)
	 * - Factory functions returning BaseNode or Promise<BaseNode>
	 * - Promises resolving to BaseNode
	 */
	enqueue(...items: StageEntityInput[]): void {
		for (const item of items) {
			if (!item) continue;
			if (isBaseNode(item)) {
				this.handleEntityImmediatelyOrQueue(item);
				continue;
			}
			if (typeof item === 'function') {
				try {
					const result = (item as (() => BaseNode | Promise<any>))();
					if (isBaseNode(result)) {
						this.handleEntityImmediatelyOrQueue(result);
					} else if (isThenable(result)) {
						this.handlePromiseWithSpawnOnResolve(result as Promise<any>);
					}
				} catch (error) {
					console.error('Error executing entity factory', error);
				}
				continue;
			}
			if (isThenable(item)) {
				this.handlePromiseWithSpawnOnResolve(item as Promise<any>);
			}
		}
	}

	private handleEntityImmediatelyOrQueue(entity: BaseNode): void {
		if (this._isLoaded) {
			this.spawnEntity(entity);
		} else {
			this.children.push(entity);
		}
	}

	private handlePromiseWithSpawnOnResolve(promise: Promise<any>): void {
		if (this._isLoaded) {
			promise
				.then((entity) => this.spawnEntity(entity))
				.catch((e) => console.error('Failed to build async entity', e));
		} else {
			this.pendingPromises.push(promise as Promise<BaseNode>);
		}
	}

	/** Yields to the event loop via MessageChannel (~0.1ms vs ~4ms for setTimeout). */
	private yieldToEventLoop(): Promise<void> {
		return new Promise((resolve) => {
			const ch = new MessageChannel();
			ch.port1.onmessage = () => resolve();
			ch.port2.postMessage(undefined);
		});
	}

	/**
	 * Spawns all queued entities, awaiting each attach before the stage is
	 * marked loaded so the game loop never steps wasm while bodies are still
	 * being added. Yields to the event loop in batches for loading UI updates.
	 */
	async runEntityLoadGenerator(): Promise<void> {
		const BATCH_SIZE = 5;
		let current = 0;

		if (this.pendingEntities.length) {
			const pending = [...this.pendingEntities];
			this.pendingEntities = [];
			this.enqueue(...pending);
		}

		const pendingPromises = [...this.pendingPromises];
		this.pendingPromises = [];
		const total = this.children.length + pendingPromises.length;

		for (const child of this.children) {
			await this.spawnEntity(child);
			current++;
			this.loadingDelegate.emitProgress(
				`Loaded ${child.name || 'unknown'}`,
				current,
				total,
			);
			if (current % BATCH_SIZE === 0) {
				await this.yieldToEventLoop();
			}
		}

		for (const promise of pendingPromises) {
			try {
				const entity = await promise;
				if (entity) {
					await this.spawnEntity(entity);
				}
			} catch (e) {
				console.error('Failed to resolve pending stage entity', e);
			}
			current++;
			this.loadingDelegate.emitProgress('Loaded async entity', current, total);
			if (current % BATCH_SIZE === 0) {
				await this.yieldToEventLoop();
			}
		}

		if (current % BATCH_SIZE !== 0) {
			await this.yieldToEventLoop();
		}
	}

	// ─── Behavior systems ────────────────────────────────────────────────────

	/**
	 * Register an ECS behavior system to run each frame.
	 * @param systemOrFactory A BehaviorSystem instance or factory function
	 */
	registerSystem(systemOrFactory: BehaviorSystem | BehaviorSystemFactory): void {
		if (!this.world || !this.scene) return;
		let system: BehaviorSystem;
		if (typeof systemOrFactory === 'function') {
			system = systemOrFactory({
				world: this.world,
				scene: this.scene,
				getBehaviorLinks: (key: symbol) =>
					this.behaviorEntityIndex.get(key)
					?? StageEntityDelegate.EMPTY_BEHAVIOR_LINKS,
				createEntity: create as unknown as CreateEntityFn,
				getGlobals,
			});
		} else {
			system = systemOrFactory;
		}
		this.behaviorSystems.push(system);
	}

	// ─── Cleanup ─────────────────────────────────────────────────────────────

	/**
	 * Destroy all entities and clear internal state.
	 * Called by ZylemStage._destroy().
	 */
	destroyAll(): void {
		for (const system of this.behaviorSystems) {
			system.destroy?.();
		}
		this.behaviorSystems.length = 0;
		this.behaviorSystemByKey.clear();
		this.registeredSystemKeys.clear();
		this.behaviorEntityIndex.clear();
		this.behaviorLinksByUuid.clear();

		const destroyedUuids: string[] = [];
		this.childrenMap.forEach((child) => {
			try {
				child.nodeDestroy({ me: child, globals: getGlobals() });
			} catch { /* noop */ }
			clearVariables(child);
			destroyedUuids.push(child.uuid);
		});
		// Detached entities are only recoverable within a stage; tearing the
		// stage down makes their uuids meaningless, so destroy them here rather
		// than leaking their meshes and materials.
		this.detachedMap.forEach(({ entity }) => {
			try {
				entity.nodeDestroy?.({ me: entity, globals: getGlobals() });
			} catch { /* noop */ }
			clearVariables(entity);
		});
		this.detachedMap.clear();

		this.childrenMap.clear();
		this.debugMap.clear();
		this.entityAddedHandlers = [];

		// Bulk teardown bypasses removeEntityByUuid, so announce the removals
		// here too or listeners (thumbnail cache, editor entity list) leak.
		for (const uuid of destroyedUuids) {
			zylemEventBus.emit('entity:destroyed', { entityId: uuid });
		}

		this._isLoaded = false;
		this.scene = null;
		this.world = null;
		this.renderStrategy = null;
		this.camera = null;
		this.wasmStage = null;
	}

	private registerBehaviorLinks(entity: any): void {
		if (!this.world || !this.scene) return;
		if (typeof entity?.getBehaviorRefs !== 'function') return;

		const refs = entity.getBehaviorRefs();
		if (!Array.isArray(refs) || refs.length === 0) return;

		const links: BehaviorEntityLink[] = [];

		for (const ref of refs) {
			const key = ref.descriptor.key;
			const link: BehaviorEntityLink = { entity, ref };
			links.push(link);

			let indexed = this.behaviorEntityIndex.get(key);
			if (!indexed) {
				indexed = new Set();
				this.behaviorEntityIndex.set(key, indexed);
			}
			indexed.add(link);

			let system = this.behaviorSystemByKey.get(key);
			if (!system && !this.registeredSystemKeys.has(key)) {
				const createdSystem = ref.descriptor.systemFactory({
					world: this.world,
					scene: this.scene,
					wasmStage: this.wasmStage,
					getBehaviorLinks: (behaviorKey: symbol) =>
						this.behaviorEntityIndex.get(behaviorKey)
						?? StageEntityDelegate.EMPTY_BEHAVIOR_LINKS,
					createEntity: create as unknown as CreateEntityFn,
					getGlobals,
				});
				system = createdSystem;
				this.behaviorSystems.push(createdSystem);
				this.behaviorSystemByKey.set(key, createdSystem);
				this.registeredSystemKeys.add(key);
			}

			system?.attach?.(link);
		}

		this.behaviorLinksByUuid.set(entity.uuid, links);
	}

	private unregisterBehaviorLinks(entity: any): void {
		const links = this.behaviorLinksByUuid.get(entity?.uuid);
		if (!links) return;

		for (const link of links) {
			const key = link.ref?.descriptor?.key as symbol | undefined;
			if (!key) continue;
			const indexed = this.behaviorEntityIndex.get(key);
			if (!indexed) continue;

			this.behaviorSystemByKey.get(key)?.detach?.(link);
			indexed.delete(link);
			if (indexed.size === 0) {
				this.behaviorEntityIndex.delete(key);
			}
		}

		this.behaviorLinksByUuid.delete(entity.uuid);
	}
}
