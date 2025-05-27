import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { Howl } from 'howler';

import { game, IGameOptions, stage, StageOptions } from './lib/core';

import { PerspectiveType, Perspectives } from './lib/interfaces/perspective';
import { Vect3 } from './lib/core/utility';

import * as actions from './lib/behaviors/actions';
import * as entities from './lib/entities/index';

const Util = {
	...actions
};

const Zylem = {
	Util
};

const { box, sphere, sprite, plane, zone, actor, vessel, ZylemBox } = entities;

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
	vessel,
	actions,
	Perspectives,
	Zylem,
	ZylemBox,
	Howl,
	THREE,
	RAPIER
};
export type { IGameOptions as ZylemGame, StageOptions as ZylemStage, Vect3, PerspectiveType };
