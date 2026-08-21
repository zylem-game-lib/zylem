/**
 * Undo/redo keyboard shortcuts.
 *
 * Listens on `window` rather than the editor's shadow root, because the pointer
 * is usually over the game canvas — which is outside the overlay — while
 * editing. game-lib's keyboard provider also listens on `window` but never calls
 * `preventDefault`, so gameplay bindings and these shortcuts coexist.
 */

import { redo, undo } from './history-store';

/** Tags that own their own undo stack and must keep their keystrokes. */
const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * Whether an event targets something the user is typing into.
 *
 * Walks the composed path, so a field inside the editor's shadow root is
 * recognised — `event.target` alone is retargeted to the host element and every
 * input in the overlay would look like the canvas.
 */
export function isEditableTarget(event: Event): boolean {
	const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
	const nodes = path.length ? path : [event.target];

	for (const node of nodes) {
		if (!(node instanceof HTMLElement)) continue;
		if (EDITABLE_TAGS.has(node.tagName)) return true;
		if (node.isContentEditable) return true;
	}
	return false;
}

/** Whether a keydown is the undo or redo chord, and which. */
export function classifyHistoryShortcut(
	event: KeyboardEvent,
): 'undo' | 'redo' | null {
	// `metaKey` on macOS, `ctrlKey` elsewhere. Accepting either means a user on
	// an external keyboard with the other convention still gets the shortcut.
	if (!event.metaKey && !event.ctrlKey) return null;
	if (event.altKey) return null;
	if (event.key.toLowerCase() !== 'z') return null;
	return event.shiftKey ? 'redo' : 'undo';
}

export interface HistoryShortcutOptions {
	/**
	 * Whether the shortcut is installed at all. Hosts that embed the editor
	 * inside their own app may want to route undo by focus instead, in which
	 * case they disable this and call `undo()` / `redo()` themselves.
	 * @default true
	 */
	enabled?: boolean;
	target?: Window;
}

/**
 * Install the undo/redo shortcut.
 *
 * @returns An uninstall function.
 */
export function installHistoryShortcuts(
	options: HistoryShortcutOptions = {},
): () => void {
	if (options.enabled === false) return () => {};

	const target = options.target
		?? (typeof window !== 'undefined' ? window : undefined);
	if (!target) return () => {};

	const onKeyDown = (event: KeyboardEvent) => {
		const action = classifyHistoryShortcut(event);
		if (!action) return;
		if (isEditableTarget(event)) return;

		// Claimed only once it is actually ours to handle, so the browser's own
		// undo still works in text fields.
		event.preventDefault();
		if (action === 'undo') {
			undo();
		} else {
			redo();
		}
	};

	target.addEventListener('keydown', onKeyDown);
	return () => target.removeEventListener('keydown', onKeyDown);
}
