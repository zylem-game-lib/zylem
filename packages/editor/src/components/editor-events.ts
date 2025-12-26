/**
 * Editor Events Module
 *
 * Dispatch window CustomEvents from the editor to communicate with consuming applications.
 * This enables bidirectional communication between @zylem/editor and apps like examples.
 */

/**
 * Payload structure for editor-update events.
 * Matches the nested state structure expected by consumers.
 */
export interface EditorUpdatePayload {
    gameState?: {
        debugFlag?: boolean;
        [key: string]: unknown;
    };
    // Extensible for future sections like stageState, entityState, etc.
    [key: string]: unknown;
}

/**
 * Event name constant for consistency
 */
export const EDITOR_UPDATE_EVENT = 'editor-update';

/**
 * Dispatch an editor-update CustomEvent on the window.
 * Consumers can listen for this event to sync state with the editor.
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
        new CustomEvent(EDITOR_UPDATE_EVENT, {
            detail: payload,
            bubbles: true,
        }),
    );
}
