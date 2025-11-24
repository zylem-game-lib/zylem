import { createStore } from 'solid-js/store';
import { subscribe } from 'valtio/vanilla';
import { debugState, type DebugTools } from '../../../game-lib/src/lib/debug/debug-state';

export const [debugStore, setDebugStore] = createStore({
	debug: false,
	tool: 'none' as DebugTools,
	paused: false,
	hovered: null as string | null,
	selected: [] as string[],
});

subscribe(debugState, () => {
	setDebugStore('debug', debugState.enabled);
	setDebugStore('tool', debugState.tool);
	setDebugStore('paused', debugState.paused);
	setDebugStore('hovered', debugState.hoveredEntity?.uuid ?? null);
	setDebugStore('selected', debugState.selectedEntity ? [debugState.selectedEntity.uuid] : []);
});
