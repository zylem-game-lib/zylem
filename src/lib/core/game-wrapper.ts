import { Perspectives } from '../interfaces/perspective';
import { ZylemBlueColor } from '../interfaces/utility';
import { debugState } from '../state/debug-state';
import { ZylemDebug } from './debug';
import { GameOptions, ZylemGame } from "./game";
import { stage } from './stage';

async function loadGame(_options: GameOptions) {
	const options = Object.assign(defaultGameOptions, { ..._options });
	await options.stages[0].buildStage(options.id);
	const game = new ZylemGame(options, options.stages[0]);
	if (debugState.on) {
		const debug = new ZylemDebug();
		debug.appendToDOM();
	}
	return game;
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

interface Game {
	start: () => {};
	pause: () => {};
	end: () => {};
	reset: () => {};
}

export function game(options: GameOptions = defaultGameOptions): Game {
	return {
		start: async () => {
			const game = await loadGame(options);
			game.start();
		},
		pause: async () => {},
		end: async () => {},
		reset: async () => {
			// TODO: implement actual reset
			window.location.reload();
		}
	}
}