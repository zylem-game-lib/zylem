import { BaseNode } from '../base-node';
import { ZylemGameConfig, ZylemGame } from './zylem-game';
import { ZylemStage } from '../stage/zylem-stage';
import { Stage, stage } from '../stage/stage';
import { DestroyFunction, SetupFunction, UpdateFunction } from '../base-node-life-cycle';
import { GameEntity, GameEntityLifeCycle } from '../../entities/entity';

const defaultGameOptions = {
	id: 'zylem',
	globals: {},
	stages: [
		stage()
	]
};

function convertNodes(_options: GameOptions): { id: string, globals: {}, stages: Stage[] } {
	let converted = { ...defaultGameOptions };
	const configurations: ZylemGameConfig[] = [];
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
			configurations.push(configuration as ZylemGameConfig);
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

export class Game {
	gameRef: ZylemGame | null = null;
	options: GameOptions;

	update: UpdateFunction<ZylemStage> = () => { };
	setup: SetupFunction<ZylemStage> = () => { };
	destroy: DestroyFunction<ZylemStage> = () => { };

	refErrorMessage = 'lost reference to game';

	constructor(options: GameOptions) {
		this.options = options;
	}

	async start() {
		const game = await this.load();
		this.gameRef = game;
		this.setOverrides();
		game.start();
	}

	async load(): Promise<ZylemGame> {
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

	async pause() { }

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
}

type GameOptions = Array<ZylemGameConfig | Stage | GameEntityLifeCycle | BaseNode>;

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