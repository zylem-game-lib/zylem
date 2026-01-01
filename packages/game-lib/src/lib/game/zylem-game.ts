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
import { GameLoadingDelegate, GameLoadingEvent, GAME_LOADING_EVENT } from './game-loading-delegate';
import { gameEventBus, StageLoadingPayload, GameStateUpdatedPayload } from './game-event-bus';
import { GameRendererObserver } from './game-renderer-observer';
import { ZylemStage } from '../core';

export type { GameLoadingEvent };

/** Window event name for state dispatch events. */
export const ZYLEM_STATE_DISPATCH = 'zylem:state:dispatch';

/** State dispatch event detail structure. */
export interface StateDispatchEvent {
	scope: 'game' | 'stage' | 'entity';
	path: string;
	value: unknown;
	previousValue?: unknown;
}

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

		// Cleanup debug delegate
		if (this.debugDelegate) {
			this.debugDelegate.dispose();
			this.debugDelegate = null;
		}

		// Cleanup event bus subscriptions
		this.eventBusUnsubscribes.forEach(unsub => unsub());
		this.eventBusUnsubscribes = [];

		// Cleanup renderer observer
		this.rendererObserver.dispose();

		this.timer.dispose();

		if (this.customDestroy) {
			this.customDestroy({
				me: this,
				globals: state.globals as unknown as TGlobals
			});
		}

		// Clear global state
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
	 * Subscribe to the game event bus for stage loading and state events.
	 * Emits window events for cross-application communication.
	 */
	private subscribeToEventBus(): void {
		const emitLoadingWindowEvent = (payload: StageLoadingPayload) => {
			if (typeof window !== 'undefined') {
				const event: GameLoadingEvent = {
					type: payload.type,
					message: payload.message ?? '',
					progress: payload.progress ?? 0,
					current: payload.current,
					total: payload.total,
					stageName: payload.stageName,
					stageIndex: payload.stageIndex,
				};
				window.dispatchEvent(new CustomEvent(GAME_LOADING_EVENT, { detail: event }));
			}
		};

		const emitStateDispatchEvent = (payload: GameStateUpdatedPayload) => {
			if (typeof window !== 'undefined') {
				const detail: StateDispatchEvent = {
					scope: 'game',
					path: payload.path,
					value: payload.value,
					previousValue: payload.previousValue,
				};
				window.dispatchEvent(new CustomEvent(ZYLEM_STATE_DISPATCH, { detail }));
			}
		};

		this.eventBusUnsubscribes.push(
			gameEventBus.on('stage:loading:start', emitLoadingWindowEvent),
			gameEventBus.on('stage:loading:progress', emitLoadingWindowEvent),
			gameEventBus.on('stage:loading:complete', emitLoadingWindowEvent),
			gameEventBus.on('game:state:updated', emitStateDispatchEvent),
		);
	}
}

