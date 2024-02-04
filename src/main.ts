import { ZylemGame } from './lib/core/n-game';
import { GameBlueprint, StageBlueprint } from './lib/interfaces/game';
import { EntityType } from './lib/interfaces/entity';
import { PerspectiveType } from './lib/interfaces/n-perspective';
import { ZylemDebug } from './lib/core/n-debug';
import { Howl } from 'howler';
import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { Vect3 } from './lib/interfaces/utility';
import { Entity } from './lib/core/entity';

const debug = new ZylemDebug();

function create(options: GameBlueprint) {
	// debug.appendToDOM();
	options.debug = debug;
	return new ZylemGame(options);
}

interface Zylem {
	create: (options: GameBlueprint) => ZylemGame;
	EntityType: typeof EntityType;
	PerspectiveType: typeof PerspectiveType;
}

const Zylem = {
	create,
	...EntityType,
	...PerspectiveType,
	Entity
};

namespace Zylem { };

export { Zylem, Howl, THREE, RAPIER };
export type { GameBlueprint as ZylemGame, StageBlueprint as ZylemStage, Vect3 };
