import { addEntity, createWorld as createECS, removeEntity } from 'bitecs';
import { Color, Vector3, Vector2 } from 'three';

import { ZylemWorld } from '../collision/world';
import { ZylemScene } from '../graphics/zylem-scene';
import { InstanceManager } from '../graphics/instance-manager';
import { resetStageVariables, setStageBackgroundColor, setStageBackgroundImage, setStageVariables, clearVariables, initialStageState } from './stage-state';

import { GameEntityInterface } from '../types/entity-types';
import { debugState } from '../debug/debug-state';
import { subscribe } from 'valtio/vanilla';
import { getGlobals } from "../game/game-state";

import { SetupContext, UpdateContext, DestroyContext } from '../core/base-node-life-cycle';
import { LifeCycleBase } from '../core/lifecycle-base';
import createTransformSystem, { StageSystem } from '../systems/transformable.system';
import { BaseNode } from '../core/base-node';
import { nanoid } from 'nanoid';
import { Stage } from './stage';
import { CameraWrapper } from '../camera/camera';
import { CameraManager } from '../camera/camera-manager';
import { RendererManager } from '../camera/renderer-manager';
import { StageDebugDelegate } from './stage-debug-delegate';
import { StageCameraDebugDelegate } from './stage-camera-debug-delegate';
import { StageCameraDelegate } from './stage-camera-delegate';
import { StageLoadingDelegate } from './stage-loading-delegate';
import { StageEntityModelDelegate } from './stage-entity-model-delegate';
import { GameEntity } from '../entities/entity';
import { BaseEntityInterface } from '../types/entity-types';
import { ZylemCamera } from '../camera/zylem-camera';
import { LoadingEvent } from '../core/interfaces';
import { parseStageOptions } from './stage-config';
import { isBaseNode, isThenable } from '../core/utility/options-parser';
import type { BehaviorSystem, BehaviorSystemFactory } from '../behaviors/behavior-system';
import { applyTransformChanges } from '../actions/capabilities/apply-transform';
import { Vessel } from '../core/vessel';
export type { LoadingEvent };

export interface ZylemStageConfig {
	inputs: Record<string, string[]>;
	backgroundColor: Color | string;
	backgroundImage: string | null;
	backgroundShader: any | null;
	gravity: Vector3;
	variables: Record<string, any>;
	stageRef?: Stage;
}

type NodeLike = { create: Function };
export type StageEntityInput = NodeLike | Promise<any> | (() => NodeLike | Promise<any>);

export type StageOptionItem = Partial<ZylemStageConfig> | CameraWrapper | StageEntityInput;
export type StageOptions = [] | [Partial<ZylemStageConfig>, ...StageOptionItem[]];

export type StageState = ZylemStageConfig & { entities: GameEntityInterface[] };

const STAGE_TYPE = 'Stage';

/**
 * ZylemStage orchestrates scene, physics world, entities, and lifecycle.
 *
 * Responsibilities:
 * - Manage stage configuration (background, inputs, gravity, variables)
 * - Initialize and own `ZylemScene` and `ZylemWorld`
 * - Spawn, track, and remove entities; emit entity-added events
 * - Drive per-frame updates and transform system
 */
export class ZylemStage extends LifeCycleBase<ZylemStage> {
	public type = STAGE_TYPE;

	state: StageState = { ...initialStageState };
	gravity: Vector3;

	world: ZylemWorld | null;
	scene: ZylemScene | null;
	instanceManager: InstanceManager | null = null;

	children: Array<BaseNode> = [];
	_childrenMap: Map<number, BaseNode> = new Map();
	_removalMap: Map<number, BaseNode> = new Map();

	private pendingEntities: StageEntityInput[] = [];
	private pendingPromises: Promise<BaseNode>[] = [];
	private isLoaded: boolean = false;

	_debugMap: Map<string, BaseNode> = new Map();

	private entityAddedHandlers: Array<(entity: BaseNode) => void> = [];

	ecs = createECS();
	testSystem: any = null;
	transformSystem: ReturnType<typeof createTransformSystem> | null = null;
	private behaviorSystems: BehaviorSystem[] = [];
	private registeredSystemKeys: Set<symbol> = new Set();
	debugDelegate: StageDebugDelegate | null = null;
	cameraDebugDelegate: StageCameraDebugDelegate | null = null;
	private debugStateUnsubscribe: (() => void) | null = null;

	uuid: string;
	wrapperRef: Stage | null = null;
	camera?: CameraWrapper;
	cameras: CameraWrapper[] = [];
	cameraRef?: ZylemCamera | null = null;
	/** Camera manager for multi-camera support */
	cameraManagerRef: CameraManager | null = null;
	/** Shared renderer manager (injected by the game) */
	rendererManager: RendererManager | null = null;

	// Delegates
	private cameraDelegate: StageCameraDelegate;
	private loadingDelegate: StageLoadingDelegate;
	private entityModelDelegate: StageEntityModelDelegate;

	/**
	 * Create a new stage.
	 * @param options Stage options: partial config, camera, and initial entities or factories
	 */
	constructor(options: StageOptions = []) {
		super();
		this.world = null;
		this.scene = null;
		this.uuid = nanoid();

		// Initialize delegates
		this.cameraDelegate = new StageCameraDelegate(this);
		this.loadingDelegate = new StageLoadingDelegate();
		this.entityModelDelegate = new StageEntityModelDelegate();

		// Parse the options array using the stage-config module
		const parsed = parseStageOptions(options);
		this.camera = parsed.camera;
		this.cameras = parsed.cameras;
		this.children = parsed.entities;
		this.pendingEntities = parsed.asyncEntities;
		
		// Update state with resolved config
		this.saveState({
			...this.state,
			inputs: parsed.config.inputs,
			backgroundColor: parsed.config.backgroundColor,
			backgroundImage: parsed.config.backgroundImage,
			backgroundShader: parsed.config.backgroundShader,
			gravity: parsed.config.gravity,
			variables: parsed.config.variables,
			entities: [],
		});

		this.gravity = parsed.config.gravity ?? new Vector3(0, 0, 0);
	}

	private handleEntityImmediatelyOrQueue(entity: BaseNode): void {
		if (this.isLoaded) {
			this.spawnEntity(entity);
		} else {
			this.children.push(entity);
		}
	}

	private handlePromiseWithSpawnOnResolve(promise: Promise<any>): void {
		if (this.isLoaded) {
			promise
				.then((entity) => this.spawnEntity(entity))
				.catch((e) => console.error('Failed to build async entity', e));
		} else {
			this.pendingPromises.push(promise as Promise<BaseNode>);
		}
	}

	private saveState(state: StageState) {
		this.state = state;
	}

	private setState() {
		const { backgroundColor, backgroundImage } = this.state;
		const color = backgroundColor instanceof Color ? backgroundColor : new Color(backgroundColor);
		setStageBackgroundColor(color);
		setStageBackgroundImage(backgroundImage);
		// Initialize reactive stage variables on load
		setStageVariables(this.state.variables ?? {});
	}

	/**
	 * Load and initialize the stage's scene and world.
	 * Uses generator pattern to yield control to event loop for real-time progress.
	 * @param id DOM element id for the renderer container
	 * @param camera Optional camera override
	 */
	async load(id: string, camera?: ZylemCamera | null, rendererManager?: RendererManager | null) {
		this.setState();

		if (rendererManager) {
			this.rendererManager = rendererManager;
		}

		// Build camera manager first so we can use its primary camera as the
		// canonical camera reference. This avoids creating two separate default
		// camera instances (one for the scene and a different one in the manager).
		if (this.rendererManager) {
			this.cameraManagerRef = this.cameraDelegate.buildCameraManager(
				camera,
				...this.cameras
			);
		}

		// Derive the resolved camera from the camera manager's primary camera
		// (when available), otherwise fall back to the legacy single-camera path.
		const zylemCamera = this.cameraManagerRef?.primaryCamera
			?? this.cameraDelegate.resolveCamera(camera, this.camera);
		this.cameraRef = zylemCamera;
		this.scene = new ZylemScene(id, zylemCamera, this.state);

		const physicsWorld = await ZylemWorld.loadPhysics(this.gravity ?? new Vector3(0, 0, 0));
		this.world = new ZylemWorld(physicsWorld);

		// Setup scene (lighting, etc.)
		this.scene.setup();

		// Setup cameras: prefer camera manager, fall back to legacy single camera
		if (this.cameraManagerRef && this.rendererManager) {
			await this.scene.setupCameraManager(this.scene.scene, this.cameraManagerRef, this.rendererManager);
			// Setup render pass for the primary camera (WebGL post-processing)
			const primaryCam = this.cameraManagerRef.primaryCamera;
			if (primaryCam) {
				this.rendererManager.setupRenderPass(this.scene.scene, primaryCam.camera);
			}
			// Start the render loop via the renderer manager
			this.rendererManager.startRenderLoop((delta) => {
				this.cameraManagerRef?.update(delta);
				this.cameraManagerRef?.render(this.scene!.scene);
			});
		} else {
			// Legacy path: single camera manages its own renderer
			this.scene.setupCamera(this.scene.scene, zylemCamera);
		}

		this.entityModelDelegate.attach(this.scene);

		// Initialize instance manager for mesh batching
		this.instanceManager = new InstanceManager();
		this.instanceManager.setScene(this.scene.scene);

		this.loadingDelegate.emitStart();

		// Run entity loading with generator pattern for real-time progress
		await this.runEntityLoadGenerator();

		this.transformSystem = createTransformSystem(this as unknown as StageSystem);
		this.isLoaded = true;
		this.loadingDelegate.emitComplete();
	}

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

	/**
	 * Runs the entity load generator, yielding to the event loop between loads.
	 * This allows the browser to process events and update the UI in real-time.
	 */
	private runEntityLoadGenerator(): void {
		const gen = this.entityLoadGenerator();
		for (const progress of gen) {
			this.loadingDelegate.emitProgress(`Loaded ${progress.name}`, progress.current, progress.total);
			// Yield to event loop so browser can process events and update UI
			// Use setTimeout(0) for more reliable async behavior than RAF
			new Promise<void>(resolve => setTimeout(resolve, 0));
		}
	}


	protected _setup(params: SetupContext<ZylemStage>): void {
		if (!this.scene || !this.world) {
			this.logMissingEntities();
			return;
		}
		// Setup debug delegate based on current state
		this.updateDebugDelegate();

		// Subscribe to debugState changes for runtime toggle
		this.debugStateUnsubscribe = subscribe(debugState, () => {
			this.updateDebugDelegate();
		});
	}

	private updateDebugDelegate(): void {
		if (debugState.enabled && !this.debugDelegate && this.scene && this.world) {
			// Create debug delegate when debug is enabled
			this.debugDelegate = new StageDebugDelegate(this);
			
			// Create and attach camera debug delegate for orbit controls
			if (this.cameraRef && !this.cameraDebugDelegate) {
				this.cameraDebugDelegate = new StageCameraDebugDelegate(this);
				this.cameraRef.setDebugDelegate(this.cameraDebugDelegate);
			}
		} else if (!debugState.enabled && this.debugDelegate) {
			// Dispose debug delegate when debug is disabled
			this.debugDelegate.dispose();
			this.debugDelegate = null;
			
			// Detach camera debug delegate
			if (this.cameraRef) {
				this.cameraRef.setDebugDelegate(null);
			}
			this.cameraDebugDelegate = null;
		}
	}

	protected _update(params: UpdateContext<ZylemStage>): void {
		const { delta } = params;
		if (!this.scene || !this.world) {
			this.logMissingEntities();
			return;
		}
		this.world.update(params);
		// Run registered ECS behavior systems
		for (const system of this.behaviorSystems) {
			system.update(this.ecs, delta);
		}
		this._childrenMap.forEach((child, eid) => {
			child.nodeUpdate({
				...params,
				me: child,
			});
			
			// Apply pending transformations after update callbacks
			if ((child as any).transformStore) {
				applyTransformChanges(child as any, (child as any).transformStore);
			}
			
			if (child.markedForRemoval) {
				this.removeEntityByUuid(child.uuid);
			}
		});
		
		// Sync physics to rendering AFTER transforms are applied
		this.transformSystem?.system(this.ecs);
		
		// Sync instanced mesh transforms
		this.instanceManager?.update();
		this.scene.update({ delta });
		this.scene.updateSkybox(delta);
	}

	public outOfLoop() {
		this.debugUpdate();
	}

	/** Update debug overlays and helpers if enabled. */
	public debugUpdate() {
		if (debugState.enabled) {
			this.debugDelegate?.update();
		}
	}

	/** Cleanup owned resources when the stage is destroyed. */
	protected _destroy(params: DestroyContext<ZylemStage>): void {
		// Cleanup behavior systems
		for (const system of this.behaviorSystems) {
			system.destroy?.(this.ecs);
		}
		this.behaviorSystems = [];
		this.registeredSystemKeys.clear();
		this._childrenMap.forEach((child) => {
			try { child.nodeDestroy({ me: child, globals: getGlobals() }); } catch { /* noop */ }
			// Clear entity-scoped variable proxy store entries
			clearVariables(child);
		});
		this._childrenMap.clear();
		this._removalMap.clear();
		this._debugMap.clear();

		this.world?.destroy();
		this.scene?.destroy();

		// Cleanup debug state subscription
		if (this.debugStateUnsubscribe) {
			this.debugStateUnsubscribe();
			this.debugStateUnsubscribe = null;
		}

		this.debugDelegate?.dispose();
		this.debugDelegate = null;
		this.cameraRef?.setDebugDelegate(null);
		this.cameraDebugDelegate = null;

		this.entityModelDelegate.dispose();

		// Dispose instance manager
		this.instanceManager?.dispose();
		this.instanceManager = null;

		// Stop renderer render loop if using renderer manager
		if (this.rendererManager) {
			this.rendererManager.stopRenderLoop();
		}

		this.isLoaded = false;
		this.world = null as any;
		this.scene = null as any;
		this.cameraRef = null;
		this.cameraManagerRef = null;
		// Cleanup transform system
		this.transformSystem?.destroy(this.ecs);
		this.transformSystem = null;

		// Clear reactive stage variables on unload
		resetStageVariables();
		// Clear object-scoped variables for this stage
		clearVariables(this);
	}

	/**
	 * Create, register, and add an entity to the scene/world.
	 * Safe to call only after `load` when scene/world exist.
	 */
	async spawnEntity(child: BaseNode) {
		if (!this.scene || !this.world) {
			return;
		}

		// If the child is a Vessel, spawn each of its children individually
		// then register the Vessel itself so it participates in the update loop.
		if (child instanceof Vessel) {
			child.create();
			for (const childEntity of child.getChildren()) {
				if (childEntity instanceof BaseNode) {
					await this.spawnEntity(childEntity);
				}
			}
			// Assign an ECS eid so the Vessel can be tracked in _childrenMap
			const vesselEid = addEntity(this.ecs);
			child.eid = vesselEid;

			// Run vessel lifecycle after children are spawned
			child.nodeSetup({
				me: child,
				globals: getGlobals(),
				camera: this.scene.zylemCamera,
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
					const system = ref.descriptor.systemFactory({ world: this.world, ecs: this.ecs, scene: this.scene });
					this.behaviorSystems.push(system);
					this.registeredSystemKeys.add(key);
				}
			}
		}

		if (entity.colliderDesc) {
			this.world.addEntity(entity);
		}

		// Recursively spawn any BaseNode children (for nested entities)
		for (const childNode of child.getChildren()) {
			if (childNode instanceof BaseNode) {
				await this.spawnEntity(childNode);
			}
		}

		child.nodeSetup({
			me: child,
			globals: getGlobals(),
			camera: this.scene.zylemCamera,
		});

		// Register for instanced rendering if opted in
		this.tryRegisterInstance(entity);

		this.addEntityToStage(entity);
		this.entityModelDelegate.observe(entity);
	}

	/**
	 * Try to register an entity for instanced rendering.
	 * Batching is enabled by default unless explicitly disabled with batched: false.
	 */
	private tryRegisterInstance(entity: GameEntity<any>): void {
		if (!this.instanceManager) return;

		// Batching is disabled by default, must be explicitly enabled
		const options = entity.options as any;
		if (options?.batched !== true) return;

		// Need mesh with geometry and material
		if (!entity.mesh?.geometry || !entity.materials?.length) return;

		const geometry = entity.mesh.geometry;
		const material = entity.materials[0];

		// Generate batch key based on entity type and options
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

		// Register with instance manager
		const instanceId = this.instanceManager.register(entity, geometry, material, batchKey);

		if (instanceId >= 0) {
			entity.batchKey = batchKey;
			entity.instanceId = instanceId;
			entity.isInstanced = true;

			// Hide the individual mesh since it's now part of an instanced batch
			if (entity.mesh) {
				entity.mesh.visible = false;
			}
		}
	}

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

	/** Add the entity to internal maps and notify listeners. */
	addEntityToStage(entity: BaseNode) {
		this._childrenMap.set(entity.eid, entity);
		if (debugState.enabled) {
			this._debugMap.set(entity.uuid, entity);
		}
		for (const handler of this.entityAddedHandlers) {
			try {
				handler(entity);
			} catch (e) {
				console.error('onEntityAdded handler failed', e);
			}
		}
	}

	/**
	 * Subscribe to entity-added events.
	 * @param callback Invoked for each entity when added
	 * @param options.replayExisting If true and stage already loaded, replays existing entities
	 * @returns Unsubscribe function
	 */
	onEntityAdded(callback: (entity: BaseNode) => void, options?: { replayExisting?: boolean }) {
		this.entityAddedHandlers.push(callback);
		if (options?.replayExisting && this.isLoaded) {
			this._childrenMap.forEach((entity) => {
				try { callback(entity); } catch (e) { console.error('onEntityAdded replay failed', e); }
			});
		}
		return () => {
			this.entityAddedHandlers = this.entityAddedHandlers.filter((h) => h !== callback);
		};
	}

	onLoading(callback: (event: LoadingEvent) => void) {
		return this.loadingDelegate.onLoading(callback);
	}

	/**
	 * Register an ECS behavior system to run each frame.
	 * @param systemOrFactory A BehaviorSystem instance or factory function
	 * @returns this for chaining
	 */
	registerSystem(systemOrFactory: BehaviorSystem | BehaviorSystemFactory): this {
		let system: BehaviorSystem;
		if (typeof systemOrFactory === 'function') {
		system = systemOrFactory({ world: this.world, ecs: this.ecs, scene: this.scene });
		} else {
			system = systemOrFactory;
		}
		this.behaviorSystems.push(system);
		return this;
	}

	/**
	 * Remove an entity and its resources by its UUID.
	 * @returns true if removed, false if not found or stage not ready
	 */
	removeEntityByUuid(uuid: string): boolean {
		if (!this.scene || !this.world) return false;
		// Try mapping via world collision map first for physics-backed entities
		// @ts-ignore - collisionMap is public Map<string, GameEntity<any>>
		const mapEntity = this.world.collisionMap.get(uuid) as any | undefined;
		const entity: any = mapEntity ?? this._debugMap.get(uuid);
		if (!entity) return false;

		this.entityModelDelegate.unobserve(uuid);

		// Unregister from instance manager if instanced
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

		let foundKey: number | null = null;
		this._childrenMap.forEach((value, key) => {
			if ((value as any).uuid === uuid) {
				foundKey = key;
			}
		});
		if (foundKey !== null) {
			this._childrenMap.delete(foundKey);
		}
		this._debugMap.delete(uuid);
		return true;
	}

	/** Get an entity by its name; returns null if not found. */
	getEntityByName(name: string) {
		const arr = Object.entries(Object.fromEntries(this._childrenMap)).map((entry) => entry[1]);
		const entity = arr.find((child) => child.name === name);
		if (!entity) {
			console.warn(`Entity ${name} not found`);
		}
		return entity ?? null;
	}

	logMissingEntities() {
		console.warn('Zylem world or scene is null');
	}

	// ─── Camera management forwarding ─────────────────────────────────────

	/**
	 * Add a camera to this stage's camera manager.
	 */
	addCamera(camera: ZylemCamera, name?: string): string | null {
		if (!this.cameraManagerRef) {
			console.warn('ZylemStage: CameraManager not available. Ensure stage is loaded with a RendererManager.');
			return null;
		}
		return this.cameraManagerRef.addCamera(camera, name);
	}

	/**
	 * Remove a camera from this stage's camera manager.
	 */
	removeCamera(nameOrRef: string | ZylemCamera): boolean {
		return this.cameraManagerRef?.removeCamera(nameOrRef) ?? false;
	}

	/**
	 * Set the active camera by name or reference.
	 */
	setActiveCamera(nameOrRef: string | ZylemCamera): boolean {
		return this.cameraManagerRef?.setActiveCamera(nameOrRef) ?? false;
	}

	/**
	 * Get a camera by name from the camera manager.
	 */
	getCamera(name: string): ZylemCamera | null {
		return this.cameraManagerRef?.getCamera(name) ?? null;
	}

	/** Resize renderer viewport. */
	resize(width: number, height: number) {
		if (this.scene) {
			this.scene.updateRenderer(width, height);
		}
	}

	/**
	 * Enqueue items to be spawned. Items can be:
	 * - BaseNode instances (immediate or deferred until load)
	 * - Factory functions returning BaseNode or Promise<BaseNode>
	 * - Promises resolving to BaseNode
	 */
	enqueue(...items: StageEntityInput[]) {
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
}
