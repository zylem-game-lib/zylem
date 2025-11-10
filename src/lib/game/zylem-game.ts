import { state, setGlobalState, getGlobalState } from './game-state';

import { isPaused, setDebugFlag } from '../debug/debug-state';

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
import { subscribe } from 'valtio/vanilla';
import Stats from 'stats.js';
import { ZylemStage } from '../core';

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
	statsRef: { begin: () => void, end: () => void, showPanel: (panel: number) => void, dom: HTMLElement } | null = null;
	defaultCamera: ZylemCamera | null = null;
	container: HTMLElement | null = null;
	canvas: HTMLCanvasElement | null = null;
	aspectRatioDelegate: AspectRatioDelegate | null = null;
	resolvedConfig: GameConfig | null = null;
	gameCanvas: GameCanvas | null = null;

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
	}

	loadDebugOptions(options: ZylemGameOptions<TGlobals>) {
		setDebugFlag(Boolean(options.debug));

		if (options.debug) {
			this.statsRef = new Stats();
			this.statsRef.showPanel(0);
			this.statsRef.dom.style.position = 'absolute'
			this.statsRef.dom.style.bottom = '0';
			this.statsRef.dom.style.right = '0';
			this.statsRef.dom.style.top = 'auto';
			this.statsRef.dom.style.left = 'auto';
			document.body.appendChild(this.statsRef.dom);
		}
	}

	async loadStage(stage: Stage) {
		this.unloadCurrentStage();
		const config = stage.options[0] as any;

		await stage.load(this.id, config?.camera as ZylemCamera | null);

		this.stageMap.set(stage.wrappedStage!.uuid, stage);
		this.currentStageId = stage.wrappedStage!.uuid;
		this.defaultCamera = stage.wrappedStage!.cameraRef!;

		if (this.container && this.defaultCamera) {
			const dom = this.defaultCamera.getDomElement();
			const internal = this.resolvedConfig?.internalResolution;
			this.gameCanvas?.mountRenderer(dom, (cssW, cssH) => {
				if (!this.defaultCamera) return;
				if (internal) {
					this.defaultCamera.setPixelRatio(1);
					this.defaultCamera.resize(internal.width, internal.height);
				} else {
					const dpr = (window.devicePixelRatio || 1);
					this.defaultCamera.setPixelRatio(dpr);
					this.defaultCamera.resize(cssW, cssH);
				}
			});
		}
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
		}
		this.stageMap.delete(this.currentStageId);
	}

	setGlobals(options: ZylemGameConfig<Stage, ZylemGame<TGlobals>, TGlobals>) {
		this.initialGlobals = { ...(options.globals as TGlobals) };
		for (const variable in this.initialGlobals) {
			const value = this.initialGlobals[variable];
			if (value === undefined) {
				console.error(`global ${variable} is undefined`);
			}
			this.setGlobal(variable as keyof TGlobals, value);
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
			globals: state.globals as unknown as TGlobals,
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
		this.statsRef && this.statsRef.begin();
		if (!isPaused()) {
			this.timer.update(timestamp);
			const stage = this.currentStage();
			const params = this.params();
			const clampedDelta = Math.min(params.delta, ZylemGame.MAX_DELTA_SECONDS);
			const clampedParams = { ...params, delta: clampedDelta };
			if (this.customUpdate) {
				this.customUpdate(clampedParams);
			}
			if (stage) {
				stage.wrappedStage!.nodeUpdate({ ...clampedParams, me: stage!.wrappedStage as ZylemStage });
			}
			this.totalTime += clampedParams.delta;
			state.time = this.totalTime;
			this.previousTimeStamp = timestamp;
		}
		this.statsRef && this.statsRef.end();
		this.outOfLoop();
		requestAnimationFrame(this.loop.bind(this));
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

	getGlobal<K extends keyof TGlobals>(key: K) {
		return getGlobalState<TGlobals, K>(key);
	}

	setGlobal<K extends keyof TGlobals>(key: K, value: TGlobals[K]) {
		setGlobalState<TGlobals, K>(key, value);
	}

	onGlobalChange<K extends keyof TGlobals>(key: K, callback: (value: TGlobals[K]) => void) {
		let previous = getGlobalState<TGlobals, K>(key);
		subscribe(state, () => {
			const current = getGlobalState<TGlobals, K>(key);
			if (current !== previous) {
				previous = current;
				callback(current);
			}
		});
	}
}

export default ZylemGame;