import { state, setGlobal, getGlobals, initGlobals, resetGlobals } from './game-state';

import { debugState, isPaused, setDebugFlag } from '../debug/debug-state';
import { entityThumbnailCache } from '../debug/entity-thumbnail';

import { Game } from './game';
import { UpdateContext, SetupContext, DestroyContext } from '../core/base-node-life-cycle';
import { InputManager } from '../input/input-manager';
import { mergeInputConfigs } from '../input/input-presets';
import { Timer } from '../core/three-addons/Timer';
import { ZylemCamera } from '~/lib/camera/zylem-camera';
import { RendererManager } from '../camera/renderer-manager';
import { Stage } from '../stage/stage';
import { BaseGlobals, GameInputConfig, ZylemGameConfig } from './game-interfaces';
import {
	GameConfig,
	resolveGameConfig,
	type ResolveGameConfigRuntime,
} from './game-config';
import { AspectRatioDelegate } from '../device/aspect-ratio';
import { GameCanvas } from './game-canvas';
import { GameDebugDelegate } from './game-debug-delegate';
import { GameLoadingDelegate, GameLoadingEvent } from './game-loading-delegate';
import { gameEventBus, GameStateUpdatedPayload } from './game-event-bus';
import { zylemEventBus } from '../events';
import { GameBridge, readEntityScale } from '../bridge/game-bridge';
import type { GameEntity } from '../entities/entity';
import { getZylemBridge } from '@zylem/bridge';
import type {
	EntitySummaryPayload,
	GameConfigPayload,
	StageConfigPayload,
} from '@zylem/bridge';
import { GameRendererObserver } from './game-renderer-observer';
import { ZylemStage } from '../core';
import {
	resolveStageTransition,
	type StageTransitionConfig,
} from '../graphics/stage-transition';
import { usesManagedRenderPath } from '../graphics/render-category';

export type { GameLoadingEvent };

type ZylemGameOptions<TGlobals extends BaseGlobals> = ZylemGameConfig<Stage, ZylemGame<TGlobals>, TGlobals> & Partial<GameConfig>

// TODO: need to split this up into delegate classes
export class ZylemGame<TGlobals extends BaseGlobals> {
	id: string;
	initialGlobals = {} as TGlobals;

	// TODO: these should be unecessary given a delegate or inherited from base node
	customSetup: ((params: SetupContext<ZylemGame<TGlobals>, TGlobals>) => void) | null = null;
	customUpdate: ((params: UpdateContext<ZylemGame<TGlobals>, TGlobals>) => void) | null = null;
	customDestroy: ((params: DestroyContext<ZylemGame<TGlobals>, TGlobals>) => void) | null = null;

	stages: Stage[] = [];
	stageMap: Map<string, Stage> = new Map();
	currentStageId = '';

	previousTimeStamp: number = 0;
	totalTime = 0;

	timer: Timer;
	inputManager: InputManager;

	wrapperRef: Game<TGlobals>;
	globalInputConfig: GameInputConfig | undefined;
	defaultCamera: ZylemCamera | null = null;
	/** Shared renderer manager for all stages */
	rendererManager: RendererManager | null = null;
	container: HTMLElement | null = null;
	canvas: HTMLCanvasElement | null = null;
	aspectRatioDelegate: AspectRatioDelegate | null = null;
	resolvedConfig: GameConfig | null = null;
	gameCanvas: GameCanvas | null = null;
	private animationFrameId: number | null = null;
	private isDisposed = false;
	/**
	 * True while a `loadStage` is in progress. Used to reject re-entrant stage
	 * navigation (e.g. a button press during a transition), which would race
	 * two loads on `stageMap`/the render loop and, because `currentStageId` is
	 * transiently `''`, misresolve the target stage.
	 */
	private loadInFlight = false;
	/**
	 * True once `start()` has been invoked for this game's initial stage.
	 * Used by `loadStage` to decide whether to drive the stage's `_setup`
	 * lifecycle directly (for subsequent stages loaded via `nextStage`
	 * / `loadStage`) or defer to `start()` (for the very first stage).
	 */
	private hasStarted = false;
	private debugDelegate: GameDebugDelegate | null = null;
	private loadingDelegate: GameLoadingDelegate = new GameLoadingDelegate();
	private rendererObserver: GameRendererObserver = new GameRendererObserver();
	private eventBusUnsubscribes: (() => void)[] = [];
	private thumbnailUnsubscribes: (() => void)[] = [];
	/** Serialized last-published game config, for dirty-checking resize churn. */
	private lastPublishedGameConfig: string | null = null;
	/** Editor ↔ game bridge adapter (RAF-coalesced publishes, command intake). */
	private gameBridge = new GameBridge();
	private readonly gameUpdateParams = {} as UpdateContext<
		ZylemGame<TGlobals>,
		TGlobals
	>;
	private readonly stageSetupParams = {} as SetupContext<ZylemStage, TGlobals>;
	private readonly stageUpdateParams = {} as UpdateContext<ZylemStage, TGlobals>;
	private readonly frameCallback = (timestamp: number) => this.loop(timestamp);
	private readonly sourceOptions: ZylemGameOptions<TGlobals>;
	private displayRuntime: ResolveGameConfigRuntime;

	static FRAME_LIMIT = 120;
	static FRAME_DURATION = 1000 / ZylemGame.FRAME_LIMIT;
	static MAX_DELTA_SECONDS = 1 / 30;

	constructor(
		options: ZylemGameOptions<TGlobals>,
		wrapperRef: Game<TGlobals>,
		displayRuntime: ResolveGameConfigRuntime = {},
	) {
		this.wrapperRef = wrapperRef;
		this.timer = new Timer();
		this.timer.connect(document);
		this.sourceOptions = { ...options };
		this.displayRuntime = { ...displayRuntime };

		const config = resolveGameConfig(options as any, this.displayRuntime);

		this.globalInputConfig = config.input;
		this.id = config.id;
		this.stages = (config.stages as any) || [];
		this.container = config.container;
		this.canvas = config.canvas ?? null;
		this.resolvedConfig = config;
		this.loadGameCanvas(config);
		this.container = this.gameCanvas?.container ?? this.container;
		this.inputManager = new InputManager(config.input, {
			targetElement: this.gameCanvas?.getOverlayContainer(),
			mouseTargetElement: this.gameCanvas?.container,
		});
		this.loadDebugOptions(options);
		this.setGlobals(options);
		this.gameBridge.connect({
			resolveEntity: (uuid) =>
				(this.currentStage()?.wrappedStage?.entityDelegate.childrenMap.get(uuid)
					?? null) as GameEntity<any> | null,
			setStageVariable: (key, value) => {
				const stageState = this.currentStage()?.wrappedStage?.state;
				if (stageState) {
					stageState.variables[key] = value;
				}
			},
		});
	}

	setDisplayRuntime(runtime: ResolveGameConfigRuntime): void {
		this.displayRuntime = { ...runtime };
		const nextConfig = resolveGameConfig(this.sourceOptions as any, this.displayRuntime);
		this.resolvedConfig = nextConfig;
		this.rendererObserver.setConfig(nextConfig);
		this.gameCanvas?.setAspectRatio(nextConfig.aspectRatio);
		this.publishGameConfig();
	}

	loadGameCanvas(config: GameConfig) {
		this.gameCanvas = new GameCanvas({
			id: config.id,
			container: config.container,
			containerId: config.containerId,
			canvas: this.canvas ?? undefined,
			bodyBackground: config.bodyBackground,
			fullscreen: config.fullscreen,
			aspectRatio: config.aspectRatio,
		});
		this.gameCanvas.applyBodyBackground();
		this.gameCanvas.mountCanvas();
		this.gameCanvas.centerIfFullscreen();
		
		// Setup renderer observer
		this.rendererObserver.setGameCanvas(this.gameCanvas);
		if (this.resolvedConfig) {
			this.rendererObserver.setConfig(this.resolvedConfig);
		}
		if (this.container) {
			this.rendererObserver.setContainer(this.container);
		}
		
		// Subscribe to event bus for stage loading events
		this.subscribeToEventBus();
	}

	loadDebugOptions(options: ZylemGameOptions<TGlobals>) {
		if (options.debug !== undefined) {
			debugState.enabled = Boolean(options.debug);
		}
		this.debugDelegate = new GameDebugDelegate();
	}

	/** Whether a stage load is currently in progress. */
	isLoading(): boolean {
		return this.loadInFlight;
	}

	async loadStage(
		stage: Stage,
		stageIndex: number = 0,
		transition?: StageTransitionConfig,
	): Promise<void> {
		if (this.loadInFlight) {
			console.warn('loadStage ignored: a stage load is already in progress');
			return;
		}
		this.loadInFlight = true;
		try {
			await this.performLoadStage(stage, stageIndex, transition);
		} finally {
			this.loadInFlight = false;
		}
	}

	private async performLoadStage(
		stage: Stage,
		stageIndex: number = 0,
		transition?: StageTransitionConfig,
	): Promise<void> {
		const resolved = transition ? resolveStageTransition(transition) : null;
		const outgoing = this.currentStage() ?? null;
		const outgoingRuntime = outgoing?.wrappedStage ?? null;
		const outgoingScene = outgoingRuntime?.scene?.scene ?? null;
		const outgoingCamera =
			outgoingRuntime?.cameraManagerRef?.primaryCamera?.camera
			?? outgoingRuntime?.cameraRef?.camera
			?? null;
		// A transition needs an initialized renderer and a live outgoing stage
		// to blend from (the initial stage load has neither).
		const canTransition = Boolean(
			resolved
			&& this.rendererManager?.initialized
			&& outgoing
			&& outgoingScene
			&& outgoingCamera,
		);

		if (canTransition) {
			// Freeze the outgoing stage's final frame before tearing it
			// down; the blend starts once the new stage renders.
			this.rendererManager!.beginSnapshotTransition(resolved!, outgoingScene!, outgoingCamera!);
		}
		this.unloadCurrentStage();

		const config = stage.options[0] as any;
		
		// Subscribe to stage loading events via delegate
		this.loadingDelegate.wireStageLoading(stage, stageIndex);

		// Lazily create the shared renderer manager. game-lib always renders
		// with WebGPU (Three.js keeps its own internal WebGL2 fallback).
		if (!this.rendererManager) {
			this.rendererManager = new RendererManager();
			await this.rendererManager.initRenderer();
		}

		entityThumbnailCache.setRenderer(this.rendererManager.renderer);

		// Start stage loading with shared renderer manager
		await stage.load(this.id, config?.camera as ZylemCamera | null, this.rendererManager);

		this.stageMap.set(stage.wrappedStage!.uuid, stage);
		this.currentStageId = stage.wrappedStage!.uuid;
		this.defaultCamera = stage.wrappedStage!.cameraRef!;

		this.wireEntityThumbnails(stage);
		
		// Trigger renderer observer with renderer manager
		this.rendererObserver.setStage(stage.wrappedStage ?? null);
		if (this.rendererManager) {
			this.rendererObserver.setRendererManager(this.rendererManager);
		}

		// Apply merged input configuration (global + stage overrides)
		this.applyInputConfig(stage);

		// Wire callback so runtime changes to stage input config take effect immediately
		stage.onInputConfigChanged = () => this.applyInputConfig(stage);

		// For stages loaded AFTER `start()` has already run (e.g. via
		// `game.nextStage()` or a direct `loadStage` call), drive the
		// stage's `_setup` lifecycle here. Without this, only the initial
		// stage ever got `StageDebugDelegate`, `onSetup` callbacks, etc.
		// The initial stage is still routed through `start()` unchanged.
		if (this.hasStarted && stage.wrappedStage && !stage.wrappedStage.hasSetup) {
			const params = this.params();
			const setupParams = { ...this.stageSetupParams };
			setupParams.inputs = params.inputs;
			setupParams.globals = params.globals;
			setupParams.camera = params.camera;
			setupParams.stage = params.stage;
			setupParams.game = params.game;
			setupParams.me = stage.wrappedStage;
			stage.start(setupParams);
		}

		// Publish config + full stage snapshot so the editor receives initial state
		this.publishGameConfig();
		this.publishStageSnapshot();
	}

	/**
	 * Merges game-level global input config with the stage's per-stage overrides
	 * and reconfigures the InputManager.
	 */
	applyInputConfig(stage: Stage): void {
		const merged = mergeInputConfigs(
			this.globalInputConfig ?? {},
			stage.inputConfig ?? {},
		);
		this.inputManager.configure(merged);
	}

	/**
	 * Update the game-level global input config and re-apply to the current stage.
	 */
	setGlobalInputConfig(config: GameInputConfig): void {
		this.globalInputConfig = config;
		const stage = this.currentStage();
		if (stage) {
			this.applyInputConfig(stage);
		}
	}

	unloadCurrentStage() {
		if (!this.currentStageId) return;
		const current = this.getStage(this.currentStageId);
		if (!current) return;

		this.clearEntityThumbnailWiring();
		entityThumbnailCache.clear();

		// Disconnect input config callback from outgoing stage
		current.onInputConfigChanged = null;

		if (current?.wrappedStage) {
			try {
				current.wrappedStage.nodeDestroy({
					me: current.wrappedStage,
					globals: state.globals as unknown as TGlobals,
				});
			} catch (e) {
				console.error('Failed to destroy previous stage', e);
			}
			// Clear the Stage wrapper's reference to the destroyed stage
			current.wrappedStage = null;
		}

		// Dispose Stage wrapper event delegate to prevent listener accumulation
		current.dispose();
		
		// Remove from stage map
		this.stageMap.delete(this.currentStageId);
		
		// Reset game state
		this.currentStageId = '';
		this.defaultCamera = null;
		
		// Reset renderer observer for stage transitions
		this.rendererObserver.reset();
	}

	setGlobals(options: ZylemGameConfig<Stage, ZylemGame<TGlobals>, TGlobals>) {
		this.initialGlobals = { ...(options.globals as TGlobals) };
		for (const variable in this.initialGlobals) {
			const value = this.initialGlobals[variable];
			if (value === undefined) {
				console.error(`global ${variable} is undefined`);
			}
			setGlobal(variable, value);
		}
	}

	params(): UpdateContext<ZylemGame<TGlobals>, TGlobals> {
		const stage = this.currentStage();
		const delta = this.timer.getDelta();
		const inputs = this.inputManager.getInputs(delta);
		const camera = stage?.wrappedStage?.cameraRef || this.defaultCamera;

		const params = this.gameUpdateParams;
		params.delta = delta;
		params.inputs = inputs;
		params.globals = getGlobals<TGlobals>();
		params.me = this;
		params.camera = camera!;
		params.stage = stage as any;
		params.game = this.wrapperRef;
		return params;
	}

	start() {
		const stage = this.currentStage();
		const params = this.params();
		const setupParams = this.stageSetupParams;
		setupParams.inputs = params.inputs;
		setupParams.globals = params.globals;
		setupParams.camera = params.camera;
		setupParams.stage = params.stage;
		setupParams.game = params.game;
		setupParams.me = stage!.wrappedStage as ZylemStage;
		stage!.start(setupParams);
		if (this.customSetup) {
			this.customSetup(params);
		}
		this.hasStarted = true;
		this.loop(0);
	}

	/**
	 * Execute a single frame update.
	 * This method can be called directly for testing or from the game loop.
	 * @param deltaTime Optional delta time in seconds. If not provided, uses timer delta.
	 */
	step(deltaTime?: number): void {
		const stage = this.currentStage();
		if (!stage || !stage.wrappedStage) return;

		const params = this.params();
		const delta = deltaTime !== undefined ? deltaTime : params.delta;
		const clampedDelta = Math.min(Math.max(delta, 0), ZylemGame.MAX_DELTA_SECONDS);
		params.delta = clampedDelta;

		if (this.customUpdate) {
			this.customUpdate(params);
		}

		// The game update callback may have triggered a stage change (e.g.
		// `game.nextStage()` with a transition, which synchronously detaches
		// the current stage). If so, don't push an update into the now-detached
		// or not-yet-loaded stage this frame.
		const activeStage = this.currentStage();
		if (activeStage !== stage || !activeStage?.wrappedStage) {
			this.totalTime += clampedDelta;
			state.time = this.totalTime;
			return;
		}

		const stageParams = this.stageUpdateParams;
		stageParams.delta = params.delta;
		stageParams.inputs = params.inputs;
		stageParams.globals = params.globals;
		stageParams.camera = params.camera;
		stageParams.stage = params.stage;
		stageParams.game = params.game;
		stageParams.me = stage.wrappedStage as ZylemStage;
		stage.wrappedStage?.nodeUpdate(stageParams);

		this.totalTime += clampedDelta;
		state.time = this.totalTime;
	}

	loop(timestamp: number) {
		this.debugDelegate?.begin();
		if (!isPaused()) {
			this.timer.update(timestamp);
			this.step();
			this.previousTimeStamp = timestamp;
		}
		this.debugDelegate?.end();
		this.outOfLoop();
		if (!this.isDisposed) {
			this.animationFrameId = requestAnimationFrame(this.frameCallback);
		}
	}

	dispose() {
		this.isDisposed = true;
		this.gameBridge.disconnect();
		if (this.animationFrameId !== null) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}

		this.unloadCurrentStage();

		if (this.debugDelegate) {
			this.debugDelegate.dispose();
			this.debugDelegate = null;
		}

		this.eventBusUnsubscribes.forEach(unsub => unsub());
		this.eventBusUnsubscribes = [];

		this.rendererObserver.dispose();

		this.inputManager.dispose();

		// Dispose the shared renderer manager
		if (this.rendererManager) {
			entityThumbnailCache.setRenderer(null);
			this.rendererManager.dispose();
			this.rendererManager = null;
		}
		entityThumbnailCache.clear();

		// The bridge lives on globalThis, so retained hydration state would
		// otherwise outlive this game and leak into the next one.
		getZylemBridge().channel.reset();

		this.timer.dispose();

		if (this.customDestroy) {
			this.customDestroy({
				me: this,
				globals: state.globals as unknown as TGlobals
			});
		}
		resetGlobals();
	}

	outOfLoop() {
		const currentStage = this.currentStage();
		if (!currentStage) return;
		currentStage.wrappedStage!.outOfLoop();
	}

	getStage(id: string) {
		return this.stageMap.get(id);
	}

	currentStage() {
		return this.getStage(this.currentStageId);
	}

	/**
	 * Subscribe to loading events from the game.
	 * Events include stage context (stageName, stageIndex).
	 * @param callback Invoked for each loading event
	 * @returns Unsubscribe function
	 */
	onLoading(callback: (event: GameLoadingEvent) => void): () => void {
		return this.loadingDelegate.onLoading(callback);
	}

	/**
	 * Build the stage config payload for the current stage.
	 */
	private buildStageConfigPayload(): StageConfigPayload | null {
		const stage = this.currentStage();
		if (!stage?.wrappedStage) return null;

		const state = stage.wrappedStage.state;
		const bgColor = state.backgroundColor;
		const colorStr = typeof bgColor === 'string' ? bgColor : `#${bgColor.getHexString()}`;

		return {
			id: stage.wrappedStage.uuid,
			backgroundColor: colorStr,
			backgroundImage: state.backgroundImage,
			gravity: {
				x: state.gravity.x,
				y: state.gravity.y,
				z: state.gravity.z,
			},
			inputs: state.inputs,
			variables: state.variables,
		};
	}

	/**
	 * Build a bridge entity summary for one entity, or null for entities on
	 * the managed render path (instanced packs/bundles), which can number in
	 * the thousands and are not useful in the editor panel.
	 */
	private buildEntitySummary(child: { uuid: string; name?: string; constructor: unknown }): EntitySummaryPayload | null {
		if (usesManagedRenderPath((child as { options?: unknown }).options as any)) {
			return null;
		}

		// Get type string from the entity's constructor
		const entityType = (child.constructor as any).type;
		const typeStr = entityType ? String(entityType).replace('Symbol(', '').replace(')', '') : 'Unknown';

		// Get transform data. Scale lives on the render object rather than the
		// entity, so read it the same way `entity:transform` writes it.
		const position = (child as any).position ?? { x: 0, y: 0, z: 0 };
		const rotation = (child as any).rotation ?? { x: 0, y: 0, z: 0 };
		const scale = readEntityScale(child);

		const thumb = entityThumbnailCache.get(child.uuid);

		return {
			uuid: child.uuid,
			name: child.name || 'Unnamed',
			type: typeStr,
			position: { x: position.x ?? 0, y: position.y ?? 0, z: position.z ?? 0 },
			rotation: { x: rotation.x ?? 0, y: rotation.y ?? 0, z: rotation.z ?? 0 },
			scale,
			thumbnail: thumb?.dataUrl ?? null,
			bounds: thumb?.bounds,
		};
	}

	/**
	 * Build the full entities payload for the current stage.
	 */
	private buildEntitiesPayload(): EntitySummaryPayload[] {
		const stage = this.currentStage();
		if (!stage?.wrappedStage) return [];

		const entities: EntitySummaryPayload[] = [];
		stage.wrappedStage.entityDelegate.childrenMap.forEach((child) => {
			const summary = this.buildEntitySummary(child as any);
			if (summary) entities.push(summary);
		});
		return entities;
	}

	/**
	 * Generate entity thumbnails as entities become available, streaming
	 * upserts/thumbnails/removals to the editor through the bridge
	 * (RAF-coalesced, merged by uuid).
	 *
	 * All of this work exists only to feed the editor, and thumbnails in
	 * particular cost an offscreen render plus a pixel readback on the shared
	 * renderer. Each publisher therefore checks the bridge for a live listener
	 * first, and a late-connecting editor is backfilled from
	 * {@link wireEditorBackfill}.
	 */
	private wireEntityThumbnails(stage: Stage): void {
		this.clearEntityThumbnailWiring();
		if (!stage.wrappedStage) return;

		const queueThumbnail = (child: { uuid: string; group?: any; mesh?: any; options?: any }) => {
			if (!this.gameBridge.wantsThumbnails()) return;
			// Managed-render entities (instanced packs / bundles) can number in
			// the thousands and are visually identical; per-entity offscreen
			// thumbnail renders + PNG encodes would swamp the main thread.
			if (usesManagedRenderPath(child.options)) return;
			const object = child.group ?? child.mesh ?? null;
			if (!object) return;
			void entityThumbnailCache.ensure(child.uuid, object).then((result) => {
				if (result && !this.isDisposed) {
					this.gameBridge.queueThumbnails([{
						uuid: child.uuid,
						url: result.dataUrl,
						bounds: result.bounds,
					}]);
				}
			});
		};

		const unsubAdded = stage.wrappedStage.onEntityAdded((child) => {
			if (this.gameBridge.wantsEntityUpdates()) {
				const summary = this.buildEntitySummary(child as any);
				if (summary) {
					this.gameBridge.queueEntityUpsert([summary]);
				}
			}
			queueThumbnail(child as any);
		}, { replayExisting: true });
		this.thumbnailUnsubscribes.push(unsubAdded);

		const onModelLoaded = (payload: { entityId: string; success: boolean }) => {
			if (!payload.success) return;
			const child = stage.wrappedStage?.entityDelegate.childrenMap.get(payload.entityId);
			if (child) {
				entityThumbnailCache.invalidate(payload.entityId);
				queueThumbnail(child as any);
			}
		};
		zylemEventBus.on('entity:model:loaded', onModelLoaded);
		this.thumbnailUnsubscribes.push(() => {
			zylemEventBus.off('entity:model:loaded', onModelLoaded);
		});

		const onDestroyed = (payload: { entityId: string }) => {
			// Always invalidate, even with no editor attached: the cache would
			// otherwise retain a PNG for every entity the game ever spawned.
			entityThumbnailCache.invalidate(payload.entityId);
			if (this.gameBridge.wantsEntityUpdates()) {
				this.gameBridge.queueEntityRemoved([payload.entityId]);
			}
		};
		zylemEventBus.on('entity:destroyed', onDestroyed);
		this.thumbnailUnsubscribes.push(() => {
			zylemEventBus.off('entity:destroyed', onDestroyed);
		});

		this.wireEditorBackfill(stage);
	}

	/**
	 * Republish the current stage when an editor subscribes after the game
	 * started. Without this, entities added while nothing was listening would
	 * never appear, since the per-entity publishers were skipped.
	 */
	private wireEditorBackfill(stage: Stage): void {
		const unsubscribe = this.gameBridge.onEditorAttached(() => {
			if (this.isDisposed || this.currentStage() !== stage) return;
			// A newly attached editor has seen nothing, so bypass dirty-checking.
			this.lastPublishedGameConfig = null;
			this.publishGameConfig();
			this.publishStageSnapshot();
			for (const child of stage.wrappedStage?.entityDelegate.childrenMap.values() ?? []) {
				const entity = child as { uuid: string; group?: any; mesh?: any; options?: any };
				if (usesManagedRenderPath(entity.options)) continue;
				const object = entity.group ?? entity.mesh ?? null;
				if (!object) continue;
				void entityThumbnailCache.ensure(entity.uuid, object).then((result) => {
					if (result && !this.isDisposed) {
						this.gameBridge.queueThumbnails([{
							uuid: entity.uuid,
							url: result.dataUrl,
							bounds: result.bounds,
						}]);
					}
				});
			}
		});
		this.thumbnailUnsubscribes.push(unsubscribe);
	}

	private clearEntityThumbnailWiring(): void {
		this.thumbnailUnsubscribes.forEach((fn) => {
			try {
				fn();
			} catch { /* noop */ }
		});
		this.thumbnailUnsubscribes = [];
	}

	private buildGameConfigPayload(): GameConfigPayload | null {
		if (!this.resolvedConfig) return null;
		return {
			id: this.resolvedConfig.id,
			aspectRatio: this.resolvedConfig.aspectRatio,
			fullscreen: this.resolvedConfig.fullscreen,
			bodyBackground: this.resolvedConfig.bodyBackground,
			internalResolution: this.resolvedConfig.internalResolution,
			debug: this.resolvedConfig.debug,
		};
	}

	/** Publish the resolved display config over the bridge. */
	/**
	 * Publish the display config, skipping unchanged payloads. The
	 * `ResizeObserver` on `<zylem-game>` funnels into `setDisplayRuntime`, which
	 * fires on every layout tick even when nothing about the config moved.
	 */
	private publishGameConfig(): void {
		const config = this.buildGameConfigPayload();
		if (!config) return;

		const serialized = JSON.stringify(config);
		if (serialized === this.lastPublishedGameConfig) return;
		this.lastPublishedGameConfig = serialized;
		this.gameBridge.publishConfig(config);
	}

	/** Publish a full stage snapshot (config + entity list) over the bridge. */
	private publishStageSnapshot(): void {
		this.gameBridge.publishStageSnapshot({
			stage: this.buildStageConfigPayload(),
			entities: this.buildEntitiesPayload(),
		});
	}

	/**
	 * Subscribe to the game event bus for stage loading and state events,
	 * mirroring global-variable updates to the editor over the bridge.
	 */
	private subscribeToEventBus(): void {
		this.eventBusUnsubscribes.push(
			gameEventBus.on('game:state:updated', (payload: GameStateUpdatedPayload) => {
				this.gameBridge.publishVariable({
					path: payload.path,
					value: payload.value,
					previousValue: payload.previousValue,
				});
			}),
		);
	}
}
