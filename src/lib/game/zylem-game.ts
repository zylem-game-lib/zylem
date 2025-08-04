import { state, setGlobalState, getGlobalState } from './game-state';

import { setDebugFlag } from '../debug/debug-state';

import { Game } from './game';
import { UpdateContext, SetupContext, DestroyContext } from '../core/base-node-life-cycle';
import { InputManager } from '../input/input-manager';
import { Timer } from '../core/three-addons/Timer';
import { ZylemCamera } from '~/lib/camera/zylem-camera';
import { Stage } from '../stage/stage';
import { BasicTypes, GlobalVariablesType, ZylemGameConfig } from './game-interfaces';


export class ZylemGame {
	id: string;
	initialGlobals = {} as GlobalVariablesType;

	customSetup: ((params: SetupContext<ZylemGame>) => void) | null = null;
	customUpdate: ((params: UpdateContext<ZylemGame>) => void) | null = null;
	customDestroy: ((params: DestroyContext<ZylemGame>) => void) | null = null;

	stages: Stage[] = [];
	stageMap: Map<string, Stage> = new Map();
	currentStageId = '';

	previousTimeStamp: number = 0;
	totalTime = 0;

	timer: Timer;
	inputManager: InputManager;

	wrapperRef: Game;
	// statsRef: Stats | null = null;

	static FRAME_LIMIT = 120;
	static FRAME_DURATION = 1000 / ZylemGame.FRAME_LIMIT;

	constructor(options: ZylemGameConfig<Stage, ZylemGame>, wrapperRef: Game) {
		this.wrapperRef = wrapperRef;
		this.inputManager = new InputManager();
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

	setGlobals(options: ZylemGameConfig<Stage, ZylemGame>) {
		setDebugFlag(options.debug);
		this.initialGlobals = { ...options.globals };
		for (const variable in this.initialGlobals) {
			const value = this.initialGlobals[variable];
			if (value === undefined) {
				console.error(`global ${variable} is undefined`);
			}
			this.setGlobal(variable, value);
		}
	}

	params(): UpdateContext<ZylemGame> {
		const stage = this.currentStage();
		const delta = this.timer.getDelta();
		const inputs = this.inputManager.getInputs(delta);
		return {
			delta,
			inputs,
			globals: state.globals,
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
		// this.statsRef && this.statsRef.begin();
		const elapsed = timestamp - this.previousTimeStamp;
		if (elapsed >= ZylemGame.FRAME_DURATION) {
			this.timer.update();
			const stage = this.currentStage();
			const params = this.params();
			if (this.customUpdate) {
				this.customUpdate(params);
			}
			stage!.stageRef!.update({ ...params, me: stage!.stageRef });
			this.totalTime += params.delta;
			state.time = this.totalTime;
			this.previousTimeStamp = timestamp;
		}

		// this.statsRef && this.statsRef.end();
		requestAnimationFrame(this.loop.bind(this));
	}

	getStage(id: string) {
		return this.stageMap.get(id);
	}

	currentStage() {
		return this.getStage(this.currentStageId);
	}

	getGlobal(key: string) {
		return getGlobalState(key);
	}

	setGlobal(key: string, value: BasicTypes) {
		setGlobalState(key, value);
	}
}

export default ZylemGame;