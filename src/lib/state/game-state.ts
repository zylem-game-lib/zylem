import { GameBlueprint } from '../interfaces/game';
import { observable } from '@simplyianm/legend-state';

const state$ = observable({
	id: '',
	globals: {},
	debug: {},
	time: 0
} as unknown as GameBlueprint);

const setGlobalState = (value: any) => {
	state$.globals.set(value);
}

const getGlobalState = () => {
	return state$.globals.get();
}

export { setGlobalState, getGlobalState, state$ };