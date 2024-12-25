import { Clock } from 'three';
import { observe } from '@simplyianm/legend-state';

import { state$ } from '../state/game-state';
import { setGlobalState } from '../state/index';

import { setDebugFlag } from '../state/debug-state';
import { DebugConfiguration } from './debug';

import Gamepad from '../input/gamepad';

import { ZylemStage } from './stage';
import { Game } from './game-wrapper';
import { LifecycleParameters } from './entity-life-cycle';
import { UpdateFunction } from './update';
import { SetupFunction } from './setup';

export interface IGameOptions {
	id: string;
	globals: Record<string, any>;
	stages: ZylemStage[];
	update?: UpdateFunction<ZylemGame>;
	debug?: boolean;
	debugConfiguration?: DebugConfiguration;
	time?: number;
}

export class ZylemGame {
	id: string;
	initialGlobals = {};

	customSetup: SetupFunction<ZylemStage> | null = null;
	customUpdate: UpdateFunction<ZylemStage> | null = null;

	stages: ZylemStage[] = [];
	stageMap: Map<string, ZylemStage> = new Map();
	currentStageId = '';

	previousTimeStamp: number = 0;
	totalTime = 0;

	clock: Clock;
	gamepad: Gamepad;

	wrapperRef: Game;
	statsRef: Stats | null = null;

	static FRAME_LIMIT = 64;
	static FRAME_DURATION = 1000 / ZylemGame.FRAME_LIMIT;

	constructor(options: IGameOptions, wrapperRef: Game) {
		this.wrapperRef = wrapperRef;
		this.gamepad = new Gamepad();
		this.clock = new Clock();
		this.id = options.id;
		this.stages = options.stages;
		this.setGlobals(options);
	}

	async loadStage(stage: ZylemStage) {
		await stage.load(this.id);
		this.stageMap.set(stage.uuid, stage);
		this.currentStageId = stage.uuid;
	}

	setGlobals(options: IGameOptions) {
		setGlobalState(options.globals);
		setDebugFlag(options.debug);
		this.initialGlobals = { ...options.globals };
	}

	params(): LifecycleParameters<ZylemStage> {
		const stage = this.currentStage();
		const delta = this.clock.getDelta() ?? 0;
		const inputs = this.gamepad.getInputs();
		return {
			delta,
			inputs,
			globals: state$.globals,
			game: this.wrapperRef,
			entity: stage as ZylemStage,
			camera: stage!.scene!.zylemCamera,
			HUD: stage!.HUD,
		};
	}

	start() {
		const stage = this.currentStage();
		const params = this.params();
		stage!.setup(params);
		stage!.conditions.forEach(({ bindings, callback }) => {
			bindings.forEach((key) => {
				observe(() => {
					state$.globals[key].get();
					callback(state$.globals, this);
				});
			});
		});
		if (this.customSetup) {
			this.customSetup(params);
		}
		this.loop(0);
	}

	loop(timestamp: number) {
		this.statsRef && this.statsRef.begin();
		const elapsed = timestamp - this.previousTimeStamp;
		if (elapsed >= ZylemGame.FRAME_DURATION) {
			const stage = this.currentStage();
			const params = this.params();
			stage!.update(params);
			this.totalTime += params.delta;
			state$.time.set(this.totalTime);
			this.previousTimeStamp = timestamp;
		}

		this.statsRef && this.statsRef.end();
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