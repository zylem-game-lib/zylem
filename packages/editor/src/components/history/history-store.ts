/**
 * Undo/redo history for scene edits.
 *
 * The editor owns the stack but never the inversion. Every edit originates in
 * the game (gizmo drags, placement clicks, delete clicks), so the game publishes
 * a committed before/after record and the editor stores it. Replaying one sends
 * it back over the bridge: undoing a delete has to produce the original entity
 * with its original uuid, which the editor could not do — all it ever receives
 * is a summary of name, type, and transform.
 *
 * In-memory only. A reload drops history, which is correct: the game's entities
 * are gone too, so the uuids every entry refers to would be dangling.
 */

import { proxy } from 'valtio/vanilla';
import type { SceneOperationPayload } from '@zylem/bridge';

import { bridgeChannel } from '../../bridge/editor-bridge';
import { mirrorProxy } from '../common/proxy-mirror';

/**
 * Depth cap. Each entry holds two poses per affected entity, so this is cheap;
 * the limit exists so a long editing session cannot grow without bound. The
 * game's detached-entity bin is sized above this, so a uuid still reachable
 * from here is still restorable.
 */
export const MAX_HISTORY_DEPTH = 100;

export interface HistoryState {
	/** Oldest first; the last entry is what `undo()` reverts. */
	undoStack: SceneOperationPayload[];
	/** Operations that have been undone, newest last. */
	redoStack: SceneOperationPayload[];
}

export const historyState = proxy<HistoryState>({
	undoStack: [],
	redoStack: [],
});

/** Solid-reactive view of {@link historyState}, for components. */
export const historyStore = mirrorProxy(historyState, { key: 'opId' });

export function canUndo(): boolean {
	return historyState.undoStack.length > 0;
}

export function canRedo(): boolean {
	return historyState.redoStack.length > 0;
}

/** Label of the operation `undo()` would revert, for menu text. */
export function undoLabel(): string | null {
	return historyState.undoStack[historyState.undoStack.length - 1]?.label ?? null;
}

/** Label of the operation `redo()` would replay. */
export function redoLabel(): string | null {
	return historyState.redoStack[historyState.redoStack.length - 1]?.label ?? null;
}

/**
 * Record a committed operation.
 *
 * Pushing invalidates the redo stack: once a new edit lands, the undone
 * operations describe a scene state that no longer exists on the other side of
 * the branch.
 */
export function pushOperation(op: SceneOperationPayload): void {
	historyState.undoStack.push(op);
	if (historyState.undoStack.length > MAX_HISTORY_DEPTH) {
		historyState.undoStack.shift();
	}
	if (historyState.redoStack.length) {
		historyState.redoStack = [];
	}
}

/** Revert the most recent operation. */
export function undo(): boolean {
	const op = historyState.undoStack.pop();
	if (!op) return false;
	historyState.redoStack.push(op);
	bridgeChannel.send('scene:operation:apply', { op, direction: 'undo' });
	return true;
}

/** Replay the most recently undone operation. */
export function redo(): boolean {
	const op = historyState.redoStack.pop();
	if (!op) return false;
	historyState.undoStack.push(op);
	bridgeChannel.send('scene:operation:apply', { op, direction: 'redo' });
	return true;
}

/**
 * Drop all history. Called on a fresh stage snapshot, because the entities the
 * stack refers to are gone and replaying an entry would either do nothing or
 * hit an unrelated entity that happens to share a uuid.
 */
export function clearHistory(): void {
	historyState.undoStack = [];
	historyState.redoStack = [];
}
