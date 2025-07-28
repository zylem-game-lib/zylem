import { proxy } from 'valtio';
import { GlobalVariablesType } from './game-interfaces';

const state = proxy({
	id: '',
	globals: {} as GlobalVariablesType,
	time: 0,
});

const setGlobalState = (key: string, value: any) => {
	state.globals[key] = value;
};

const getGlobalState = (key?: string) => {
	if (key) {
		return state.globals[key];
	}
	return state.globals;
};

export { setGlobalState, getGlobalState, state };