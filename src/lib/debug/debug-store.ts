import { createStore } from 'solid-js/store';
import { debugState$ } from '../state/debug-state';

export const [debugStore, setDebugStore] = createStore({
	debug: false,
});

debugState$.onChange(() => {
	setDebugStore('debug', debugState$.on.get());
});
