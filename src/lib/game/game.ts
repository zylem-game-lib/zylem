import { BaseNode } from '../core/base-node';
import { ZylemGame } from './zylem-game';
import { Stage, stage } from '../stage/stage';
import { DestroyFunction, IGame, SetupFunction, UpdateFunction } from '../core/base-node-life-cycle';
import { setPaused } from '../debug/debug-state';
import { GameEntity, GameEntityLifeCycle } from '../entities/entity';
import { GlobalVariablesType, ZylemGameConfig } from './game-interfaces';

const defaultGameOptions = {
	id: 'zylem',
	globals: {} as GlobalVariablesType,
	stages: [
		stage()
	]
};

function convertNodes(_options: GameOptions): { id: string, globals: {}, stages: Stage[] } {
	let converted = { ...defaultGameOptions };
	const configurations: ZylemGameConfig<Stage, Game>[] = [];
	const stages: Stage[] = [];
	const entities: (BaseNode | GameEntity<any>)[] = [];
	Object.values(_options).forEach((node) => {
		if (node instanceof Stage) {
			stages.push(node);
		} else if (node instanceof GameEntity) {
			entities.push(node);
		} else if (node instanceof BaseNode) {
			entities.push(node);
		} else if (node.constructor.name === 'Object' && typeof node === 'object') {
			const configuration = Object.assign(defaultGameOptions, { ...node });
			configurations.push(configuration as ZylemGameConfig<Stage, Game>);
		}
	});
	configurations.forEach((configuration) => {
		converted = Object.assign(converted, { ...configuration });
	});
	stages.forEach((stage) => {
		stage.addEntities(entities as BaseNode[]);
	});
	if (stages.length) {
		converted.stages = stages;
	} else {
		converted.stages[0].addEntities(entities as BaseNode[]);
	}
	return converted;
}

export class Game implements IGame {
	gameRef: ZylemGame | null = null;
	options: GameOptions;

	update: UpdateFunction<ZylemGame> = () => { };
	setup: SetupFunction<ZylemGame> = () => { };
	destroy: DestroyFunction<ZylemGame> = () => { };

	refErrorMessage = 'lost reference to game';

	constructor(options: GameOptions) {
		this.options = options;
	}

	async start(): Promise<this> {
		const game = await this.load();
		this.gameRef = game;
		this.setOverrides();
		game.start();
		return this;
	}

	async load(): Promise<ZylemGame> {
		console.log('loading game', this.options);
		const options = convertNodes(this.options);
		const game = new ZylemGame(options, this);
		await game.loadStage(options.stages[0]);
		return game;
	}

	setOverrides() {
		if (!this.gameRef) {
			console.error(this.refErrorMessage);
			return;
		}
		this.gameRef.customSetup = this.setup;
		this.gameRef.customUpdate = this.update;
		this.gameRef.customDestroy = this.destroy;
	}

	async pause() {
		setPaused(true);
	}

	async resume() {
		setPaused(false);
		if (this.gameRef) {
			this.gameRef.previousTimeStamp = 0;
			this.gameRef.timer.reset();
		}
	}

	async reset() {
		if (!this.gameRef) {
			console.error(this.refErrorMessage);
			return;
		}
		await this.gameRef.loadStage(this.gameRef.stages[0]);
	}

	async nextStage() {
		if (!this.gameRef) {
			console.error(this.refErrorMessage);
			return;
		}
		const currentStageId = this.gameRef.currentStageId;
		const currentIndex = this.gameRef.stages.findIndex((s) => s.stageRef!.uuid === currentStageId);
		const nextStage = this.gameRef.stages[currentIndex + 1];
		if (!nextStage) {
			console.error('next stage called on last stage');
			return;
		}
		await this.gameRef.loadStage(nextStage);
	}

	async previousStage() {
		if (!this.gameRef) {
			console.error(this.refErrorMessage);
			return;
		}
		const currentStageId = this.gameRef.currentStageId;
		const currentIndex = this.gameRef.stages.findIndex((s) => s.stageRef!.uuid === currentStageId);
		const previousStage = this.gameRef.stages[currentIndex - 1];
		if (!previousStage) {
			console.error('previous stage called on first stage');
			return;
		}
		await this.gameRef.loadStage(previousStage);
	}

	async goToStage() { }

	async end() { }

	getGlobal(key: string) {
		return this.gameRef?.getGlobal(key);
	}

	setGlobal(key: string, value: number) {
		this.gameRef?.setGlobal(key, value);
	}
}

type GameOptions = Array<ZylemGameConfig<Stage, Game> | Stage | GameEntityLifeCycle | BaseNode>;

/**
 * create a new game
 * @param options GameOptions - Array of IGameOptions, Stage, GameEntity, or BaseNode objects
 * @param options.id Game name string (when using IGameOptions)
 * @param options.globals Game globals object (when using IGameOptions)
 * @param options.stages Array of stage objects (when using IGameOptions)
 * @returns Game
 */
export function game(...options: GameOptions): Game {
	return new Game(options);
}