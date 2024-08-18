import { Clock } from 'three';
import { observe } from '@simplyianm/legend-state';

import GamePad from '../input/game-pad';
import { GameRatio } from '../interfaces/game';
import { PerspectiveType, Perspectives } from "../interfaces/perspective";
import { setGlobalState } from '../state/index';
import { EntityParameters } from './entity';
import { ZylemStage } from './stage';
import { state$ } from '../state/game-state';
import { setDebugFlag } from '../state/debug-state';
import { Entity, System } from './ecs';
import { UpdateFunction } from '../interfaces/entity';
import { DebugConfiguration } from './debug';

export interface GameOptions {
	id: string;
	ratio?: GameRatio,
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
	ratio: GameRatio;
	perspective: PerspectiveType = Perspectives.ThirdPerson;
	globals: any;
	stages: ZylemStage[] = [];
	blueprintOptions: GameOptions;
	currentStageId: string = '';
	clock: Clock;
	gamePad: GamePad;

	_targetRatio: number;
	_initialGlobals: any;
	_stageMap: Record<string, ZylemStage> = {};

	totalTime: number = 0;
	timeoutId: Timeout | number = 0;

	static logcount = 0;

	constructor(options: GameOptions) {
		setGlobalState(options.globals);
		setDebugFlag(options.debug ?? false);
		this._initialGlobals = { ...options.globals };
		this.id = options.id;
		this.ratio = options.ratio ?? '16:9';
		this._targetRatio = Number(this.ratio.split(':')[0]) / Number(this.ratio.split(':')[1]);
		this.gamePad = new GamePad();
		this.clock = new Clock();
		this.blueprintOptions = { ...options };
		this.stages = options.stages;
	}

	async loadStage(stage: ZylemStage) {
		await stage.buildStage(this.id);
		this._stageMap[stage.uuid] = stage;
		this.currentStageId = stage.uuid;
	}

	/**
	 * Main game loop
	 * process user input
	 * update physics
	 * render scene
	 */
	previousTimeStamp: number = 0;

	static FRAME_LIMIT = 64;
	static FRAME_DURATION = 1000 / ZylemGame.FRAME_LIMIT;

	loop = (timeStamp: number) => {
        const elapsed = timeStamp - this.previousTimeStamp;
        if (elapsed >= ZylemGame.FRAME_DURATION) {
			const delta = this.clock.getDelta();
            const inputs = this.gamePad.getInputs();
            const stage = this.getCurrentStage();
            const options = {
                inputs,
                entity: stage,
                delta,
				HUD: stage.HUD,
                camera: stage.scene?.zylemCamera,
                globals: state$.globals,
            } as EntityParameters<ZylemStage>;

            stage.update(options);
            this.totalTime += delta;
            state$.time.set(this.totalTime);
            this.previousTimeStamp = timeStamp;
        }

        requestAnimationFrame(this.loop);
    }

	runLoop() {
		const stage = this.getCurrentStage();
		stage.setup({
			entity: stage,
			inputs: this.gamePad.getInputs(),
			camera: stage.scene!.zylemCamera,
			delta: 0,
			HUD: stage.HUD,
			globals: state$.globals,
		});
		stage.conditions.forEach(({ bindings, callback }) => {
			bindings.forEach((key) => {
				observe(() => {
					state$.globals[key].get();
					callback(state$.globals, this);
				});
			})
		});
		requestAnimationFrame(this.loop.bind(this));
	}

	start() {
		this.runLoop();
	}

	async reset(resetGlobals = true) {
		// TODO: implement actual reset
		clearTimeout(this.timeoutId);
		if (resetGlobals) {
			setGlobalState({ ...this._initialGlobals });
		}
	}

	getStage(id: string) {
		return this._stageMap[id];
	}

	createStage(id: string) {
		if (!this.id) {
			console.error('No id provided for canvas');
			return;
		}
		// this.stages[id] = new ZylemStage(this.id);
		// this.currentStage = id;
	}

	getCurrentStage() {
		return this._stageMap[this.currentStageId];
	}

}

export default ZylemGame;


export class GameSystem implements System {
	stages = new Map();
	currentStageId = '';
	previousTimeStamp: number = 0;
	totalTime = 0;

	clock: Clock;
	gamePad: GamePad;

	static FRAME_LIMIT = 64;
	static FRAME_DURATION = 1000 / GameSystem.FRAME_LIMIT;

	entities: Map<number, Entity> = new Map();

	constructor() {
		this.gamePad = new GamePad();
		this.clock = new Clock();
	}

	setup(entities: Map<number, Entity>): void {
		this.entities = new Map([...entities].filter(([_key, value]) => this.filter(value)))
	}

	filter(entity: Entity): boolean {
		// Does the game system have a filter?
		return entity && true;
	}

	update(entities: Map<number, Entity>): void {
		
	}

	loop(timestamp: number) {
		const elapsed = timestamp - this.previousTimeStamp;
        if (elapsed >= ZylemGame.FRAME_DURATION) {
			const delta = this.clock.getDelta();
            const inputs = this.gamePad.getInputs();
            const stage = this.currentStage();
            const options = {
                inputs,
                entity: stage,
                delta,
				HUD: stage.HUD,
                camera: stage.scene?.zylemCamera,
                globals: state$.globals,
            } as EntityParameters<ZylemStage>;

            stage.update(options);
            this.totalTime += delta;
            state$.time.set(this.totalTime);
            this.previousTimeStamp = timestamp;
        }

        requestAnimationFrame(this.loop);
	}

	getStage(id: string) {
		return this.stages.get(id);
	}

	currentStage() {
		return this.getStage(this.currentStageId);
	}
}