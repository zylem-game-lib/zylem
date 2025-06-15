import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { Howl } from 'howler';

import { game, ZylemGameConfig, stage, StageOptions, vessel } from './lib/core';

import { PerspectiveType, Perspectives } from './lib/camera/perspective';
import { camera } from './lib/camera/camera';
import { Vect3 } from './lib/core/utility';

import * as actions from './lib/behaviors/actions';
import * as entities from './lib/entities/index';
import { destroy } from './lib/entities/destroy';

const Util = {
	...actions
};

const Zylem = {
	Util
};

const { box, sphere, sprite, plane, zone, actor, ZylemBox } = entities;

namespace Zylem { };

export {
	game,
	stage,
	camera,
	box,
	sphere,
	sprite,
	plane,
	zone,
	actor,
	vessel,
	actions,
	destroy,
	Perspectives,
	Zylem,
	ZylemBox,
	Howl,
	THREE,
	RAPIER
};
export type { ZylemGameConfig as ZylemGame, StageOptions as ZylemStage, Vect3, PerspectiveType };
