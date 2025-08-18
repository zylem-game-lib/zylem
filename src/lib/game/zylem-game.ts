import { state, setGlobalState, getGlobalState } from './game-state';

import { isPaused, setDebugFlag } from '../debug/debug-state';

import { Game } from './game';
import { UpdateContext, SetupContext, DestroyContext } from '../core/base-node-life-cycle';
import { InputManager } from '../input/input-manager';
import { Timer } from '../core/three-addons/Timer';
import { ZylemCamera } from '~/lib/camera/zylem-camera';
import { Stage } from '../stage/stage';
import { BasicTypes, GlobalVariablesType, ZylemGameConfig } from './game-interfaces';
import { subscribe } from 'valtio/vanilla';


export class ZylemGame<TGlobals extends Record<string, BasicTypes> = GlobalVariablesType> {
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
	statsRef: { begin: () => void, end: () => void } | null = null;

	static FRAME_LIMIT = 120;
	static FRAME_DURATION = 1000 / ZylemGame.FRAME_LIMIT;
	static MAX_DELTA_SECONDS = 1 / 30;

	constructor(options: ZylemGameConfig<Stage, ZylemGame<TGlobals>, TGlobals>, wrapperRef: Game<TGlobals>) {
		this.wrapperRef = wrapperRef;
		this.inputManager = new InputManager(options.input);
		this.timer = new Timer();
		this.timer.connect(document);
		this.id = options.id;
		this.stages = options.stages || [];
		this.setGlobals(options);
	}

	async loadStage(stage: Stage) {
		const config = stage.options[0] as any;
		await stage.load(this.id, config?.camera as ZylemCamera | null);
		this.stageMap.set(stage.stageRef!.uuid, stage);
		this.currentStageId = stage.stageRef!.uuid;
	}

	setGlobals(options: ZylemGameConfig<Stage, ZylemGame<TGlobals>, TGlobals>) {
		setDebugFlag(options.debug);
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
		return {
			delta,
			inputs,
			globals: state.globals as unknown as TGlobals,
			me: this,
			camera: stage!.stageRef!.cameraRef!,
		};
	}

	start() {
		const stage = this.currentStage();
		const params = this.params();
		stage!.start({ ...params, me: stage!.stageRef });
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
			stage!.stageRef!.nodeUpdate({ ...clampedParams, me: stage!.stageRef });
			this.totalTime += clampedParams.delta;
			state.time = this.totalTime;
			this.previousTimeStamp = timestamp;
		}
		this.statsRef && this.statsRef.end();
		this.outOfLoop();
		requestAnimationFrame(this.loop.bind(this));
	}

	outOfLoop() {
		this.currentStage()!.stageRef!.debugUpdate();
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