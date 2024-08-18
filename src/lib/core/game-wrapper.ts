import { Perspectives } from '../interfaces/perspective';
import { ZylemBlueColor } from '../interfaces/utility';
import { debugState } from '../state/debug-state';
import { ZylemDebug } from './debug';
import { GameOptions, ZylemGame } from "./game";
import { ZylemStage, stage } from './stage';
import { GameEntity } from './game-entity';

async function loadGame(_options: GameOptionsWrapper) {
	const options = convertNodes(_options);
	const game = new ZylemGame(options);
	await game.loadStage(options.stages[0]);
	if (debugState.on) {
		const debug = new ZylemDebug();
		debug.appendToDOM();
	}
	return game;
}

function convertNodes(_options: GameOptionsWrapper): GameOptions {
	let converted = { ...defaultGameOptions };
	const configurations: GameOptions[] = [];
	const stages: ZylemStage[] = [];
	const entities: GameEntity<any>[] = [];
	Object.values(_options).forEach((node) => {
		if (node instanceof ZylemStage) {
			stages.push(node);
		} else if (node instanceof GameEntity) {
			entities.push(node);
		} else if (node.constructor.name === 'Object' && typeof node === 'object') {
			const configuration = Object.assign(defaultGameOptions, { ...node });
			configurations.push(configuration);
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
	}
	return converted;
}

const defaultGameOptions = {
	id: 'zylem',
	globals: {},
	stages: [
		stage({
			perspective: Perspectives.ThirdPerson,
			backgroundColor: ZylemBlueColor,
			children: ({ globals }: any) => []
		})
	]
}

class Game {
	gameRef: ZylemGame | null = null;
	options: GameOptionsWrapper;

	constructor(options: GameOptionsWrapper) {
		this.options = options;
	}

	async start() {
		const game = await loadGame(this.options);
		this.gameRef = game;
		game.start();
	}
	async pause() {}
	async end() {}
	async reset() {
		// TODO: implement actual reset
		window.location.reload();
	}
	async nextStage() {
		if (!this.gameRef) {
			console.error('lost reference to game');
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
	async previousStage() {}
	async goToStage() {}
}

type GameOptionsWrapper = Array<Partial<GameOptions> | ZylemStage | GameEntity<any>>;

export function game(...options: GameOptionsWrapper): Game {
	return new Game(options);
}