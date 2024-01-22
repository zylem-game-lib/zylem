import { GameBlueprint } from '../interfaces/game';
import { observable } from '@simplyianm/legend-state';

const state$ = observable({
	id: '',
	globals: {},
	stages: {},
	debug: {},
} as GameBlueprint);

const gameState = state$.get();

const setGlobalState = (value: any) => {
	state$.globals.set(value);
}

export { gameState, setGlobalState };