import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { Howl } from 'howler';

import { ZylemGame } from './lib/core/game';
import { GameBlueprint } from './lib/interfaces/game';
import { StageBlueprint } from './lib/interfaces/stage';
import { PerspectiveType, Perspectives } from './lib/interfaces/perspective';
import { ZylemDebug } from './lib/core/debug';
import { Vect3 } from './lib/interfaces/utility';
import { stage } from './lib/core/stage';
import * as actions from './lib/behaviors/actions';
import * as entities from './lib/entities/index';

const debug = new ZylemDebug();
// debug.appendToDOM();
// options.debug = debug;

async function buildGame(options: GameBlueprint) {
	const bluePrintCopy = { ...options };
	await options.stages[0].buildStage(options.id);
	const game = new ZylemGame(bluePrintCopy, options.stages[0]);
	return game;
}

function game(options: GameBlueprint) {
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

const Util = {
	...actions
}

const Zylem = {
	Util
};

const { box, sphere, sprite, plane, zone, actor } = entities;

namespace Zylem { };

export { game, stage, box, sphere, sprite, plane, zone, actor, Perspectives, Zylem, Howl, THREE, RAPIER };
export type { GameBlueprint as ZylemGame, StageBlueprint as ZylemStage, Vect3, PerspectiveType };
