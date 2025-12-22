/**
 * Local debug state for the editor.
 * This mirrors the structure from game-lib but is owned by the editor.
 */

import { proxy } from 'valtio';
import { editorEvents } from './events';

export type DebugTools = 'select' | 'translate' | 'rotate' | 'scale' | 'delete' | 'none';

export interface DebugState {
	enabled: boolean;
	paused: boolean;
	tool: DebugTools;
	selectedEntityId: string | null;
	hoveredEntityId: string | null;
	flags: Set<string>;
}

export const debugState = proxy<DebugState>({
	enabled: false,
	paused: false,
	tool: 'none',
	selectedEntityId: null,
	hoveredEntityId: null,
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
}

// Subscribe to external events
editorEvents.on<Partial<DebugState>>('debug', (event) => {
	const payload = event.payload;
	if (payload.enabled !== undefined) debugState.enabled = payload.enabled;
	if (payload.paused !== undefined) debugState.paused = payload.paused;
	if (payload.tool !== undefined) debugState.tool = payload.tool;
	if (payload.selectedEntityId !== undefined) debugState.selectedEntityId = payload.selectedEntityId;
	if (payload.hoveredEntityId !== undefined) debugState.hoveredEntityId = payload.hoveredEntityId;
});
