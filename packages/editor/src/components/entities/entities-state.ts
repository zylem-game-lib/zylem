/**
 * Entities state for the entities section.
 * Manages debug state and entity selection/hover.
 */

import { proxy } from 'valtio/vanilla';
import { editorEvents } from '../events';

export type DebugTools = 'select' | 'translate' | 'rotate' | 'scale' | 'delete' | 'add' | 'none';

export interface DebugState {
    paused: boolean;
    tool: DebugTools;
    selectedEntityId: string | null;
    /**
     * Full selection, mirroring the game. `selectedEntityId` is its first entry,
     * kept so single-select consumers need no change.
     */
    selectedEntityIds: string[];
    hoveredEntityId: string | null;
    /**
     * Most recently selected or created entity, kept after it is deselected.
     *
     * What the gizmo tools fall back to: pressing Rotate with nothing selected
     * should turn the thing you were last working on, rather than nothing. Never
     * cleared on deselect — only overwritten — and validated against the current
     * entity list at the point of use, since the entity it names can be deleted
     * or undone away.
     */
    lastTouchedEntityId: string | null;
    flags: Set<string>;
}

export const debugState = proxy<DebugState>({
    paused: false,
    tool: 'none',
    selectedEntityId: null,
    selectedEntityIds: [],
    hoveredEntityId: null,
    lastTouchedEntityId: null,
    flags: new Set(),
});

// Convenience functions
export function isPaused(): boolean {
    return debugState.paused;
}

export function setPaused(paused: boolean): void {
    debugState.paused = paused;
}

export function setDebugFlag(flag: string, value: boolean): void {
    if (value) {
        debugState.flags.add(flag);
    } else {
        debugState.flags.delete(flag);
    }
}

export function getDebugTool(): DebugTools {
    return debugState.tool;
}

export function setDebugTool(tool: DebugTools): void {
    debugState.tool = tool;
}

export function getHoveredEntityId(): string | null {
    return debugState.hoveredEntityId;
}

export function setHoveredEntityId(id: string | null): void {
    debugState.hoveredEntityId = id;
}

export function resetHoveredEntity(): void {
    debugState.hoveredEntityId = null;
}

export function getSelectedEntityId(): string | null {
    return debugState.selectedEntityId;
}

export function setSelectedEntityId(id: string | null): void {
    debugState.selectedEntityId = id;
    debugState.selectedEntityIds = id ? [id] : [];
    if (id) debugState.lastTouchedEntityId = id;
}

export function getSelectedEntityIds(): string[] {
    return [...debugState.selectedEntityIds];
}

/**
 * Record an entity as the one most recently worked on.
 *
 * Separate from selection because creating an entity counts too: placing a box
 * and then pressing Rotate should turn that box, even though placement leaves it
 * unselected. Ignores null so a deselect does not erase the memory.
 */
export function noteTouchedEntity(id: string | null): void {
    if (!id) return;
    debugState.lastTouchedEntityId = id;
}

export function getLastTouchedEntityId(): string | null {
    return debugState.lastTouchedEntityId;
}

// Subscribe to external events
editorEvents.on<Partial<DebugState>>('debug', (event) => {
    const payload = event.payload;
    if (payload.paused !== undefined) debugState.paused = payload.paused;
    if (payload.tool !== undefined) debugState.tool = payload.tool;
    if (payload.selectedEntityId !== undefined) debugState.selectedEntityId = payload.selectedEntityId;
    if (payload.hoveredEntityId !== undefined) debugState.hoveredEntityId = payload.hoveredEntityId;
});
