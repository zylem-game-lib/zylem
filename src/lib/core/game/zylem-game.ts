// import { observe } from '@simplyianm/legend-state';

import { state$ } from '../../state/game-state';
import { setGlobalState } from '../../state/index';

import { setDebugFlag } from '../../state/debug-state';

import { ZylemStage, ZylemStageConfig } from '../stage/zylem-stage';
import { Game } from './game';
import { UpdateContext, SetupContext, UpdateFunction, SetupFunction, DestroyContext } from '../base-node-life-cycle';
import { InputManager } from '../../input/input-manager';
import { Timer } from '../three-addons/Timer';
import { ZylemCamera } from '~/lib/camera/zylem-camera';
import { Stage } from '../stage/stage';
import { Perspectives } from '~/main';
import { Vector2, Vector3 } from 'three';

export interface ZylemGameConfig {
	id: string;
	globals?: Record<string, any>;
	stages?: Stage[];
	update?: UpdateFunction<ZylemGame>;
	debug?: boolean;
	time?: number;
}

export class ZylemGame {
	id: string;
	initialGlobals = {};

	customSetup: ((params: SetupContext<ZylemStage>) => void) | null = null;
	customUpdate: ((params: UpdateContext<ZylemStage>) => void) | null = null;
	customDestroy: ((params: DestroyContext<ZylemStage>) => void) | null = null;

	stages: Stage[] = [];
	stageMap: Map<string, Stage> = new Map();
	currentStageId = '';

	previousTimeStamp: number = 0;
	totalTime = 0;

	timer: Timer;
	inputManager: InputManager;

	wrapperRef: Game;
	// statsRef: Stats | null = null;

	static FRAME_LIMIT = 64;
	static FRAME_DURATION = 1000 / ZylemGame.FRAME_LIMIT;

	constructor(options: ZylemGameConfig, wrapperRef: Game) {
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

	setGlobals(options: ZylemGameConfig) {
		setGlobalState(options.globals);
		setDebugFlag(options.debug);
		this.initialGlobals = { ...options.globals };
	}

	params(): UpdateContext<ZylemStage> {
		const stage = this.currentStage();
		const delta = this.timer.getDelta();
		const inputs = this.inputManager.getInputs(delta);
		return {
			delta,
			inputs,
			globals: state$.globals,
			game: this.wrapperRef,
			entity: stage!.stageRef!,
			camera: stage!.stageRef!.cameraRef!,
		};
	}

	start() {
		const stage = this.currentStage();
		const params = this.params();
		stage!.start(params);
		// stage!.conditions.forEach(({ bindings, callback }) => {
		// 	bindings.forEach((key) => {
		// 		observe(() => {
		// 			state$.globals[key].get();
		// 			callback(state$.globals, this);
		// 		});
		// 	});
		// });
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
			stage!.stageRef!.update(params);
			this.totalTime += params.delta;
			state$.time.set(this.totalTime);
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
}

export default ZylemGame;