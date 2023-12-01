import GamePad from '../input/ZylemGamePad';
import { UpdateOptions } from '../interfaces/Update';
import { ZylemStage } from '../stage/ZylemStage';
import { Clock } from 'three';
import { GameOptions, StageOptions } from '../interfaces/Game';
import { PerspectiveType } from "../interfaces/Perspective";
import { gameState, setGameState } from '../state/index';

// We should have an abstraction for entering, exiting, and updating.
// Zylem Game should only require stages, global state, and game loop.

export class ZylemGame implements GameOptions {
	id: string;
	perspective: PerspectiveType = PerspectiveType.ThirdPerson;
	globals: any;
	_initialGlobals: any;
	stage: StageOptions;
	stages: Record<string, ZylemStage> = {};
	blueprintOptions: GameOptions;
	currentStage: string = '';
	clock: Clock;
	gamePad: GamePad;
	_canvasWrapper: Element | null;

	previousTimeStamp: number = 0;
	// TODO: startTimeStamp could be nice for total game time
	startTimeStamp: number = 0;

	constructor(options: GameOptions) {
		setGameState('perspective', options.perspective);
		setGameState('globals', options.globals);
		this._initialGlobals = { ...options.globals };
		this.id = options.id;
		this.gamePad = new GamePad();
		this.clock = new Clock();
		this.blueprintOptions = options;
		this._canvasWrapper = null;
		this.createCanvas();
		this.stage = options.stage;
		this.loadStage(this.stage);
		this.currentStage = this.id;
	}

	async loadStage(options: StageOptions) {
		const stage = new ZylemStage();
		stage.buildStage(options, this.id);
		this.stages[this.id] = stage;
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
		if (this.previousTimeStamp !== _timeStamp) {
			const stage = this.stages[this.currentStage];
			const options = {
				inputs,
				entity: stage
			} as unknown as UpdateOptions<ZylemStage>;
			stage.update(ticks, options);
			stage.conditions.forEach(condition => {
				condition(gameState.globals, this);
			});
		}

		// TODO: this.blueprintOptions?.debug?.addInfo(this.gamePad.getDebugInfo());
		this.previousTimeStamp = _timeStamp;
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
			setGameState('globals', { ...this._initialGlobals });
		}
		this.loadStage(this.stage);
	}

	createStage(id: string) {
		if (!this.id) {
			console.error('No id provided for canvas');
			return;
		}
		// this.stages[id] = new ZylemStage(this.id);
		// this.currentStage = id;
	}

	handleResize() {
		const rawWidth = window.innerWidth;
		const rawHeight = window.innerHeight;
		const width = `${window.innerWidth}px`;
		const height = `${window.innerHeight}px`;
		const canvas = this._canvasWrapper?.querySelector('canvas');
		canvas?.style.setProperty('width', width);
		canvas?.style.setProperty('height', height);
		this.stages[this.id].resize(rawWidth, rawHeight);
	}

	createCanvas() {
		if (!this.id) {
			console.error('No id provided for canvas');
			return;
		}
		const canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
		canvas.style.margin = '0';
		canvas.style.padding = '0';
		canvas.style.backgroundColor = '#0c2461';
		let canvasWrapper = document.querySelector(`#${this.id}`)!;
		if (!canvasWrapper) {
			canvasWrapper = document.createElement('main');
			canvasWrapper.setAttribute('id', this.id);
			document.body.appendChild(canvasWrapper);
		}
		canvasWrapper.appendChild(canvas);
		this._canvasWrapper = canvasWrapper;
		window.addEventListener("resize", () => {
			this.handleResize();
		});
		return canvas;
	}
}

export default ZylemGame;
