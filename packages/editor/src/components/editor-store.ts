/**
 * SolidJS store for debug UI state.
 * Syncs with the valtio-based debug-state for reactivity in Solid components.
 */

import { createStore } from 'solid-js/store';
import { subscribe } from 'valtio/vanilla';
import { debugState, type DebugTools } from './entities/entities-state';

// Default panel order
const DEFAULT_PANEL_ORDER = ['game-config', 'stage-config', 'entities', 'console'];

export interface DetachedPanelState {
	position: { x: number; y: number };
	size: { width: number; height: number };
}

export const [debugStore, setDebugStore] = createStore({
	debug: false,
	tool: 'none' as DebugTools,
	paused: false,
	hovered: null as string | null,
	selected: [] as string[],
	panelPosition: null as { x: number; y: number } | null,
	toggleButtonPosition: { x: 0, y: 0 },
	// Detachable panel state
	panelOrder: [...DEFAULT_PANEL_ORDER] as string[],
	detachedPanels: {} as Record<string, DetachedPanelState>,
	openSections: ['console'] as string[],
	// Z-index ordering (last item = on top)
	panelZOrder: [] as string[],
	// Drag-to-reattach state
	draggingPanelId: null as string | null,
	dropTargetIndex: null as number | null,
});

// Panel position actions
export const setPanelPosition = (pos: { x: number; y: number }) => {
	setDebugStore('panelPosition', pos);
};

export const setToggleButtonPosition = (pos: { x: number; y: number }) => {
	setDebugStore('toggleButtonPosition', pos);
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
};

export const bringPanelToFront = (panelId: string) => {
	// Move panel to end of z-order (highest z-index)
	setDebugStore('panelZOrder', [...debugStore.panelZOrder.filter((id) => id !== panelId), panelId]);
};

export const updateDetachedPanelPosition = (panelId: string, position: { x: number; y: number }) => {
	setDebugStore('detachedPanels', panelId, 'position', position);
};

export const updateDetachedPanelSize = (panelId: string, size: { width: number; height: number }) => {
	setDebugStore('detachedPanels', panelId, 'size', size);
};

export const reorderPanels = (newOrder: string[]) => {
	setDebugStore('panelOrder', newOrder);
};

export const setOpenSections = (sections: string[]) => {
	setDebugStore('openSections', sections);
};

export const isPanelDetached = (panelId: string): boolean => {
	return panelId in debugStore.detachedPanels;
};

// Drag-to-reattach state management
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

// Sync valtio state to SolidJS store
subscribe(debugState, () => {
	setDebugStore('debug', debugState.enabled);
	setDebugStore('tool', debugState.tool);
	setDebugStore('paused', debugState.paused);
	setDebugStore('hovered', debugState.hoveredEntityId);
	setDebugStore('selected', debugState.selectedEntityId ? [debugState.selectedEntityId] : []);
});
