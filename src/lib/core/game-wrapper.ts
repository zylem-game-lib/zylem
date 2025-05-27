import { ZylemBlueColor } from './utility';
import { BaseNode } from './base-node';
import { IGameOptions, ZylemGame } from './game';
import { ZylemStage, stage } from './stage';
import { DestroyFunction, SetupFunction, UpdateFunction } from './base-node-life-cycle';

async function loadGame(wrapperRef: Game) {
	const options = convertNodes(wrapperRef.options);
	const game = new ZylemGame(options, wrapperRef);
	await game.loadStage(options.stages[0]);
	return game;
}

const defaultGameOptions = {
	id: 'zylem',
	globals: {},
	stages: [
		stage({
			// perspective: Perspectives.ThirdPerson,
			backgroundColor: ZylemBlueColor,
			children: (_) => []
		})
	]
};

function convertNodes(_options: GameOptions): { id: string, globals: {}, stages: ZylemStage[] } {
	let converted = { ...defaultGameOptions };
	const configurations: IGameOptions[] = [];
	const stages: ZylemStage[] = [];
	const entities: BaseNode[] = [];
	Object.values(_options).forEach((node) => {
		if (node instanceof ZylemStage) {
			stages.push(node);
		} else if (node instanceof BaseNode) {
			entities.push(node);
		} else if (node.constructor.name === 'Object' && typeof node === 'object') {
			const configuration = Object.assign(defaultGameOptions, { ...node });
			configurations.push(configuration as IGameOptions);
		}
	});
	configurations.forEach((configuration) => {
		converted = Object.assign(converted, { ...configuration });
	});
	stages.forEach((stage) => {
		stage.children.unshift(...entities);
	});
	if (stages.length) {
		converted.stages = stages;
	} else {
		converted.stages[0].children.unshift(...entities);
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
		const game = await loadGame(this);
		this.gameRef = game;
		this.setOverrides();
		game.start();
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
		const currentIndex = this.gameRef.stages.findIndex((s) => s.uuid === currentStageId);
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
		const currentIndex = this.gameRef.stages.findIndex((s) => s.uuid === currentStageId);
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

type GameOptions = Array<Partial<IGameOptions> | ZylemStage | Partial<BaseNode>>;

/**
 * create a new game
 * @param options GameOptions
 * @param options.id Game name string
 * @param options.globals Game globals object
 * @param options.stages Array of stage objects
 * @returns Game
 */
export function game(...options: GameOptions): Game {
	return new Game(options);
}