import GamePad from '../input/game-pad';
import { Clock } from 'three';
import { GameBlueprint, GameRatio } from '../interfaces/game';
import { PerspectiveType } from "../interfaces/perspective";
import { setGlobalState } from '../state/index';
import { EntityParameters } from './entity';
import { ZylemStage } from './stage';
import { getGlobalState, state$ } from '../state/game-state';
import { observe } from '@simplyianm/legend-state';

// We should have an abstraction for entering, exiting, and updating.
// Zylem Game should only require stages, global state, and game loop.

export class ZylemGame implements GameBlueprint {
	id: string;
	ratio: GameRatio;
	perspective: PerspectiveType = PerspectiveType.ThirdPerson;
	globals: any;
	stages: ZylemStage[] = [];
	blueprintOptions: GameBlueprint;
	currentStage: string = '';
	clock: Clock;
	gamePad: GamePad;

	_targetRatio: number;
	_initialGlobals: any;
	_stageMap: Record<string, ZylemStage> = {};
	_canvasWrapper: Element | null;

	totalTime: number = 0;

	static logcount = 0;

	constructor(options: GameBlueprint, loadedStage: ZylemStage) {
		setGlobalState(options.globals);
		this._initialGlobals = getGlobalState();
		this.id = options.id;
		this.ratio = options.ratio ?? '16:9';
		this._targetRatio = Number(this.ratio.split(':')[0]) / Number(this.ratio.split(':')[1]);
		this.gamePad = new GamePad();
		this.clock = new Clock();
		this.blueprintOptions = options;
		// TODO: split out canvas into GameCanvas
		this._canvasWrapper = null;
		this.createCanvas();
		this.stages = [loadedStage];
		this._stageMap[this.id] = loadedStage;
		this.currentStage = this.id;
	}

	async loadStage(stage: ZylemStage) {
		await stage.buildStage(this.id);
		this._stageMap[this.id] = stage;
	}

	/**
	 * Main game loop
	 * process user input
	 * update physics
	 * render scene
	 */
	loop(timeStamp: number) {
		const inputs = this.gamePad.getInputs();
		const ticks = this.clock.getDelta();
		const stage = this._stageMap[this.currentStage];
		const options = {
			inputs,
			entity: stage,
			delta: ticks,
			camera: stage.scene?.zylemCamera,
			globals: state$.globals,
		} as unknown as EntityParameters<ZylemStage>;

		stage.update(options);
		this.totalTime += ticks;
		state$.time.set(this.totalTime);
		setTimeout(() => requestAnimationFrame(this.loop.bind(this)), 0);
	}

	runLoop() {
		const stage = this._stageMap[this.currentStage];
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

	reset(resetGlobals = true) {
		// TODO: this needs cleanup
		if (resetGlobals) {
			setGlobalState({ ...this._initialGlobals });
		}
		console.log('reset called');
		const stageOption = this.stages.find(stage => stage.uuid === this.currentStage);
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
		this._canvasWrapper = canvasWrapper;
		this.delayedResize();
		window.addEventListener("resize", () => {
			this.handleResize();
		});
	}
}

export default ZylemGame;
