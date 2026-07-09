/**
 * Editor Host Helpers
 *
 * Reusable wiring for apps that embed the <zylem-editor> overlay next to a
 * running Zylem game. Consolidates the mount + state-bridge boilerplate that
 * was previously duplicated across consuming apps (examples, creator preview).
 */

import { debugState, setDebugTool, setPaused } from '@zylem/game-lib/debug';
import {
    EDITOR_STATE_DISPATCH,
    EDITOR_STATE_RECEIVE,
    type EditorUpdatePayload,
} from '../components/editor-events';
import {
    registerZylemEditor,
    type ZylemEditorElement,
} from '../web-components/zylem-editor';
import type { EditorLauncherMode } from '../App';

export interface EditorStateBridgeOptions {
    /**
     * Called after each editor state dispatch has been applied to the
     * game-lib debug state, so hosts can mirror the payload into their own
     * stores (e.g. a SolidJS store).
     */
    onStateDispatch?: (payload: EditorUpdatePayload) => void;
}

export interface EditorStateBridge {
    /** Push external app state back into the editor UI. */
    dispatchToEditor(payload: EditorUpdatePayload): void;
    /** Remove the window listener installed by the bridge. */
    dispose(): void;
}

/**
 * Dispatch a state update payload to the editor (EDITOR_STATE_RECEIVE).
 * Safe to call in non-browser environments (no-op).
 */
export function dispatchToEditor(payload: EditorUpdatePayload): void {
    if (typeof window === 'undefined') return;

    window.dispatchEvent(
        new CustomEvent(EDITOR_STATE_RECEIVE, {
            detail: payload,
            bubbles: true,
        }),
    );
}

/**
 * Listen for editor state dispatches (EDITOR_STATE_DISPATCH) and sync them
 * into the game-lib debug state: debug flag, active tool, and pause state.
 *
 * @example
 * ```ts
 * import { attachEditorStateBridge } from '@zylem/editor';
 * const bridge = attachEditorStateBridge();
 * // later: bridge.dispatchToEditor({ gameState: { debugFlag: false } });
 * ```
 */
export function attachEditorStateBridge(
    options: EditorStateBridgeOptions = {},
): EditorStateBridge {
    const listener = ((event: CustomEvent<EditorUpdatePayload>) => {
        const payload = event.detail;
        if (payload.gameState?.debugFlag !== undefined) {
            debugState.enabled = payload.gameState.debugFlag;
        }
        if (payload.toolbarState?.tool !== undefined) {
            setDebugTool(payload.toolbarState.tool);
        }
        if (payload.toolbarState?.paused !== undefined) {
            setPaused(payload.toolbarState.paused);
        }
        options.onStateDispatch?.(payload);
    }) as EventListener;

    if (typeof window !== 'undefined') {
        window.addEventListener(EDITOR_STATE_DISPATCH, listener);
    }

    return {
        dispatchToEditor,
        dispose() {
            if (typeof window !== 'undefined') {
                window.removeEventListener(EDITOR_STATE_DISPATCH, listener);
            }
        },
    };
}

export interface MountZylemEditorOptions extends EditorStateBridgeOptions {
    /**
     * Controls the editor's floating launcher button.
     * @default 'floating'
     */
    launcherMode?: EditorLauncherMode;
    /**
     * Element the <zylem-editor> overlay is appended to.
     * @default document.body
     */
    target?: HTMLElement;
}

export interface MountedZylemEditor extends EditorStateBridge {
    element: ZylemEditorElement;
}

/**
 * Imperatively mount a <zylem-editor> overlay and attach the state bridge.
 * Intended for non-JSX hosts (e.g. a plain-TS preview iframe).
 *
 * @example
 * ```ts
 * import { mountZylemEditor } from '@zylem/editor';
 * mountZylemEditor({ launcherMode: 'floating' });
 * ```
 */
export function mountZylemEditor(
    options: MountZylemEditorOptions = {},
): MountedZylemEditor {
    registerZylemEditor();

    const element = document.createElement('zylem-editor') as ZylemEditorElement;
    element.setAttribute('launcher-mode', options.launcherMode ?? 'floating');
    (options.target ?? document.body).appendChild(element);

    const bridge = attachEditorStateBridge(options);

    return {
        element,
        dispatchToEditor: bridge.dispatchToEditor,
        dispose() {
            bridge.dispose();
            element.remove();
        },
    };
}
