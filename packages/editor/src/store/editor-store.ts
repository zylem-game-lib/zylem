/**
 * SolidJS store for debug UI state.
 * Syncs with the valtio-based debug-state for reactivity in Solid components.
 */

import { createStore } from 'solid-js/store';
import { subscribe } from 'valtio/vanilla';
import { debugState, type DebugTools } from './debug-state';

export const [debugStore, setDebugStore] = createStore({
	debug: false,
	tool: 'none' as DebugTools,
	paused: false,
	hovered: null as string | null,
	selected: [] as string[],
});

// Sync valtio state to SolidJS store
subscribe(debugState, () => {
	setDebugStore('debug', debugState.enabled);
	setDebugStore('tool', debugState.tool);
	setDebugStore('paused', debugState.paused);
	setDebugStore('hovered', debugState.hoveredEntityId);
	setDebugStore('selected', debugState.selectedEntityId ? [debugState.selectedEntityId] : []);
});
