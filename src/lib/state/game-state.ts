import { GameBlueprint } from '../interfaces/game';
import { observable } from '@simplyianm/legend-state';

const state$ = observable({
	id: '',
	globals: {},
	time: 0,
	elements: {
		hud: null,
		game: null
	}
} as unknown as GameBlueprint);

const setGlobalState = (value: any) => {
	state$.globals.set(value);
}

const getGlobalState = () => {
	return state$.globals.get();
}

export { setGlobalState, getGlobalState, state$ };