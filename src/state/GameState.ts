import { GameOptions } from '@interfaces/Game';
import { PerspectiveType } from '@interfaces/Perspective';
import { proxy, useSnapshot, subscribe } from 'valtio';

const state = proxy({
	id: '',
	perspective: PerspectiveType.ThirdPerson,
	globals: {},
	stage: {},
	stages: {},
	debug: {},
} as GameOptions);

export { state, useSnapshot, subscribe }