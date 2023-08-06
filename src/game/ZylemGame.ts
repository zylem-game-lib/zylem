import GamePad from '@/input/ZylemGamePad';
import { UpdateOptions } from '@/interfaces/Update';
import { ZylemStage } from '@/stage/ZylemStage';
import { Clock } from 'three';
import { GameOptions } from '../interfaces/Game';
import { PerspectiveType } from "../interfaces/Perspective";
import { GameState } from '@state/index';

// We should have an abstraction for entering, exiting, and updating.
// Zylem Game should only require stages, global state, and game loop.

export class ZylemGame implements GameOptions {
	id: string;
	perspective: PerspectiveType = PerspectiveType.ThirdPerson;
	stage?: ZylemStage;
	stages: Record<string, ZylemStage> = {};
	blueprintOptions: GameOptions;
	currentStage: string = '';
	clock: Clock;
	gamePad: GamePad;

	constructor(options: GameOptions) {
		GameState.state.perspective = options.perspective;
		this.id = options.id;
		this.gamePad = new GamePad();
		this.clock = new Clock();
		this.blueprintOptions = options;
		this.createCanvas();
		this.loadStage(options);
		this.currentStage = this.id;
	}

	async loadStage(options: GameOptions) {
		this.stage = new ZylemStage(this.id);
		this.stage.buildStage(options.stage);
		this.stages[this.id] = this.stage;
	}

	/**
	 * Main game loop
	 * process user input
	 * update physics
	 * render scene
	 */
	async gameLoop() {
		const inputs = this.gamePad.getInputs();
		const ticks = this.clock.getDelta();

		const stage = this.stages[this.currentStage];
		const options = {
			inputs,
			entity: stage
		} as unknown as UpdateOptions<ZylemStage>;
		stage.update(ticks, options);
		const self = this;
		requestAnimationFrame(() => {
			this.blueprintOptions?.debug?.addInfo(this.gamePad.getDebugInfo());
			self.gameLoop();
		});
	}

	start() {
		this.gameLoop();
	}

	createStage(id: string) {
		if (!this.id) {
			console.error('No id provided for canvas');
			return;
		}
		// this.stages[id] = new ZylemStage(this.id);
		// this.currentStage = id;
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
		return canvas;
	}
}

export default ZylemGame;
