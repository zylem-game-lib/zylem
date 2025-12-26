/**
 * Editor State Store
 *
 * SolidJS store that listens for editor-update window events from @zylem/editor.
 * Directly updates game-lib's debugState to avoid re-renders.
 */

import { createStore } from 'solid-js/store';
import { EDITOR_UPDATE_EVENT, type EditorUpdatePayload } from '@zylem/editor';
import { debugState } from '@zylem/game-lib';

export interface GameState {
    debugFlag: boolean;
}

export interface EditorStateStore {
    gameState: GameState;
    // Future sections like stageState, entityState, etc.
}

export const [editorStateStore, setEditorStateStore] = createStore<EditorStateStore>({
    gameState: {
        debugFlag: false,
    },
});

// Actions
export const setDebugFlag = (value: boolean) => {
    setEditorStateStore('gameState', 'debugFlag', value);

    // Directly mutate game-lib's debugState (no re-render)
    debugState.enabled = value;
};

// Listen for editor-update events from @zylem/editor
if (typeof window !== 'undefined') {
    window.addEventListener(EDITOR_UPDATE_EVENT, ((event: CustomEvent<EditorUpdatePayload>) => {
        const payload = event.detail;
        if (payload.gameState?.debugFlag !== undefined) {
            setDebugFlag(payload.gameState.debugFlag);
        }
    }) as EventListener);
}
