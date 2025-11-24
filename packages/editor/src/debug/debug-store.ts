import { createStore } from 'solid-js/store';
import { subscribe } from 'valtio/vanilla';
import { DebugTools, debugState } from './debug-state';

export const [debugStore, setDebugStore] = createStore({
	debug: false,
	tool: DebugTools.NONE as keyof typeof DebugTools,
	paused: false,
	hovered: null as string | null,
	selected: [] as string[],
});

subscribe(debugState, () => {
	setDebugStore('debug', debugState.on);
	setDebugStore('tool', debugState.tool);
	setDebugStore('paused', debugState.paused);
	setDebugStore('hovered', debugState.hovered);
	setDebugStore('selected', [...debugState.selected]);
});
