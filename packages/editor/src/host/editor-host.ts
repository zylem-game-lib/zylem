/**
 * Editor Host Helpers
 *
 * Reusable wiring for apps that embed the <zylem-editor> overlay next to a
 * running Zylem game. These helpers are thin wrappers over the shared
 * `@zylem/bridge` channel: the game applies editor commands itself (via its
 * bridge adapter), so hosts only need this module to mount the overlay,
 * mirror editor commands into their own stores, or push state into the
 * editor UI.
 */

import { getZylemBridge, type BridgeDebugTool } from '@zylem/bridge';
import {
	sendDebugEnabled,
	sendPlayback,
	sendTool,
} from '../bridge/editor-bridge';
import { debugState as editorDebugState } from '../components/entities/entities-state';
import { setDebugStore } from '../components/editor-store';
import {
	registerZylemEditor,
	type ZylemEditorElement,
} from '../web-components/zylem-editor';
import type { EditorLauncherMode } from '../App';

/**
 * Nested state payload used by host-facing helpers.
 * Mirrors the historical `editor-state-dispatch` window-event shape so
 * existing hosts keep working; internally everything rides the bridge.
 */
export interface EditorUpdatePayload {
	gameState?: {
		debugFlag?: boolean;
		[key: string]: unknown;
	};
	toolbarState?: {
		tool?: BridgeDebugTool;
		paused?: boolean;
	};
	[key: string]: unknown;
}

export interface EditorStateBridgeOptions {
	/**
	 * Called after each editor command has been sent to the game, so hosts
	 * can mirror the payload into their own stores (e.g. a SolidJS store).
	 */
	onStateDispatch?: (payload: EditorUpdatePayload) => void;
}

export interface EditorStateBridge {
	/** Push external app state back into the editor UI. */
	dispatchToEditor(payload: EditorUpdatePayload): void;
	/** Remove the bridge subscriptions installed by this helper. */
	dispose(): void;
}

/**
 * Push a state update payload into the editor UI (stores + game command).
 * Safe to call in non-browser environments (no-op side effects only).
 */
export function dispatchToEditor(payload: EditorUpdatePayload): void {
	if (payload.gameState?.debugFlag !== undefined) {
		setDebugStore('debug', payload.gameState.debugFlag);
	}
	if (payload.toolbarState?.tool !== undefined) {
		editorDebugState.tool = payload.toolbarState.tool;
	}
	if (payload.toolbarState?.paused !== undefined) {
		editorDebugState.paused = payload.toolbarState.paused;
	}
}

/**
 * Observe editor→game commands on the shared bridge.
 *
 * The game side applies commands itself; this helper exists so external
 * hosts can mirror editor actions (debug toggle, tool, pause) into their own
 * state via `onStateDispatch`.
 *
 * This deliberately does **not** open the editor's game→editor store
 * subscriptions. Those are owned by `<zylem-editor>` for the duration it is
 * mounted, and the game gates expensive work (thumbnail renders, entity
 * summaries) on them being present. A long-lived host helper holding one open
 * would keep that work running forever, even with no editor on screen. Hosts
 * that render editor components without the custom element should call
 * `connectEditorBridge()` directly and release it themselves.
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
	const { channel } = getZylemBridge();
	const unsubscribes = [
		channel.on('debug:set', ({ enabled }) => {
			options.onStateDispatch?.({ gameState: { debugFlag: enabled } });
		}),
		channel.on('tool:set', ({ tool }) => {
			options.onStateDispatch?.({ toolbarState: { tool } });
		}),
		channel.on('playback:set', ({ paused }) => {
			options.onStateDispatch?.({ toolbarState: { paused } });
		}),
	];

	return {
		dispatchToEditor,
		dispose() {
			for (const unsubscribe of unsubscribes) unsubscribe();
		},
	};
}

/**
 * Send an editor state payload as bridge commands to the running game.
 *
 * @deprecated Use the typed bridge commands (`sendDebugEnabled`, `sendTool`,
 * `sendPlayback`) instead. Kept for hosts migrating off the old
 * window-CustomEvent API.
 */
export function dispatchEditorUpdate(payload: EditorUpdatePayload): void {
	if (payload.gameState?.debugFlag !== undefined) {
		sendDebugEnabled(payload.gameState.debugFlag);
	}
	if (payload.toolbarState?.tool !== undefined) {
		sendTool(payload.toolbarState.tool);
	}
	if (payload.toolbarState?.paused !== undefined) {
		sendPlayback(payload.toolbarState.paused);
	}
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
