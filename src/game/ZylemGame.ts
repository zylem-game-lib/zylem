import GamePad from '@/input/ZylemGamePad';
import { ZylemStage } from '@/stage/ZylemStage';
import { Clock } from 'three';
import { GameOptions } from '../interfaces/Game';
import { PerspectiveType } from "../interfaces/Perspective";

function Game({ app, stages = [] }: { app: HTMLElement | string, stages?: Function[] }) {
	return (target: any) => {
		const gameInstance = new target();
		// const pyramidInstance = new PyramidGame({
		// 	loop: gameInstance.loop.bind(gameInstance),
		// 	setup: gameInstance.setup.bind(gameInstance),
		// 	globals: Globals.getInstance(),
		// 	stages: stages,
		// });
		// pyramidInstance.ready.then(() => {
		// 	let appElement;
		// 	if (typeof app === 'string') {
		// 		appElement = document.querySelector<HTMLDivElement>(app)!;
		// 	} else {
		// 		appElement = app;
		// 	}
		// 	appElement.appendChild(pyramidInstance.domElement());
		// 	if (gameInstance.ready) {
		// 		gameInstance.ready.bind(gameInstance)();
		// 	}
		// })
	}
}

// We should have an abstraction for entering, exiting, and updating.
// Zylem Game should only require stages, global state, and game loop.

export class ZylemGame implements GameOptions {
	id: string;
	perspective: PerspectiveType = PerspectiveType.ThirdPerson;
	stage: ZylemStage;
	stages: Record<string, ZylemStage> = {};
	blueprintOptions: GameOptions;
	currentStage: string = '';
	clock: Clock;
	gamePad: GamePad;

	constructor(options: GameOptions) {
		this.id = options.id;
		this.gamePad = new GamePad();
		this.clock = new Clock();
		this.blueprintOptions = options;
		// this.pause = false;
		// this._loop = loop;
		// this._setup = setup;
		// this._globals = globals;
		// this._stages = stages;
		// this.ready = new Promise(async (resolve, reject) => {
		// 	try {
		// 		const world = await this.loadPhysics();

		// 		for (const stageCreator of this._stages) {
		// 			const stage = stageCreator.prototype.init(world) as PyramidStage;
		// 			this.stages.push(stage);
		// 		}
		// 		await this.gameSetup();
		// 		const self = this;
		// 		requestAnimationFrame(() => {
		// 			self.gameLoop(self)
		// 		});
		// 		resolve(true);
		// 	} catch (error) {
		// 		reject(error);
		// 	}
		// });
		this.createCanvas();
		this.stage = new ZylemStage(this.id, options.stage);
		this.stages[this.id] = this.stage;
		this.currentStage = this.id;
		// this.createStage();
	}

	async loadPhysics() {
		// await RAPIER.init();
		// const world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });

		// return world;
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
		// if (!this.pause) {
		// 	this.stage().update({
		// 		delta: ticks,
		// 		inputs
		// 	});
		// }

		// this._loop({
		// 	ticks,
		// 	inputs,
		// 	stage: this.stage(),
		// 	globals: this._globals,
		// 	game: this,
		// });

		// this.stage().render();
		this.stages[this.currentStage].update(ticks);
		const self = this;
		requestAnimationFrame(() => {
			this.blueprintOptions?.debug?.addInfo(this.gamePad.getDebugInfo());
			self.gameLoop();
		});
	}

	start() {
		this.gameLoop();
	}

	async gameSetup() {
		// const commands = await Create(this.stage());
		// const gameSetupParameters = {
		// 	create: commands.create,
		// 	globals: this._globals,
		// 	camera: this.stage()._camera
		// };

		// this.stage()._setup(gameSetupParameters);
		// this._setup(gameSetupParameters);
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

export default Game;
