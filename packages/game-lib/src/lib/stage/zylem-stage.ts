import { createWorld as createECS } from 'bitecs';
import { Color, Vector3 } from 'three';

import { ZylemWorld } from '../collision/world';
import { ZylemScene } from '../graphics/zylem-scene';
import { InstanceManager } from '../graphics/instance-manager';
import { resetStageVariables, setStageBackgroundColor, setStageBackgroundImage, setStageVariables, clearVariables, initialStageState } from './stage-state';

import { GameEntityInterface } from '../types/entity-types';
import { debugState } from '../debug/debug-state';

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
import { StageCameraDelegate } from './stage-camera-delegate';
import { StageLoadingDelegate } from './stage-loading-delegate';
import { StageEntityModelDelegate } from './stage-entity-model-delegate';
import { BaseEntityInterface } from '../types/entity-types';
import { ZylemCamera } from '../camera/zylem-camera';
import { LoadingEvent } from '../core/interfaces';
import { assetManager } from '../core/asset-manager';
import {
	parseStageOptions,
	type StageAssetLoaderConfig,
} from './stage-config';
import type { Vec3Components } from '../core/vector';
import type { BehaviorSystem, BehaviorSystemFactory } from '../behaviors/behavior-system';
import { createRuntimeDebugBindingFromDebugState } from '../runtime/runtime-debug-binding';
import type {
	RuntimeDebugBinding,
	StageRuntimeAdapter,
	StageRuntimeContext,
} from '../runtime/zylem-stage-runtime';
import { applyTransformChanges, TransformableEntity } from '../actions/capabilities/apply-transform';
import { StageEntityDelegate, StageEntityInput } from './stage-entity-delegate';
export type { LoadingEvent };

export interface ZylemStageConfig {
	inputs: Record<string, string[]>;
	backgroundColor: Color | string;
	backgroundImage: string | null;
	backgroundShader: any | null;
	gravity: Vector3 | Vec3Components;
	variables: Record<string, any>;
	/** Physics update rate in Hz (default 60). */
	physicsRate: number;
	/** Run physics in a Web Worker for true parallelism (default false). */
	usePhysicsWorker: boolean;
	/** URL to the physics worker script (required when usePhysicsWorker is true). */
	physicsWorkerUrl?: URL | string;
	/** Optional runtime loader configuration for stage-managed assets. */
	assetLoaders?: StageAssetLoaderConfig;
	/** Optional runtime adapter for wasm-driven simulation/rendering. */
	runtimeAdapter?: StageRuntimeAdapter;
	/** Optional debug binding for wasm runtime adapters (heat tint, etc.). */
	runtimeDebugBinding?: RuntimeDebugBinding;
	/**
	 * When `false`, suppress the engine's built-in ambient + directional
	 * lights so the stage owns its lighting rig entirely (usually via
	 * `createLight(...)` entities). Defaults to `true`.
	 */
	defaultLighting: boolean;
	stageRef?: Stage;
}

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
 * - Coordinate delegates for entities, camera, loading, debug, and models
 * - Drive per-frame updates and transform system
 */
export class ZylemStage extends LifeCycleBase<ZylemStage> {
	public type = STAGE_TYPE;

	state: StageState = { ...initialStageState };
	gravity: Vector3 | Vec3Components;

	world: ZylemWorld | null;
	scene: ZylemScene | null;
	instanceManager: InstanceManager | null = null;

	ecs = createECS();
	transformSystem: ReturnType<typeof createTransformSystem> | null = null;
	debugDelegate: StageDebugDelegate | null = null;

	uuid: string;
	wrapperRef: Stage | null = null;
	camera?: CameraWrapper;
	cameras: CameraWrapper[] = [];
	cameraRef?: ZylemCamera | null = null;
	/** Camera manager for multi-camera support */
	cameraManagerRef: CameraManager | null = null;
	/** Shared renderer manager (injected by the game) */
	rendererManager: RendererManager | null = null;
	runtimeAdapter: StageRuntimeAdapter | null = null;

	// Delegates
	private cameraDelegate: StageCameraDelegate;
	private loadingDelegate: StageLoadingDelegate;
	private entityModelDelegate: StageEntityModelDelegate;
	private readonly childUpdateParams = {} as UpdateContext<any>;

	/** Entity management delegate — public for external consumers (debug, transform system). */
	readonly entityDelegate: StageEntityDelegate;

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
		this.entityDelegate = new StageEntityDelegate(this.loadingDelegate, this.entityModelDelegate);

		// Parse the options array using the stage-config module
		const parsed = parseStageOptions(options);
		this.camera = parsed.camera;
		this.cameras = parsed.cameras;
		this.entityDelegate.children = parsed.entities;

		// Async entities are queued via enqueue which handles deferred loading
		if (parsed.asyncEntities.length) {
			this.entityDelegate.enqueue(...parsed.asyncEntities);
		}

		// Update state with resolved config
		this.state = {
			...this.state,
			inputs: parsed.config.inputs,
			backgroundColor: parsed.config.backgroundColor,
			backgroundImage: parsed.config.backgroundImage,
			backgroundShader: parsed.config.backgroundShader,
			gravity: parsed.config.gravity,
			variables: parsed.config.variables,
			physicsRate: parsed.config.physicsRate,
			usePhysicsWorker: parsed.config.usePhysicsWorker,
			physicsWorkerUrl: parsed.config.physicsWorkerUrl,
			assetLoaders: parsed.config.assetLoaders,
			runtimeAdapter: parsed.config.runtimeAdapter,
			runtimeDebugBinding: parsed.config.runtimeDebugBinding,
			defaultLighting: parsed.config.defaultLighting,
			entities: [],
		};

		this.gravity = parsed.config.gravity ?? new Vector3(0, 0, 0);
		this.runtimeAdapter = parsed.config.runtimeAdapter ?? null;
		if (this.runtimeAdapter && !this.state.runtimeDebugBinding) {
			this.state.runtimeDebugBinding = createRuntimeDebugBindingFromDebugState();
		}
	}

	private setState() {
		const { backgroundColor, backgroundImage } = this.state;
		const color = backgroundColor instanceof Color ? backgroundColor : new Color(backgroundColor);
		setStageBackgroundColor(color);
		setStageBackgroundImage(backgroundImage);
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
		// canonical camera reference.
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

		const gravity = this.gravity ?? new Vector3(0, 0, 0);
		if (this.state.usePhysicsWorker) {
			const workerUrl = this.state.physicsWorkerUrl
				? new URL(this.state.physicsWorkerUrl, typeof location !== 'undefined' ? location.href : undefined)
				: undefined;
			this.world = await ZylemWorld.loadPhysicsWorker(gravity, this.state.physicsRate, workerUrl);
		} else {
			const physicsWorld = await ZylemWorld.loadPhysics(gravity);
			this.world = new ZylemWorld(physicsWorld, this.state.physicsRate);
		}

		this.scene.setup();

		// Setup cameras: prefer camera manager, fall back to legacy single camera
		if (this.cameraManagerRef && this.rendererManager) {
			await this.scene.setupCameraManager(this.scene.scene, this.cameraManagerRef, this.rendererManager);
			const primaryCam = this.cameraManagerRef.primaryCamera;
			if (primaryCam) {
				this.rendererManager.setupRenderPass(this.scene.scene, primaryCam.camera);
			}
			// Camera update runs inside `_update` (after transformSystem) so it
			// always reads a freshly-synced `group.position`. The renderer loop
			// is now render-only to avoid a two-rAF race with the physics →
			// transform-sync pipeline that caused follow-cam jitter.
			this.rendererManager.startRenderLoop(() => {
				this.cameraManagerRef?.render(this.scene!.scene);
			});
		} else {
			await this.scene.setupCamera(this.scene.scene, zylemCamera);
		}

		await assetManager.configureGLTFRuntime({
			renderer: this.rendererManager?.renderer ?? zylemCamera.renderer ?? null,
			...this.state.assetLoaders?.gltf,
		});

		this.entityModelDelegate.attach(
			this.scene,
			(entity) => this.entityDelegate.handleLateModelReady(entity),
		);

		// Initialize instance manager for mesh batching
		this.instanceManager = new InstanceManager();
		this.instanceManager.setScene(this.scene.scene);

		// Attach entity delegate context now that scene/world are ready
		this.entityDelegate.attach({
			scene: this.scene,
			world: this.world,
			ecs: this.ecs,
			instanceManager: this.instanceManager,
			camera: zylemCamera,
			runtimeAdapter: this.runtimeAdapter,
		});

		this.loadingDelegate.emitStart();
		await this.entityDelegate.runEntityLoadGenerator();

		this.transformSystem = createTransformSystem({
			_childrenMap: this.entityDelegate.childrenMap,
			_world: this.world,
		} as unknown as StageSystem);
		this.entityDelegate.isLoaded = true;
		if (this.runtimeAdapter) {
			await this.runtimeAdapter.init(this.runtimeContext());
		}
		this.loadingDelegate.emitComplete();
	}

	/**
	 * Idempotency guard for `_setup`. The initial stage is currently set up
	 * twice — once when `ZylemGame.loadStage` runs for non-initial stages
	 * (so every stage gets a `StageDebugDelegate`, stage.onSetup callbacks,
	 * etc.), and once from `ZylemGame.start()` for the very first stage.
	 * Keeping a flag here lets both call sites invoke `stage.start(...)`
	 * safely; the second call is a no-op.
	 */
	public hasSetup: boolean = false;

	protected _setup(params: SetupContext<ZylemStage>): void {
		if (this.hasSetup) {
			return;
		}
		if (!this.scene || !this.world) {
			this.logMissingEntities();
			return;
		}
		// Debug delegate is self-managing — it subscribes to debugState internally
		// and activates/deactivates visuals and camera debug automatically.
		this.debugDelegate = new StageDebugDelegate(this);
		this.hasSetup = true;
	}

	protected _update(params: UpdateContext<ZylemStage>): void {
		const { delta } = params;
		if (!this.scene || !this.world) {
			this.logMissingEntities();
			return;
		}
		this.world.update(params);

		// Run registered ECS behavior systems
		for (const system of this.entityDelegate.behaviorSystems) {
			system.update(this.ecs, delta);
		}

		for (const child of this.entityDelegate.childrenMap.values()) {
			const childParams = this.childUpdateParams;
			childParams.delta = params.delta;
			childParams.inputs = params.inputs;
			childParams.globals = params.globals;
			childParams.camera = params.camera;
			childParams.stage = params.stage;
			childParams.game = params.game;
			childParams.me = child;
			child.nodeUpdate(childParams);

			// Apply pending transformations after update callbacks
			const transformable = child as unknown as TransformableEntity;
			if (transformable.transformStore) {
				applyTransformChanges(transformable, transformable.transformStore);
			}

			if (child.markedForRemoval) {
				this.entityDelegate.removeEntityByUuid(child.uuid);
			}
		}

		// Sync physics to rendering AFTER transforms are applied
		this.transformSystem?.system(this.ecs);

		if (this.runtimeAdapter) {
			this.runtimeAdapter.step({
				...this.runtimeContext(),
				delta,
				inputs: params.inputs,
			});
		}

		// Sync instanced mesh transforms
		this.instanceManager?.update();

		// Update cameras here — strictly AFTER transformSystem writes
		// `group.position` — so follow-cameras read this frame's synced pose,
		// not the previous frame's. The renderer loop is render-only.
		if (this.cameraManagerRef) {
			this.cameraManagerRef.update(delta);
		} else {
			this.cameraRef?.update(delta);
		}

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
		this.runtimeAdapter?.destroy(this.scene && this.world ? this.runtimeContext() : null);
		this.runtimeAdapter = null;

		// Delegate handles entity + behavior system cleanup
		this.entityDelegate.destroyAll();

		this.world?.destroy();
		this.scene?.destroy();

		// Debug delegate handles its own unsubscription and cleanup
		this.debugDelegate?.dispose();
		this.debugDelegate = null;

		this.entityModelDelegate.dispose();

		// Dispose instance manager
		this.instanceManager?.dispose();
		this.instanceManager = null;

		// Stop renderer render loop if using renderer manager
		if (this.rendererManager) {
			this.rendererManager.stopRenderLoop();
		}

		this.world = null as any;
		this.scene = null as any;
		this.cameraRef = null;
		this.cameraManagerRef = null;

		// Cleanup transform system
		this.transformSystem?.destroy(this.ecs);
		this.transformSystem = null;

		// Clear reactive stage variables on unload
		resetStageVariables();
		clearVariables(this);
	}

	// ─── Forwarding API ──────────────────────────────────────────────────────

	/** Forward to entity delegate. */
	async spawnEntity(child: BaseNode) {
		return this.entityDelegate.spawnEntity(child);
	}

	/** Forward to entity delegate. */
	buildEntityState(child: BaseNode): Partial<BaseEntityInterface> {
		return this.entityDelegate.buildEntityState(child);
	}

	/** Forward to entity delegate. */
	onEntityAdded(callback: (entity: BaseNode) => void, options?: { replayExisting?: boolean }) {
		return this.entityDelegate.onEntityAdded(callback, options);
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
		this.entityDelegate.registerSystem(systemOrFactory);
		return this;
	}

	/** Forward to entity delegate. */
	removeEntityByUuid(uuid: string): boolean {
		return this.entityDelegate.removeEntityByUuid(uuid);
	}

	/** Forward to entity delegate. */
	getEntityByName(name: string) {
		return this.entityDelegate.getEntityByName(name);
	}

	/** Forward to entity delegate. */
	enqueue(...items: StageEntityInput[]) {
		this.entityDelegate.enqueue(...items);
	}

	logMissingEntities() {
		console.warn('Zylem world or scene is null');
	}

	private runtimeContext(): StageRuntimeContext {
		return {
			scene: this.scene!,
			world: this.world!,
			ecs: this.ecs,
			camera: this.cameraRef!,
			debug: this.state.runtimeDebugBinding,
		};
	}

	// ─── Camera management forwarding ─────────────────────────────────────

	/** Add a camera to this stage's camera manager. */
	addCamera(camera: ZylemCamera, name?: string): string | null {
		if (!this.cameraManagerRef) {
			console.warn('ZylemStage: CameraManager not available. Ensure stage is loaded with a RendererManager.');
			return null;
		}
		return this.cameraManagerRef.addCamera(camera, name);
	}

	/** Remove a camera from this stage's camera manager. */
	removeCamera(nameOrRef: string | ZylemCamera): boolean {
		return this.cameraManagerRef?.removeCamera(nameOrRef) ?? false;
	}

	/** Set the active camera by name or reference. */
	setActiveCamera(nameOrRef: string | ZylemCamera): boolean {
		return this.cameraManagerRef?.setActiveCamera(nameOrRef) ?? false;
	}

	/** Get a camera by name from the camera manager. */
	getCamera(name: string): ZylemCamera | null {
		return this.cameraManagerRef?.getCamera(name) ?? null;
	}

	/** Resize renderer viewport. */
	resize(width: number, height: number) {
		if (this.scene) {
			this.scene.updateRenderer(width, height);
		}
	}
}
