import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { Howl } from 'howler';

import { game, GameOptions, stage } from './lib/core';

import { StageBlueprint } from './lib/interfaces/stage';
import { PerspectiveType, Perspectives } from './lib/interfaces/perspective';
import { Vect3 } from './lib/interfaces/utility';

import * as actions from './lib/behaviors/actions';
import * as entities from './lib/entities/index';
import * as behaviors from './lib/behaviors';

const Util = {
	...actions
}

const Zylem = {
	Util
};

const { box, sphere, sprite, plane, zone, actor } = entities;
const { bounce, move } = behaviors;

namespace Zylem { };

export {
	game,
	stage,
	box,
	sphere,
	sprite,
	plane,
	zone,
	actor,
	actions,
	bounce,
	move,
	Perspectives,
	Zylem,
	Howl,
	THREE,
	RAPIER
};
export type { GameOptions as ZylemGame, StageBlueprint as ZylemStage, Vect3, PerspectiveType };
