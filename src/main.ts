import { ZylemGame } from './game/ZylemGame';
import { GameOptions } from './interfaces/Game';
import { Entity, GameEntityType } from './interfaces/Entity';
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

function destroy(entity: Entity) {
	entity.destroy();
	// @ts-ignore
	const scene = entity.mesh.parent;
	// @ts-ignore
	scene.remove(entity.mesh);
	// @ts-ignore
	entity.mesh.geometry.dispose();
	// @ts-ignore
	entity.mesh.material.dispose();
	// @ts-ignore
	entity.mesh = undefined;
	// @ts-ignore
	entity.body.setEnabled(false);
}

const Zylem = {
	create,
	destroy,
	GameEntityType,

	// Third party libs
	Howl,
	THREE,
	RAPIER
};

export { Zylem };