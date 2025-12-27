/**
 * Editor Events Module
 *
 * Bidirectional window CustomEvents for communication between @zylem/editor and consuming apps.
 *
 * EDITOR_STATE_DISPATCH: Editor sends state changes → external apps listen
 * EDITOR_STATE_RECEIVE: External apps send updates → editor listens
 */

import { debugState } from './entities/entities-state';
import { setDebugStore } from './editor-store';

/**
 * Payload structure for editor state events.
 * Matches the nested state structure for both directions.
 */
export interface EditorUpdatePayload {
    gameState?: {
        debugFlag?: boolean;
        [key: string]: unknown;
    };
    toolbarState?: {
        tool?: 'select' | 'translate' | 'rotate' | 'scale' | 'delete' | 'none';
        paused?: boolean;
    };
    // Extensible for future sections like stageState, entityState, etc.
    [key: string]: unknown;
}

/**
 * Event name constants
 */
// Editor dispatches, external apps listen
export const EDITOR_STATE_DISPATCH = 'editor-state-dispatch';
// External apps dispatch, editor listens
export const EDITOR_STATE_RECEIVE = 'editor-state-receive';

// Legacy alias for backwards compatibility
export const EDITOR_UPDATE_EVENT = EDITOR_STATE_DISPATCH;

/**
 * Dispatch state changes from the editor to external consumers.
 *
 * @param payload - The state update payload
 *
 * @example
 * ```ts
 * // From GameSection when debug checkbox changes
 * dispatchEditorUpdate({ gameState: { debugFlag: true } });
 * ```
 */
export function dispatchEditorUpdate(payload: EditorUpdatePayload): void {
    if (typeof window === 'undefined') return;

    window.dispatchEvent(
        new CustomEvent(EDITOR_STATE_DISPATCH, {
            detail: payload,
            bubbles: true,
        }),
    );
}

/**
 * Handle incoming state updates from external apps.
 */
function handleExternalUpdate(event: CustomEvent<EditorUpdatePayload>): void {
    const payload = event.detail;

    // Update game state
    if (payload.gameState?.debugFlag !== undefined) {
        setDebugStore('debug', payload.gameState.debugFlag);
    }

    // Update toolbar state
    if (payload.toolbarState?.tool !== undefined) {
        debugState.tool = payload.toolbarState.tool;
    }
    if (payload.toolbarState?.paused !== undefined) {
        debugState.paused = payload.toolbarState.paused;
    }
}

// Listen for external updates
if (typeof window !== 'undefined') {
    window.addEventListener(
        EDITOR_STATE_RECEIVE,
        handleExternalUpdate as EventListener,
    );
}

