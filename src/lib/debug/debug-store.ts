import { createStore } from 'solid-js/store';
import { subscribe } from 'valtio';
import { debugState } from './debug-state';

export const [debugStore, setDebugStore] = createStore({
	debug: false,
});

subscribe(debugState, () => {
	setDebugStore('debug', debugState.on);
});
