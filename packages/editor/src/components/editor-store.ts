/**
 * SolidJS store for debug UI state.
 * Syncs with the valtio-based debug-state for reactivity in Solid components.
 * Persists layout state to localStorage.
 */

import { createStore } from 'solid-js/store';
import { subscribe } from 'valtio/vanilla';
import { debugState, type DebugTools } from './entities/entities-state';

// localStorage key for persisted state
const STORAGE_KEY = 'zylem-editor-state';

// Default panel order
const DEFAULT_PANEL_ORDER = ['game-config', 'stage-config', 'entities', 'console'];

export interface DetachedPanelState {
	position: { x: number; y: number };
	size: { width: number; height: number };
}

// State that gets persisted to localStorage
interface PersistedState {
	panelPosition: { x: number; y: number } | null;
	toggleButtonPosition: { x: number; y: number };
	panelOrder: string[];
	detachedPanels: Record<string, DetachedPanelState>;
	openSections: string[];
	panelZOrder: string[];
}

// Load persisted state from localStorage
const loadPersistedState = (): Partial<PersistedState> => {
	if (typeof window === 'undefined') return {};
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (e) {
		console.warn('Failed to load editor state from localStorage:', e);
	}
	return {};
};

// Save state to localStorage
const savePersistedState = (state: PersistedState) => {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch (e) {
		console.warn('Failed to save editor state to localStorage:', e);
	}
};

// Load initial state
const persisted = loadPersistedState();

export const [debugStore, setDebugStore] = createStore({
	debug: false,
	tool: 'none' as DebugTools,
	paused: false,
	hovered: null as string | null,
	selected: [] as string[],
	panelPosition: persisted.panelPosition ?? null,
	toggleButtonPosition: persisted.toggleButtonPosition ?? { x: 0, y: 0 },
	// Detachable panel state
	panelOrder: persisted.panelOrder ?? [...DEFAULT_PANEL_ORDER],
	detachedPanels: persisted.detachedPanels ?? {} as Record<string, DetachedPanelState>,
	openSections: persisted.openSections ?? ['console'],
	// Z-index ordering (last item = on top)
	panelZOrder: persisted.panelZOrder ?? [],
	// Drag-to-reattach state (not persisted)
	draggingPanelId: null as string | null,
	dropTargetIndex: null as number | null,
});

// Helper to save current persisted state
const persistState = () => {
	savePersistedState({
		panelPosition: debugStore.panelPosition,
		toggleButtonPosition: debugStore.toggleButtonPosition,
		panelOrder: debugStore.panelOrder,
		detachedPanels: debugStore.detachedPanels,
		openSections: debugStore.openSections,
		panelZOrder: debugStore.panelZOrder,
	});
};

// Panel position actions
export const setPanelPosition = (pos: { x: number; y: number }) => {
	setDebugStore('panelPosition', pos);
	persistState();
};

export const setToggleButtonPosition = (pos: { x: number; y: number }) => {
	setDebugStore('toggleButtonPosition', pos);
	persistState();
};

// Detachable panel actions
export const detachPanel = (panelId: string, position: { x: number; y: number }) => {
	setDebugStore('detachedPanels', panelId, {
		position,
		size: { width: 350, height: 300 },
	});
	// Remove from open sections since it's now floating
	setDebugStore('openSections', (sections) => sections.filter((s) => s !== panelId));
	// Add to z-order (on top)
	setDebugStore('panelZOrder', [...debugStore.panelZOrder.filter((id) => id !== panelId), panelId]);
	persistState();
};

export const reattachPanel = (panelId: string, insertIndex?: number) => {
	// Remove from detached panels
	setDebugStore('detachedPanels', panelId, undefined!);
	// Remove from z-order
	setDebugStore('panelZOrder', debugStore.panelZOrder.filter((id) => id !== panelId));

	// Add back to panel order if not already present
	const currentOrder = debugStore.panelOrder;
	if (!currentOrder.includes(panelId)) {
		if (insertIndex !== undefined) {
			setDebugStore('panelOrder', [...currentOrder.slice(0, insertIndex), panelId, ...currentOrder.slice(insertIndex)]);
		} else {
			setDebugStore('panelOrder', [...currentOrder, panelId]);
		}
	}
	persistState();
};

export const bringPanelToFront = (panelId: string) => {
	// Move panel to end of z-order (highest z-index)
	setDebugStore('panelZOrder', [...debugStore.panelZOrder.filter((id) => id !== panelId), panelId]);
	persistState();
};

export const updateDetachedPanelPosition = (panelId: string, position: { x: number; y: number }) => {
	setDebugStore('detachedPanels', panelId, 'position', position);
	persistState();
};

export const updateDetachedPanelSize = (panelId: string, size: { width: number; height: number }) => {
	setDebugStore('detachedPanels', panelId, 'size', size);
	persistState();
};

export const reorderPanels = (newOrder: string[]) => {
	setDebugStore('panelOrder', newOrder);
	persistState();
};

export const setOpenSections = (sections: string[]) => {
	setDebugStore('openSections', sections);
	persistState();
};

export const isPanelDetached = (panelId: string): boolean => {
	return panelId in debugStore.detachedPanels;
};

// Drag-to-reattach state management (not persisted)
export const setDraggingPanel = (panelId: string | null) => {
	setDebugStore('draggingPanelId', panelId);
};

export const setDropTargetIndex = (index: number | null) => {
	setDebugStore('dropTargetIndex', index);
};

export const clearDragState = () => {
	setDebugStore('draggingPanelId', null);
	setDebugStore('dropTargetIndex', null);
};

// Sync valtio state to SolidJS store (not persisted - these are runtime state)
subscribe(debugState, () => {
	setDebugStore('tool', debugState.tool);
	setDebugStore('paused', debugState.paused);
	setDebugStore('hovered', debugState.hoveredEntityId);
	setDebugStore('selected', debugState.selectedEntityId ? [debugState.selectedEntityId] : []);
});

