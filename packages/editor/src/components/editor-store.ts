/**
 * SolidJS store for debug UI state.
 * Syncs with the valtio-based debug-state for reactivity in Solid components.
 * Persists layout state to localStorage.
 */

import { createStore } from 'solid-js/store';
import { subscribe } from 'valtio/vanilla';
import { debugState, type DebugTools } from './entities/entities-state';
import {
	createEmptyDockRegistry,
	findDockedSide,
	insertIntoZone,
	normalizeDockRegistry,
	removeFromZones,
	type DockPanelId,
	type DockRegistry,
	type DockSide,
} from './common/dock-layout';

// localStorage key for persisted state
const STORAGE_KEY = 'zylem-editor-state';

/** Registry id of the main editor panel; detached sections use their panel id. */
export const MAIN_PANEL_ID = 'main';

// Default panel order
const DEFAULT_PANEL_ORDER = ['game-config', 'stage-config', 'entities', 'console', 'bridge'];

/**
 * Merge panels added since a user's layout was persisted. Without this, an
 * existing localStorage `panelOrder` would permanently hide new panels.
 */
const withNewPanels = (stored: string[] | undefined): string[] => {
	if (!stored) return [...DEFAULT_PANEL_ORDER];
	const missing = DEFAULT_PANEL_ORDER.filter((id) => !stored.includes(id));
	return missing.length > 0 ? [...stored, ...missing] : stored;
};

export interface DetachedPanelState {
	position: { x: number; y: number };
	size: { width: number; height: number };
}

/** First-run dock assignments a host can request; see `applyDefaultDocks`. */
export type EditorDockDefaults = Partial<Record<DockSide, DockPanelId[]>>;

// State that gets persisted to localStorage
interface PersistedState {
	panelPosition: { x: number; y: number } | null;
	panelSize: { width: number; height: number } | null;
	toggleButtonPosition: { x: number; y: number };
	panelOrder: string[];
	detachedPanels: Record<string, DetachedPanelState>;
	openSections: string[];
	panelZOrder: string[];
	docks: DockRegistry;
	dockDefaultsApplied: boolean;
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
	/** Main panel's floating size; its docked size comes from the registry. */
	panelSize: persisted.panelSize ?? null,
	toggleButtonPosition: persisted.toggleButtonPosition ?? { x: 0, y: 0 },
	// Detachable panel state
	panelOrder: withNewPanels(persisted.panelOrder),
	detachedPanels: persisted.detachedPanels ?? {} as Record<string, DetachedPanelState>,
	openSections: persisted.openSections ?? ['console'],
	// Z-index ordering (last item = on top)
	panelZOrder: persisted.panelZOrder ?? [],
	// Which panels are docked to which viewport edge, and how thick each edge is
	docks: normalizeDockRegistry(persisted.docks),
	dockDefaultsApplied: persisted.dockDefaultsApplied ?? false,
	// Drag-to-reattach state (not persisted)
	draggingPanelId: null as string | null,
	dropTargetIndex: null as number | null,
});

// Helper to save current persisted state
const persistState = () => {
	savePersistedState({
		panelPosition: debugStore.panelPosition,
		panelSize: debugStore.panelSize,
		toggleButtonPosition: debugStore.toggleButtonPosition,
		panelOrder: debugStore.panelOrder,
		detachedPanels: debugStore.detachedPanels,
		openSections: debugStore.openSections,
		panelZOrder: debugStore.panelZOrder,
		docks: debugStore.docks,
		dockDefaultsApplied: debugStore.dockDefaultsApplied,
	});
};

// Panel position actions
export const setPanelPosition = (pos: { x: number; y: number }) => {
	setDebugStore('panelPosition', pos);
	persistState();
};

export const setPanelSize = (size: { width: number; height: number }) => {
	setDebugStore('panelSize', size);
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
	// A panel living back in the accordion can't also hold a dock slot.
	setDebugStore('docks', removeFromZones(debugStore.docks, panelId));

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

// Dock registry actions. Rects are derived from this by `computeDockLayout`,
// so moving a panel between zones relayouts every other docked panel too.
export const dockPanelToSide = (
	panelId: DockPanelId,
	side: DockSide,
	index?: number,
) => {
	setDebugStore('docks', insertIntoZone(debugStore.docks, panelId, side, index));
	persistState();
};

export const undockPanelFromSides = (panelId: DockPanelId) => {
	if (!findDockedSide(debugStore.docks, panelId)) return;
	setDebugStore('docks', removeFromZones(debugStore.docks, panelId));
	persistState();
};

export const setDockThickness = (side: DockSide, thickness: number) => {
	setDebugStore('docks', side, 'thickness', Math.max(1, Math.round(thickness)));
	persistState();
};

export const getDockedSide = (panelId: DockPanelId): DockSide | null =>
	findDockedSide(debugStore.docks, panelId);

/**
 * Seed a host's preferred dock layout the first time the editor runs.
 *
 * Sections named here are pulled out of the accordion first, since only a
 * detached section can hold a dock slot. Guarded by `dockDefaultsApplied` so a
 * returning user's own layout is never overwritten.
 */
export const applyDefaultDocks = (defaults: EditorDockDefaults | undefined) => {
	if (!defaults || debugStore.dockDefaultsApplied) return;

	let docks = createEmptyDockRegistry();
	let seeded = false;

	for (const side of ['left', 'right', 'top', 'bottom'] as const) {
		for (const panelId of defaults[side] ?? []) {
			if (panelId !== MAIN_PANEL_ID && !isPanelDetached(panelId)) {
				setDebugStore('detachedPanels', panelId, {
					position: { x: 100, y: 100 },
					size: { width: 350, height: 300 },
				});
				setDebugStore('openSections', (sections) => sections.filter((s) => s !== panelId));
				setDebugStore('panelZOrder', [
					...debugStore.panelZOrder.filter((id) => id !== panelId),
					panelId,
				]);
			}
			docks = insertIntoZone(docks, panelId, side);
			seeded = true;
		}
	}

	if (seeded) {
		setDebugStore('docks', docks);
	}
	setDebugStore('dockDefaultsApplied', true);
	persistState();
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

