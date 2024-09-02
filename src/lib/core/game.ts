import { Clock } from 'three';
import { observe } from '@simplyianm/legend-state';
import { createWorld } from 'bitecs';

import { state$ } from '../state/game-state';
import { setGlobalState } from '../state/index';

import { setDebugFlag } from '../state/debug-state';
import { DebugConfiguration } from './debug';

import GamePad from '../input/game-pad';

import { ZylemStage } from './stage';
import { Entity, EntityParameters } from './entity';
import { SetupFunction, UpdateFunction } from '../interfaces/entity';
import { Game } from './game-wrapper';

export interface GameOptions {
	id: string;
	globals: Record<string, any>;
	stages: ZylemStage[];
	update?: UpdateFunction<this>;
	debug?: boolean;
	debugConfiguration?: DebugConfiguration;
	time?: number;
}

// We should have an abstraction for entering, exiting, and updating.
// Zylem Game should only require stages, global state, and game loop.
type Timeout = /*unresolved*/ any;

export class ZylemGame {
	id: string;
	initialGlobals = {};

	customSetup: SetupFunction<any> | null = null;
	customUpdate: UpdateFunction<any> | null = null;

	stages: ZylemStage[] = [];
	stageMap: Map<string, ZylemStage> = new Map();
	currentStageId = '';

	previousTimeStamp: number = 0;
	totalTime = 0;

	clock: Clock;
	gamePad: GamePad;

	wrapperRef: Game;
	statsRef: Stats | null = null;

	ecs = createWorld();

	static FRAME_LIMIT = 64;
	static FRAME_DURATION = 1000 / ZylemGame.FRAME_LIMIT;

	// entities: Map<Uint16Array, Entity> = new Map();

	constructor(options: GameOptions, wrapperRef: Game) {
		this.wrapperRef = wrapperRef;
		this.gamePad = new GamePad();
		this.clock = new Clock();
		this.id = options.id;
		this.stages = options.stages;
		this.setGlobals(options);
	}

	async loadStage(stage: ZylemStage) {
		await stage.buildStage(this.id);
		this.stageMap.set(stage.uuid, stage);
		this.currentStageId = stage.uuid;
	}

	setGlobals(options: GameOptions) {
		setGlobalState(options.globals);
		setDebugFlag(options.debug);
		this.initialGlobals = { ...options.globals };
	}

	params(): EntityParameters<ZylemStage> {
		const stage = this.currentStage();
		const delta = this.clock.getDelta() ?? 0;
		const inputs = this.gamePad.getInputs();
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
			})
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