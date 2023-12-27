import { ZylemGame } from './game/ZylemGame';
import { GameOptions } from './interfaces/Game';
import { GameEntityType } from './interfaces/Entity';
import { ZylemDebug } from './game/ZylemDebug';
import { Howl } from 'howler';
import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';

const debug = new ZylemDebug();

function create(options: GameOptions) {
	// debug.appendToDOM();
	options.debug = debug;
	return new ZylemGame(options);
}

const Zylem = {
	create,
	GameEntityType,

	// Third party libs
	Howl,
	THREE,
	RAPIER
};

export { Zylem, Howl, THREE, RAPIER };