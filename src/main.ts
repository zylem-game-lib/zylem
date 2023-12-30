import { ZylemGame } from './game/ZylemGame';
import { GameOptions } from './interfaces/Game';
import { EntityType } from './interfaces/Entity';
import { PerspectiveType } from './interfaces/Perspective';
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
	...EntityType,
	...PerspectiveType
};

export { Zylem, Howl, THREE, RAPIER };