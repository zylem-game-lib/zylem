/**
 * Escape-to-disarm for the editor tools.
 *
 * Placement and the gizmo modes are sticky by design — you place ten crates
 * without re-picking the crate — so there has to be a way out that is not
 * "find the button you pressed and press it again". Escape is that way out.
 */

import { getDebugTool, setDebugTool } from '../entities/entities-state';
import { sendAddType, sendTool } from '../../bridge/editor-bridge';
import { isEditableTarget } from '../history/history-shortcuts';
import { catalogState, setArmedType } from './catalog-state';

export interface ToolShortcutOptions {
	/** @default true */
	enabled?: boolean;
	target?: Window;
}

/** Drop the armed placement type and return to the neutral tool. */
export function disarmTools(): boolean {
	const hadTool = getDebugTool() !== 'none';
	const hadType = catalogState.armedTypeId !== null;
	if (!hadTool && !hadType) return false;

	if (hadType) {
		setArmedType(null);
		sendAddType(null);
	}
	if (hadTool) {
		setDebugTool('none');
		sendTool('none');
	}
	return true;
}

/**
 * Install the Escape shortcut.
 *
 * @returns An uninstall function.
 */
export function installToolShortcuts(options: ToolShortcutOptions = {}): () => void {
	if (options.enabled === false) return () => {};

	const target = options.target
		?? (typeof window !== 'undefined' ? window : undefined);
	if (!target) return () => {};

	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key !== 'Escape') return;
		if (isEditableTarget(event)) return;
		// Only claimed when a tool was actually active, so Escape still closes
		// popovers and dialogs the rest of the time.
		if (disarmTools()) event.preventDefault();
	};

	target.addEventListener('keydown', onKeyDown);
	return () => target.removeEventListener('keydown', onKeyDown);
}
