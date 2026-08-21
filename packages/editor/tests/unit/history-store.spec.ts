import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getZylemBridge, type SceneOperationPayload } from '@zylem/bridge';

import {
	canRedo,
	canUndo,
	clearHistory,
	historyState,
	MAX_HISTORY_DEPTH,
	pushOperation,
	redo,
	redoLabel,
	undo,
	undoLabel,
} from '../../src/components/history/history-store';

function operation(
	opId: string,
	overrides: Partial<SceneOperationPayload> = {},
): SceneOperationPayload {
	return {
		opId,
		kind: 'transform',
		label: `Move ${opId}`,
		entries: [
			{
				uuid: `entity-${opId}`,
				before: { position: { x: 0, y: 0, z: 0 } },
				after: { position: { x: 1, y: 0, z: 0 } },
			},
		],
		...overrides,
	};
}

let applied: Array<{ opId: string; direction: string }>;
let stopCapture: (() => void) | null = null;

beforeEach(() => {
	getZylemBridge().channel.reset();
	clearHistory();

	// Applications the editor sends back over the bridge for the game to invert.
	applied = [];
	stopCapture = getZylemBridge().channel.on(
		'scene:operation:apply',
		({ op, direction }) => {
			applied.push({ opId: op.opId, direction });
		},
	);
});

afterEach(() => {
	stopCapture?.();
	stopCapture = null;
});

describe('history stacks', () => {
	it('starts empty', () => {
		expect(canUndo()).toBe(false);
		expect(canRedo()).toBe(false);
		expect(undoLabel()).toBeNull();
		expect(redoLabel()).toBeNull();
	});

	it('undoes in reverse order', () => {
		pushOperation(operation('a'));
		pushOperation(operation('b'));
		pushOperation(operation('c'));

		undo();
		undo();

		expect(applied.map((entry) => entry.opId)).toEqual(['c', 'b']);
	});

	it('redoes in the order the operations were undone', () => {
		pushOperation(operation('a'));
		pushOperation(operation('b'));
		undo();
		undo();
		applied.length = 0;

		redo();
		redo();

		// Redo unwinds the undo stack, so 'a' (undone last) replays first.
		expect(applied.map((entry) => entry.opId)).toEqual(['a', 'b']);
	});

	it('sends the direction the game needs to invert with', () => {
		pushOperation(operation('a'));
		undo();
		redo();

		expect(applied).toEqual([
			{ opId: 'a', direction: 'undo' },
			{ opId: 'a', direction: 'redo' },
		]);
	});

	it('reports whether there is anything to undo or redo', () => {
		pushOperation(operation('a'));
		expect(canUndo()).toBe(true);
		expect(canRedo()).toBe(false);

		undo();
		expect(canUndo()).toBe(false);
		expect(canRedo()).toBe(true);
	});

	it('exposes the labels a menu would show', () => {
		pushOperation(operation('a', { label: 'Move Crate' }));
		pushOperation(operation('b', { label: 'Rotate Ball' }));

		expect(undoLabel()).toBe('Rotate Ball');

		undo();
		expect(undoLabel()).toBe('Move Crate');
		expect(redoLabel()).toBe('Rotate Ball');
	});

	it('does nothing and reports false on an empty stack', () => {
		expect(undo()).toBe(false);
		expect(redo()).toBe(false);
		expect(applied).toHaveLength(0);
	});

	it('round-trips back to the starting state', () => {
		pushOperation(operation('a'));
		pushOperation(operation('b'));

		undo();
		undo();
		redo();
		redo();

		expect(historyState.undoStack.map((op) => op.opId)).toEqual(['a', 'b']);
		expect(canRedo()).toBe(false);
	});
});

describe('redo invalidation', () => {
	it('drops the redo stack when a new edit lands', () => {
		pushOperation(operation('a'));
		pushOperation(operation('b'));
		undo();
		expect(canRedo()).toBe(true);

		// The undone operation described a state on the other side of the branch
		// that no longer exists.
		pushOperation(operation('c'));

		expect(canRedo()).toBe(false);
		expect(historyState.undoStack.map((op) => op.opId)).toEqual(['a', 'c']);
	});

	it('leaves the redo stack alone when it is already empty', () => {
		pushOperation(operation('a'));
		pushOperation(operation('b'));
		expect(historyState.redoStack).toHaveLength(0);
	});

	it('keeps redo available across successive undos', () => {
		pushOperation(operation('a'));
		pushOperation(operation('b'));
		undo();
		undo();

		expect(historyState.redoStack.map((op) => op.opId)).toEqual(['b', 'a']);
	});
});

describe('history depth', () => {
	it('caps the stack and drops the oldest entry', () => {
		for (let i = 0; i < MAX_HISTORY_DEPTH + 5; i += 1) {
			pushOperation(operation(`op-${i}`));
		}

		expect(historyState.undoStack).toHaveLength(MAX_HISTORY_DEPTH);
		expect(historyState.undoStack[0]!.opId).toBe('op-5');
		expect(historyState.undoStack.at(-1)!.opId).toBe(
			`op-${MAX_HISTORY_DEPTH + 4}`,
		);
	});

	it('stays within the game-side recycle bin window', () => {
		// The game keeps 200 detached entities, so every uuid still reachable
		// from a full history stack is still restorable.
		expect(MAX_HISTORY_DEPTH).toBeLessThan(200);
	});
});

describe('clearHistory', () => {
	it('drops both stacks', () => {
		pushOperation(operation('a'));
		pushOperation(operation('b'));
		undo();

		clearHistory();

		expect(canUndo()).toBe(false);
		expect(canRedo()).toBe(false);
	});
});

describe('bridge integration', () => {
	it('records operations the game publishes', async () => {
		const { connectEditorBridge } = await import('../../src/bridge/editor-bridge');
		const disconnect = connectEditorBridge();
		clearHistory();

		getZylemBridge().channel.send('scene:operation', operation('from-game'));

		expect(historyState.undoStack.map((op) => op.opId)).toEqual(['from-game']);
		disconnect();
	});

	it('clears history when a new stage snapshot arrives', async () => {
		const { connectEditorBridge } = await import('../../src/bridge/editor-bridge');
		const disconnect = connectEditorBridge();
		pushOperation(operation('a'));

		// Every uuid in the stack belongs to the previous stage.
		getZylemBridge().channel.send('stage:snapshot', { stage: null, entities: [] });

		expect(canUndo()).toBe(false);
		disconnect();
	});
});

describe('history subscribers', () => {
	it('notifies valtio subscribers so toolbar buttons re-enable', async () => {
		const { subscribe } = await import('valtio/vanilla');
		const onChange = vi.fn();
		const unsubscribe = subscribe(historyState, onChange);

		pushOperation(operation('a'));
		await Promise.resolve();

		expect(onChange).toHaveBeenCalled();
		unsubscribe();
	});
});
