import { ZylemGameConfig } from '../core/';
import { observable } from '@simplyianm/legend-state';

const state$ = observable({
	id: '',
	globals: {},
	time: 0,
	elements: {
		hud: null,
		game: null
	}
} as unknown as ZylemGameConfig);

const setGlobalState = (value: any) => {
	state$.globals.set(value);
};

const getGlobalState = () => {
	return state$.globals.get();
};

export { setGlobalState, getGlobalState, state$ };