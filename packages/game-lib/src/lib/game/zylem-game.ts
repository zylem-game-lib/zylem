import { state, setGlobal, getGlobals, initGlobals, resetGlobals } from './game-state';

import { debugState, isPaused, setDebugFlag } from '../debug/debug-state';

import { Game } from './game';
import { UpdateContext, SetupContext, DestroyContext } from '../core/base-node-life-cycle';
import { InputManager } from '../input/input-manager';
import { Timer } from '../core/three-addons/Timer';
import { ZylemCamera } from '~/lib/camera/zylem-camera';
import { Stage } from '../stage/stage';
import { BaseGlobals, ZylemGameConfig } from './game-interfaces';
import { GameConfig, resolveGameConfig } from './game-config';
import { AspectRatioDelegate } from '../device/aspect-ratio';
import { GameCanvas } from './game-canvas';
import { GameDebugDelegate } from './game-debug-delegate';
import { GameLoadingDelegate, GameLoadingEvent } from './game-loading-delegate';
import { gameEventBus, GameStateUpdatedPayload } from './game-event-bus';
import { zylemEventBus, type StateDispatchPayload, type StageConfigPayload, type EntityConfigPayload } from '../events';
import { GameRendererObserver } from './game-renderer-observer';
import { ZylemStage } from '../core';

export type { GameLoadingEvent };

type ZylemGameOptions<TGlobals extends BaseGlobals> = ZylemGameConfig<Stage, ZylemGame<TGlobals>, TGlobals> & Partial<GameConfig>

export class ZylemGame<TGlobals extends BaseGlobals> {
	id: string;
	initialGlobals = {} as TGlobals;

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
	defaultCamera: ZylemCamera | null = null;
	container: HTMLElement | null = null;
	canvas: HTMLCanvasElement | null = null;
	aspectRatioDelegate: AspectRatioDelegate | null = null;
	resolvedConfig: GameConfig | null = null;
	gameCanvas: GameCanvas | null = null;
	private animationFrameId: number | null = null;
	private isDisposed = false;
	private debugDelegate: GameDebugDelegate | null = null;
	private loadingDelegate: GameLoadingDelegate = new GameLoadingDelegate();
	private rendererObserver: GameRendererObserver = new GameRendererObserver();
	private eventBusUnsubscribes: (() => void)[] = [];

	static FRAME_LIMIT = 120;
	static FRAME_DURATION = 1000 / ZylemGame.FRAME_LIMIT;
	static MAX_DELTA_SECONDS = 1 / 30;

	constructor(options: ZylemGameOptions<TGlobals>, wrapperRef: Game<TGlobals>) {
		this.wrapperRef = wrapperRef;
		this.inputManager = new InputManager(options.input);
		this.timer = new Timer();
		this.timer.connect(document);
		const config = resolveGameConfig(options as any);
		console.log(config);
		this.id = config.id;
		this.stages = (config.stages as any) || [];
		this.container = config.container;
		this.canvas = config.canvas ?? null;
		this.resolvedConfig = config;
		this.loadGameCanvas(config);
		this.loadDebugOptions(options);
		this.setGlobals(options);
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

	loadStage(stage: Stage, stageIndex: number = 0): Promise<void> {
		this.unloadCurrentStage();
		const config = stage.options[0] as any;
		
		// Subscribe to stage loading events via delegate
		this.loadingDelegate.wireStageLoading(stage, stageIndex);

		// Start stage loading and return promise for backward compatibility
		return stage.load(this.id, config?.camera as ZylemCamera | null).then(() => {
			this.stageMap.set(stage.wrappedStage!.uuid, stage);
			this.currentStageId = stage.wrappedStage!.uuid;
			this.defaultCamera = stage.wrappedStage!.cameraRef!;
			
			// Trigger renderer observer with new camera
			if (this.defaultCamera) {
				this.rendererObserver.setCamera(this.defaultCamera);
			}

			// Emit state dispatch after stage is loaded so editor receives initial config
			this.emitStateDispatch('@stage:loaded');
		});
	}

	unloadCurrentStage() {
		if (!this.currentStageId) return;
		const current = this.getStage(this.currentStageId);
		if (!current) return;
		
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
		return {
			delta,
			inputs,
			globals: getGlobals<TGlobals>(),
			me: this,
			camera: camera!,
		};
	}

	start() {
		const stage = this.currentStage();
		const params = this.params();
		stage!.start({ ...params, me: stage!.wrappedStage as ZylemStage });
		if (this.customSetup) {
			this.customSetup(params);
		}
		this.loop(0);
	}

	loop(timestamp: number) {
		this.debugDelegate?.begin();
		if (!isPaused()) {
			this.timer.update(timestamp);
			const stage = this.currentStage();
			const params = this.params();
			const clampedDelta = Math.min(Math.max(params.delta, 0), ZylemGame.MAX_DELTA_SECONDS);
			const clampedParams = { ...params, delta: clampedDelta };
			if (this.customUpdate) {
				this.customUpdate(clampedParams);
			}
			if (stage && stage.wrappedStage) {
				stage.wrappedStage!.nodeUpdate({ ...clampedParams, me: stage!.wrappedStage as ZylemStage });
			}
			this.totalTime += clampedParams.delta;
			state.time = this.totalTime;
			this.previousTimeStamp = timestamp;
		}
		this.debugDelegate?.end();
		this.outOfLoop();
		if (!this.isDisposed) {
			this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
		}
	}

	dispose() {
		this.isDisposed = true;
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
	 * Build the entities payload for the current stage.
	 */
	private buildEntitiesPayload(): EntityConfigPayload[] | null {
		const stage = this.currentStage();
		if (!stage?.wrappedStage) return null;

		const entities: EntityConfigPayload[] = [];
		stage.wrappedStage._childrenMap.forEach((child) => {
			// Get type string from the entity's constructor
			const entityType = (child.constructor as any).type;
			const typeStr = entityType ? String(entityType).replace('Symbol(', '').replace(')', '') : 'Unknown';

			// Get transform data
			const position = (child as any).position ?? { x: 0, y: 0, z: 0 };
			const rotation = (child as any).rotation ?? { x: 0, y: 0, z: 0 };
			const scale = (child as any).scale ?? { x: 1, y: 1, z: 1 };

			entities.push({
				uuid: child.uuid,
				name: child.name || 'Unnamed',
				type: typeStr,
				position: { x: position.x ?? 0, y: position.y ?? 0, z: position.z ?? 0 },
				rotation: { x: rotation.x ?? 0, y: rotation.y ?? 0, z: rotation.z ?? 0 },
				scale: { x: scale.x ?? 1, y: scale.y ?? 1, z: scale.z ?? 1 },
			});
		});

		return entities;
	}

	/**
	 * Emit a state:dispatch event to the zylemEventBus.
	 * Called after stage load and on global state changes.
	 */
	private emitStateDispatch(path: string, value?: unknown, previousValue?: unknown): void {
		const statePayload: StateDispatchPayload = {
			scope: 'game',
			path,
			value,
			previousValue,
			config: this.resolvedConfig ? {
				id: this.resolvedConfig.id,
				aspectRatio: this.resolvedConfig.aspectRatio,
				fullscreen: this.resolvedConfig.fullscreen,
				bodyBackground: this.resolvedConfig.bodyBackground,
				internalResolution: this.resolvedConfig.internalResolution,
				debug: this.resolvedConfig.debug,
			} : null,
			stageConfig: this.buildStageConfigPayload(),
			entities: this.buildEntitiesPayload(),
		};
		zylemEventBus.emit('state:dispatch', statePayload);
	}

	/**
	 * Subscribe to the game event bus for stage loading and state events.
	 * Emits events to zylemEventBus for cross-package communication.
	 */
	private subscribeToEventBus(): void {
		this.eventBusUnsubscribes.push(
			gameEventBus.on('game:state:updated', (payload: GameStateUpdatedPayload) => {
				this.emitStateDispatch(payload.path, payload.value, payload.previousValue);
			}),
		);
	}
}

