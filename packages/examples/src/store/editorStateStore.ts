/**
 * Editor State Store
 *
 * SolidJS store that listens for state dispatch events from @zylem/editor.
 * Can also dispatch updates back to the editor.
 */

import { createStore } from 'solid-js/store';
import {
    EDITOR_STATE_DISPATCH,
    EDITOR_STATE_RECEIVE,
    type EditorUpdatePayload,
} from '@zylem/editor';
import { debugState, setDebugTool, setPaused, type DebugTools } from '@zylem/game-lib';

export interface GameState {
    debugFlag: boolean;
}

export interface ToolbarState {
    tool: DebugTools;
    paused: boolean;
}

export interface EditorStateStore {
    gameState: GameState;
    toolbarState: ToolbarState;
}

export const [editorStateStore, setEditorStateStore] = createStore<EditorStateStore>({
    gameState: {
        debugFlag: false,
    },
    toolbarState: {
        tool: 'none',
        paused: false,
    },
});

// Actions
export const setDebugFlag = (value: boolean) => {
    setEditorStateStore('gameState', 'debugFlag', value);
    // Directly mutate game-lib's debugState (no re-render)
    debugState.enabled = value;
};

export const setTool = (value: DebugTools) => {
    setEditorStateStore('toolbarState', 'tool', value);
    setDebugTool(value);
};

export const setPausedState = (value: boolean) => {
    setEditorStateStore('toolbarState', 'paused', value);
    setPaused(value);
};

/**
 * Reset all editor state to defaults.
 * Call this when switching demos to ensure clean state.
 */
export const resetEditorState = () => {
    // Reset store to defaults
    setEditorStateStore('gameState', 'debugFlag', false);
    setEditorStateStore('toolbarState', 'tool', 'none');
    setEditorStateStore('toolbarState', 'paused', false);

    // Sync with game-lib's debugState
    debugState.enabled = false;
    setDebugTool('none');
    setPaused(false);

    // Notify editor of the reset
    dispatchToEditor({
        gameState: { debugFlag: false },
        toolbarState: { tool: 'none', paused: false },
    });
};

/**
 * Dispatch state updates to the editor.
 * Use this when external app state changes need to sync back to editor UI.
 */
export const dispatchToEditor = (payload: EditorUpdatePayload): void => {
    if (typeof window === 'undefined') return;

    window.dispatchEvent(
        new CustomEvent(EDITOR_STATE_RECEIVE, {
            detail: payload,
            bubbles: true,
        }),
    );
};

// Listen for state dispatch events from @zylem/editor
if (typeof window !== 'undefined') {
    window.addEventListener(EDITOR_STATE_DISPATCH, ((event: CustomEvent<EditorUpdatePayload>) => {
        const payload = event.detail;
        if (payload.gameState?.debugFlag !== undefined) {
            setDebugFlag(payload.gameState.debugFlag);
        }
        if (payload.toolbarState?.tool !== undefined) {
            setTool(payload.toolbarState.tool);
        }
        if (payload.toolbarState?.paused !== undefined) {
            setPausedState(payload.toolbarState.paused);
        }
    }) as EventListener);
}

