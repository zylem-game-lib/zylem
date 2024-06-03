import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { Howl } from 'howler';

import { ZylemGame } from './lib/core/game';
import { GameBlueprint, StageBlueprint } from './lib/interfaces/game';
import { PerspectiveType } from './lib/interfaces/perspective';
import { ZylemDebug } from './lib/core/debug';
import { Vect3 } from './lib/interfaces/utility';
import { Entity } from './lib/core/entity';
import { Stage } from './lib/core/stage';
import * as actions from './lib/behaviors/actions';

const debug = new ZylemDebug();
// debug.appendToDOM();
// options.debug = debug;

async function buildGame(options: GameBlueprint) {
	const bluePrintCopy = { ...options };
	await options.stages[0].buildStage(options.id);
	const game = new ZylemGame(bluePrintCopy, options.stages[0]);
	return game;
}

function Game(options: GameBlueprint) {
	return {
		start: async () => {
			const game = await buildGame(options);
			game.start();
		},
		pause: async () => {
		},
		end: async () => {

		},
		reset: async (game: ZylemGame) => {
			// TODO: implement actual reset
			window.location.reload();
		}
	}
}

interface Game {
	start: () => {};
	pause: () => {};
	end: () => {};
}

interface Zylem {
	Game: (options: GameBlueprint) => Game;
	PerspectiveType: typeof PerspectiveType;
}

const Util = {
	...actions
}

const Zylem = {
	Game,
	...PerspectiveType,
	Entity,
	Stage,
	Util
};

namespace Zylem { };

export { Zylem, Howl, THREE, RAPIER };
export type { GameBlueprint as ZylemGame, StageBlueprint as ZylemStage, Vect3 };
