/**
 * Editor State Store
 *
 * SolidJS store that mirrors state dispatched from @zylem/editor.
 * The window listener + game-lib sync lives in the shared
 * `attachEditorStateBridge` helper from @zylem/editor; this store adds a
 * reactive mirror on top and can dispatch updates back to the editor.
 */

import { createStore } from 'solid-js/store';
import {
    attachEditorStateBridge,
    dispatchToEditor,
    type EditorUpdatePayload,
} from '@zylem/editor';
import { debugState, setDebugTool, setPaused, type DebugTools } from '@zylem/game-lib/debug';

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

export { dispatchToEditor };

// The shared bridge syncs editor dispatches into game-lib's debug state;
// mirror the payload into the Solid store so UI stays reactive.
if (typeof window !== 'undefined') {
    attachEditorStateBridge({
        onStateDispatch: (payload: EditorUpdatePayload) => {
            if (payload.gameState?.debugFlag !== undefined) {
                setEditorStateStore('gameState', 'debugFlag', payload.gameState.debugFlag);
            }
            if (payload.toolbarState?.tool !== undefined) {
                setEditorStateStore('toolbarState', 'tool', payload.toolbarState.tool);
            }
            if (payload.toolbarState?.paused !== undefined) {
                setEditorStateStore('toolbarState', 'paused', payload.toolbarState.paused);
            }
        },
    });
}
