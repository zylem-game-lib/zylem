import { ZylemGame } from './lib/core/ZylemGame';
import { GameOptions, StageOptions } from './lib/interfaces/Game';
import { EntityType } from './lib/interfaces/Entity';
import { PerspectiveType } from './lib/interfaces/Perspective';
import { ZylemDebug } from './lib/core/ZylemDebug';
import { Howl } from 'howler';
import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { Vect3 } from './lib/interfaces/Utility';

const debug = new ZylemDebug();

function create(options: GameOptions) {
	// debug.appendToDOM();
	options.debug = debug;
	return new ZylemGame(options);
}

interface Zylem {
	create: (options: GameOptions) => ZylemGame;
	EntityType: typeof EntityType;
	PerspectiveType: typeof PerspectiveType;
}

const Zylem = {
	create,
	...EntityType,
	...PerspectiveType,
};

namespace Zylem { };

export { Zylem, Howl, THREE, RAPIER };
export type { GameOptions, StageOptions, Vect3 };
