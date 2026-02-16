import { addEntity, removeEntity } from 'bitecs';

import { ZylemWorld } from '../collision/world';
import { ZylemScene } from '../graphics/zylem-scene';
import { ZylemCamera } from '../camera/zylem-camera';
import { InstanceManager } from '../graphics/instance-manager';
import { clearVariables } from './stage-state';
import { debugState } from '../debug/debug-state';
import { getGlobals } from '../game/game-state';
import { BaseNode } from '../core/base-node';
import { GameEntity } from '../entities/entity';
import { BaseEntityInterface } from '../types/entity-types';
import { StageLoadingDelegate } from './stage-loading-delegate';
import { StageEntityModelDelegate } from './stage-entity-model-delegate';
import { isBaseNode, isThenable } from '../core/utility/options-parser';
import type { BehaviorSystem, BehaviorSystemFactory } from '../behaviors/behavior-system';
import { Vessel } from '../core/vessel';

type NodeLike = { create: Function };
export type StageEntityInput = NodeLike | Promise<any> | (() => NodeLike | Promise<any>);

/**
 * Runtime context provided by ZylemStage after scene and world are initialized.
 */
export interface EntityDelegateContext {
	scene: ZylemScene;
	world: ZylemWorld;
	ecs: ReturnType<typeof import('bitecs').createWorld>;
	instanceManager: InstanceManager | null;
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
	/** Entities queued before load completes. */
	children: BaseNode[] = [];

	/** EID → BaseNode map of all live entities. */
	readonly childrenMap: Map<number, BaseNode> = new Map();

	/** UUID → BaseNode map populated when debug mode is active. */
	readonly debugMap: Map<string, BaseNode> = new Map();

	/** UUID → EID reverse lookup for O(1) removal. */
	private readonly uuidToEid: Map<string, number> = new Map();

	private pendingEntities: StageEntityInput[] = [];
	private pendingPromises: Promise<BaseNode>[] = [];
	private _isLoaded = false;

	private entityAddedHandlers: Array<(entity: BaseNode) => void> = [];

	/** ECS behavior systems auto-registered from entity refs or manually added. */
	readonly behaviorSystems: BehaviorSystem[] = [];
	readonly registeredSystemKeys: Set<symbol> = new Set();

	// Runtime context — set via attach() during stage load
	private scene: ZylemScene | null = null;
	private world: ZylemWorld | null = null;
	private ecs: ReturnType<typeof import('bitecs').createWorld> | null = null;
	private instanceManager: InstanceManager | null = null;
	private camera: ZylemCamera | null = null;

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
		this.ecs = context.ecs;
		this.instanceManager = context.instanceManager;
		this.camera = context.camera;
	}

	// ─── Spawning ────────────────────────────────────────────────────────────

	/**
	 * Create, register, and add an entity to the scene/world.
	 * Safe to call only after `attach` when scene/world exist.
	 */
	async spawnEntity(child: BaseNode): Promise<void> {
		if (!this.scene || !this.world || !this.ecs) {
			return;
		}

		if (child instanceof Vessel) {
			child.create();
			for (const childEntity of child.getChildren()) {
				if (childEntity instanceof BaseNode) {
					await this.spawnEntity(childEntity);
				}
			}
			const vesselEid = addEntity(this.ecs);
			child.eid = vesselEid;

			child.nodeSetup({
				me: child,
				globals: getGlobals(),
				camera: this.camera!,
			});

			this.addEntityToStage(child);
			return;
		}

		const entity = child.create();
		const eid = addEntity(this.ecs);
		entity.eid = eid;
		this.scene.addEntity(entity);

		// Auto-register behavior systems from entity refs
		if (typeof entity.getBehaviorRefs === 'function') {
			for (const ref of entity.getBehaviorRefs()) {
				const key = ref.descriptor.key;
				if (!this.registeredSystemKeys.has(key)) {
					const system = ref.descriptor.systemFactory({
						world: this.world,
						ecs: this.ecs,
						scene: this.scene,
					});
					this.behaviorSystems.push(system);
					this.registeredSystemKeys.add(key);
				}
			}
		}

		if (entity.colliderDesc) {
			this.world.addEntity(entity);
		}

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

		this.tryRegisterInstance(entity);
		this.addEntityToStage(entity);
		this.entityModelDelegate.observe(entity);
	}

	// ─── Instance batching ───────────────────────────────────────────────────

	/**
	 * Register an entity for instanced rendering if opted in with `batched: true`.
	 */
	private tryRegisterInstance(entity: GameEntity<any>): void {
		if (!this.instanceManager) return;

		const options = entity.options as any;
		if (options?.batched !== true) return;
		if (!entity.mesh?.geometry || !entity.materials?.length) return;

		const geometry = entity.mesh.geometry;
		const material = entity.materials[0];

		const entityType = (entity.constructor as any).type?.description || 'unknown';
		const size = options.size || { x: 1, y: 1, z: 1 };
		const matOptions = options.material || {};

		const batchKey = InstanceManager.generateBatchKey({
			geometryType: entityType,
			dimensions: { x: size.x, y: size.y, z: size.z },
			materialPath: matOptions.path || null,
			shaderType: matOptions.shader ? 'custom' : 'standard',
			colorHex: matOptions.color?.getHex?.() || 0xffffff,
		});

		const instanceId = this.instanceManager.register(entity, geometry, material, batchKey);

		if (instanceId >= 0) {
			entity.batchKey = batchKey;
			entity.instanceId = instanceId;
			entity.isInstanced = true;

			if (entity.mesh) {
				entity.mesh.visible = false;
			}
		}
	}

	// ─── Stage registration ──────────────────────────────────────────────────

	/** Add the entity to internal maps and notify listeners. */
	addEntityToStage(entity: BaseNode): void {
		this.childrenMap.set(entity.eid, entity);
		this.uuidToEid.set(entity.uuid, entity.eid);
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
	 * Remove an entity and its resources by its UUID.
	 * Uses a uuid→eid reverse map for O(1) lookup.
	 * @returns true if removed, false if not found or stage not ready
	 */
	removeEntityByUuid(uuid: string): boolean {
		if (!this.scene || !this.world || !this.ecs) return false;

		// @ts-ignore - collisionMap is public Map<string, GameEntity<any>>
		const mapEntity = this.world.collisionMap.get(uuid) as any | undefined;
		const entity: any = mapEntity ?? this.debugMap.get(uuid);
		if (!entity) return false;

		this.entityModelDelegate.unobserve(uuid);

		if (entity.isInstanced && this.instanceManager) {
			this.instanceManager.unregister(entity);
		}

		this.world.destroyEntity(entity);

		if (entity.group) {
			this.scene.scene.remove(entity.group);
		} else if (entity.mesh) {
			this.scene.scene.remove(entity.mesh);
		}

		removeEntity(this.ecs, entity.eid);

		// O(1) removal via reverse map
		const eid = this.uuidToEid.get(uuid);
		if (eid !== undefined) {
			this.childrenMap.delete(eid);
			this.uuidToEid.delete(uuid);
		}
		this.debugMap.delete(uuid);
		return true;
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
			eid: child.eid,
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

	// ─── Loading generator ───────────────────────────────────────────────────

	/**
	 * Generator that yields between entity loads for real-time progress updates.
	 */
	private *entityLoadGenerator(): Generator<{ current: number; total: number; name: string }> {
		const total = this.children.length + this.pendingEntities.length + this.pendingPromises.length;
		let current = 0;

		for (const child of this.children) {
			this.spawnEntity(child);
			current++;
			yield { current, total, name: child.name || 'unknown' };
		}

		if (this.pendingEntities.length) {
			this.enqueue(...this.pendingEntities);
			current += this.pendingEntities.length;
			this.pendingEntities = [];
			yield { current, total, name: 'pending entities' };
		}

		if (this.pendingPromises.length) {
			for (const promise of this.pendingPromises) {
				promise.then((entity) => {
					this.spawnEntity(entity);
				}).catch((e) => console.error('Failed to resolve pending stage entity', e));
			}
			current += this.pendingPromises.length;
			this.pendingPromises = [];
			yield { current, total, name: 'async entities' };
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
	 * Runs the entity load generator, yielding to the event loop in batches.
	 * Emits progress events through the loading delegate.
	 */
	async runEntityLoadGenerator(): Promise<void> {
		const gen = this.entityLoadGenerator();
		let i = 0;
		const BATCH_SIZE = 5;
		for (const progress of gen) {
			this.loadingDelegate.emitProgress(`Loaded ${progress.name}`, progress.current, progress.total);
			if (++i % BATCH_SIZE === 0) {
				await this.yieldToEventLoop();
			}
		}
		if (i % BATCH_SIZE !== 0) {
			await this.yieldToEventLoop();
		}
	}

	// ─── Behavior systems ────────────────────────────────────────────────────

	/**
	 * Register an ECS behavior system to run each frame.
	 * @param systemOrFactory A BehaviorSystem instance or factory function
	 */
	registerSystem(systemOrFactory: BehaviorSystem | BehaviorSystemFactory): void {
		if (!this.world || !this.ecs || !this.scene) return;
		let system: BehaviorSystem;
		if (typeof systemOrFactory === 'function') {
			system = systemOrFactory({ world: this.world, ecs: this.ecs, scene: this.scene });
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
			system.destroy?.(this.ecs!);
		}
		this.behaviorSystems.length = 0;
		this.registeredSystemKeys.clear();

		this.childrenMap.forEach((child) => {
			try {
				child.nodeDestroy({ me: child, globals: getGlobals() });
			} catch { /* noop */ }
			clearVariables(child);
		});
		this.childrenMap.clear();
		this.debugMap.clear();
		this.uuidToEid.clear();
		this.entityAddedHandlers = [];

		this._isLoaded = false;
		this.scene = null;
		this.world = null;
		this.ecs = null;
		this.instanceManager = null;
		this.camera = null;
	}
}
