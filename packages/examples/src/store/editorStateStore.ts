/**
 * Editor State Store
 *
 * SolidJS store that mirrors editor commands sent over the shared
 * `@zylem/bridge` channel. The bridge subscription lives in the
 * `attachEditorStateBridge` helper from @zylem/editor (the running game
 * applies commands itself via its own bridge adapter); this store adds a
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

// Editor commands ride the @zylem/bridge channel and are applied to the
// game by game-lib itself; mirror the payload into the Solid store so UI
// stays reactive.
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
