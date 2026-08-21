// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getZylemBridge, type SceneOperationPayload } from '@zylem/bridge';

import {
	classifyHistoryShortcut,
	installHistoryShortcuts,
	isEditableTarget,
} from '../../src/components/history/history-shortcuts';
import {
	clearHistory,
	pushOperation,
} from '../../src/components/history/history-store';

function operation(opId: string): SceneOperationPayload {
	return {
		opId,
		kind: 'transform',
		label: `Move ${opId}`,
		entries: [{ uuid: 'entity-1' }],
	};
}

function keydown(init: Partial<KeyboardEventInit> & { key: string }): KeyboardEvent {
	return new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
}

let applied: Array<{ opId: string; direction: string }>;
let stopCapture: (() => void) | null = null;
let uninstall: (() => void) | null = null;

beforeEach(() => {
	getZylemBridge().channel.reset();
	clearHistory();
	applied = [];
	stopCapture = getZylemBridge().channel.on(
		'scene:operation:apply',
		({ op, direction }) => {
			applied.push({ opId: op.opId, direction });
		},
	);
});

afterEach(() => {
	uninstall?.();
	uninstall = null;
	stopCapture?.();
	stopCapture = null;
	document.body.innerHTML = '';
});

describe('classifyHistoryShortcut', () => {
	it('recognises the undo chord on either modifier', () => {
		// Accepting both means a user on an external keyboard with the other
		// platform's convention still gets the shortcut.
		expect(classifyHistoryShortcut(keydown({ key: 'z', metaKey: true }))).toBe('undo');
		expect(classifyHistoryShortcut(keydown({ key: 'z', ctrlKey: true }))).toBe('undo');
	});

	it('recognises the redo chord', () => {
		expect(
			classifyHistoryShortcut(keydown({ key: 'z', metaKey: true, shiftKey: true })),
		).toBe('redo');
	});

	it('accepts the shifted key as reported by the browser', () => {
		expect(
			classifyHistoryShortcut(keydown({ key: 'Z', metaKey: true, shiftKey: true })),
		).toBe('redo');
	});

	it('ignores the bare key', () => {
		expect(classifyHistoryShortcut(keydown({ key: 'z' }))).toBeNull();
	});

	it('ignores other keys with the modifier held', () => {
		expect(classifyHistoryShortcut(keydown({ key: 's', metaKey: true }))).toBeNull();
	});

	it('ignores the chord when alt is also held', () => {
		// Alt is the free-transform modifier during a drag, so alt+cmd+z is not
		// an undo the user meant.
		expect(
			classifyHistoryShortcut(keydown({ key: 'z', metaKey: true, altKey: true })),
		).toBeNull();
	});
});

describe('isEditableTarget', () => {
	it('detects text inputs', () => {
		const input = document.createElement('input');
		document.body.append(input);
		const event = keydown({ key: 'z', metaKey: true });
		input.dispatchEvent(event);

		expect(isEditableTarget(event)).toBe(true);
	});

	it('detects textareas and selects', () => {
		for (const tag of ['textarea', 'select'] as const) {
			const element = document.createElement(tag);
			document.body.append(element);
			const event = keydown({ key: 'z', metaKey: true });
			element.dispatchEvent(event);
			expect(isEditableTarget(event)).toBe(true);
		}
	});

	it('detects contenteditable elements', () => {
		const div = document.createElement('div');
		div.setAttribute('contenteditable', 'true');
		document.body.append(div);
		const event = keydown({ key: 'z', metaKey: true });
		div.dispatchEvent(event);

		expect(isEditableTarget(event)).toBe(true);
	});

	it('does not treat an ordinary element as editable', () => {
		const canvas = document.createElement('canvas');
		document.body.append(canvas);
		const event = keydown({ key: 'z', metaKey: true });
		canvas.dispatchEvent(event);

		expect(isEditableTarget(event)).toBe(false);
	});

	it('sees through a shadow root via the composed path', () => {
		// `event.target` alone is retargeted to the host, so every input inside
		// the editor overlay would look like the game canvas.
		const host = document.createElement('div');
		document.body.append(host);
		const root = host.attachShadow({ mode: 'open' });
		const input = document.createElement('input');
		root.append(input);

		const event = keydown({ key: 'z', metaKey: true });
		input.dispatchEvent(event);

		expect(isEditableTarget(event)).toBe(true);
	});
});

describe('installHistoryShortcuts', () => {
	it('undoes on the chord', () => {
		uninstall = installHistoryShortcuts();
		pushOperation(operation('a'));

		window.dispatchEvent(keydown({ key: 'z', metaKey: true }));

		expect(applied).toEqual([{ opId: 'a', direction: 'undo' }]);
	});

	it('redoes on the shifted chord', () => {
		uninstall = installHistoryShortcuts();
		pushOperation(operation('a'));
		window.dispatchEvent(keydown({ key: 'z', metaKey: true }));
		applied.length = 0;

		window.dispatchEvent(keydown({ key: 'z', metaKey: true, shiftKey: true }));

		expect(applied).toEqual([{ opId: 'a', direction: 'redo' }]);
	});

	it('claims the event only when it handles it', () => {
		uninstall = installHistoryShortcuts();
		pushOperation(operation('a'));

		const handled = keydown({ key: 'z', metaKey: true });
		window.dispatchEvent(handled);
		expect(handled.defaultPrevented).toBe(true);

		const ignored = keydown({ key: 's', metaKey: true });
		window.dispatchEvent(ignored);
		// The host's own save shortcut has to keep working.
		expect(ignored.defaultPrevented).toBe(false);
	});

	it('leaves the chord to a focused text field', () => {
		uninstall = installHistoryShortcuts();
		pushOperation(operation('a'));

		const input = document.createElement('input');
		document.body.append(input);
		const event = keydown({ key: 'z', metaKey: true });
		input.dispatchEvent(event);

		// A numeric transform field owns its own undo stack.
		expect(applied).toHaveLength(0);
		expect(event.defaultPrevented).toBe(false);
	});

	it('installs nothing when disabled', () => {
		uninstall = installHistoryShortcuts({ enabled: false });
		pushOperation(operation('a'));

		window.dispatchEvent(keydown({ key: 'z', metaKey: true }));

		expect(applied).toHaveLength(0);
	});

	it('stops listening once uninstalled', () => {
		const stop = installHistoryShortcuts();
		pushOperation(operation('a'));
		stop();

		window.dispatchEvent(keydown({ key: 'z', metaKey: true }));

		expect(applied).toHaveLength(0);
	});

	it('is a no-op on an empty history', () => {
		uninstall = installHistoryShortcuts();

		window.dispatchEvent(keydown({ key: 'z', metaKey: true }));

		expect(applied).toHaveLength(0);
	});
});
