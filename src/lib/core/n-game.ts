import GamePad from '../input/game-pad';
import { UpdateOptions } from '../interfaces/update';
import { ZylemStage } from './stage';
import { Clock } from 'three';
import { GameBlueprint, GameRatio, StageBlueprint } from '../interfaces/game';
import { PerspectiveType } from "../interfaces/n-perspective";
import { gameState, setGlobalState } from '../state/index';

// We should have an abstraction for entering, exiting, and updating.
// Zylem Game should only require stages, global state, and game loop.

const TIMESTAMP_DELTA = 16;

export class ZylemGame implements GameBlueprint {
	id: string;
	ratio: GameRatio;
	perspective: PerspectiveType = PerspectiveType.ThirdPerson;
	globals: any;
	// @deprecated - use stages instead
	stage?: StageBlueprint;
	stages: StageBlueprint[] = [];
	blueprintOptions: GameBlueprint;
	currentStage: string = '';
	clock: Clock;
	gamePad: GamePad;

	_targetRatio: number;
	_initialGlobals: any;
	_stageMap: Record<string, ZylemStage> = {};
	_canvasWrapper: Element | null;

	previousTimeStamp: number = 0;
	// TODO: startTimeStamp could be nice for total game time
	startTimeStamp: number = 0;

	constructor(options: GameBlueprint) {
		setGlobalState(options.globals);
		this._initialGlobals = { ...options.globals };
		this.id = options.id;
		this.ratio = options.ratio ?? '16:9';
		this._targetRatio = Number(this.ratio.split(':')[0]) / Number(this.ratio.split(':')[1]);
		this.gamePad = new GamePad();
		this.clock = new Clock();
		this.blueprintOptions = options;
		this._canvasWrapper = null;
		this.createCanvas();
		// @deprecated - use stages instead
		this.stage = options.stages[0];
		this.stages = options.stages ?? [{ id: 'default-stage', ...this.stage }];
		this.loadStage(this.stage);
		this.currentStage = this.id;
	}

	async loadStage(options: StageBlueprint) {
		const stage = new ZylemStage();
		stage.buildStage(options, this.id);
		this._stageMap[this.id] = stage;
	}

	/**
	 * Main game loop
	 * process user input
	 * update physics
	 * render scene
	 */
	async gameLoop(_timeStamp: number) {
		const inputs = this.gamePad.getInputs();
		const ticks = this.clock.getDelta();
		const delta = this.previousTimeStamp ? _timeStamp - this.previousTimeStamp : TIMESTAMP_DELTA;

		if (this.previousTimeStamp !== _timeStamp && delta >= TIMESTAMP_DELTA) {
			const stage = this._stageMap[this.currentStage];
			const options = {
				inputs,
				entity: stage
			} as unknown as UpdateOptions<ZylemStage>;
			stage.update(ticks, options);
			stage.conditions.forEach(condition => {
				condition(gameState.globals, this);
			});
			this.previousTimeStamp = _timeStamp;
		}

		requestAnimationFrame((timeStamp) => {
			this.gameLoop(timeStamp);
		});
	}

	start() {
		requestAnimationFrame(async (timeStamp) => {
			this.gameLoop(timeStamp);
		});
	}

	reset(resetGlobals = true) {
		// TODO: this needs cleanup
		if (resetGlobals) {
			setGlobalState({ ...this._initialGlobals });
		}
		const stageOption = this.stages.find(stage => stage.id === this.currentStage);
		this.loadStage(stageOption ?? this.stages[0]);
		this.delayedResize();
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

	delayedResize() {
		setTimeout(() => {
			this.handleResize();
		}, 0);
	}

	handleResize() {
		const rawWidth = this._canvasWrapper?.clientWidth || window.innerWidth;
		const rawHeight = this._canvasWrapper?.clientHeight || window.innerHeight;
		const targetRatio = this._targetRatio;
		let calculatedWidth, calculatedHeight;
		if (rawWidth / rawHeight > targetRatio) {
			calculatedWidth = rawHeight * targetRatio;
			calculatedHeight = rawHeight;
		} else {
			calculatedWidth = rawWidth;
			calculatedHeight = rawWidth / targetRatio;
		}
		this.setCanvasSize(calculatedWidth, calculatedHeight);
		this._stageMap[this.id].resize(calculatedWidth, calculatedHeight);
	}

	setCanvasSize(width: number, height: number) {
		if (this._canvasWrapper?.firstElementChild) {
			const canvas = this._canvasWrapper?.querySelector('canvas') as HTMLCanvasElement;
			canvas?.style.setProperty('width', `${width}px`);
			canvas?.style.setProperty('height', `${height}px`);
		}
	}

	createInitialStyles() {
		const styleElement = document.createElement("style");
		styleElement.textContent = `
			.zylem-game-view {
				width: 100%;
				height: 100%;
			}
			.zylem-game-view canvas {
				margin: 0;
				padding: 0;
				background-color: #0c2461;
			}
		`;
		document.head.appendChild(styleElement);
	}

	createCanvas() {
		if (!this.id) {
			console.error('No id provided for canvas');
			return;
		}
		this.createInitialStyles();
		const canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
		let canvasWrapper = document.querySelector(`#${this.id}`)!;
		if (!canvasWrapper) {
			canvasWrapper = document.createElement('main') as HTMLElement;
			canvasWrapper.setAttribute('id', this.id);
			document.body.appendChild(canvasWrapper);
		}
		canvasWrapper.classList.add('zylem-game-view');
		canvasWrapper.appendChild(canvas);
		this._canvasWrapper = canvasWrapper;
		this.delayedResize();
		window.addEventListener("resize", () => {
			this.handleResize();
		});
	}
}

export default ZylemGame;
