// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getZylemBridge } from '@zylem/bridge';

import {
	disarmTools,
	installToolShortcuts,
} from '../../src/components/toolbar/tool-shortcuts';
import {
	catalogState,
	setArmedType,
	setEntityCatalog,
} from '../../src/components/toolbar/catalog-state';
import {
	getDebugTool,
	setDebugTool,
} from '../../src/components/entities/entities-state';

function escape(): KeyboardEvent {
	return new KeyboardEvent('keydown', {
		key: 'Escape',
		bubbles: true,
		cancelable: true,
	});
}

let toolMessages: string[];
let addTypeMessages: Array<string | null>;
let stopCapture: Array<() => void> = [];
let uninstall: (() => void) | null = null;

beforeEach(() => {
	const { channel } = getZylemBridge();
	channel.reset();
	setEntityCatalog([{ id: 'box', label: 'Box' }]);
	setArmedType(null);
	catalogState.lastTypeId = null;
	setDebugTool('none');

	toolMessages = [];
	addTypeMessages = [];
	stopCapture = [
		channel.on('tool:set', ({ tool }) => toolMessages.push(tool)),
		channel.on('add:type:set', ({ typeId }) => addTypeMessages.push(typeId)),
	];
});

afterEach(() => {
	uninstall?.();
	uninstall = null;
	for (const stop of stopCapture) stop();
	stopCapture = [];
	document.body.innerHTML = '';
});

describe('disarmTools', () => {
	it('clears the armed type and tells the game', () => {
		setDebugTool('add');
		setArmedType('box');

		expect(disarmTools()).toBe(true);
		expect(catalogState.armedTypeId).toBeNull();
		expect(getDebugTool()).toBe('none');
		expect(addTypeMessages).toEqual([null]);
		expect(toolMessages).toEqual(['none']);
	});

	it('leaves the remembered type intact', () => {
		setDebugTool('add');
		setArmedType('box');

		disarmTools();

		// Re-arming the tool should not make the user re-pick from the palette.
		expect(catalogState.lastTypeId).toBe('box');
	});

	it('returns to the neutral tool from a transform mode', () => {
		setDebugTool('rotate');

		expect(disarmTools()).toBe(true);
		expect(getDebugTool()).toBe('none');
		// No type was armed, so there is nothing to tell the add tool.
		expect(addTypeMessages).toEqual([]);
	});

	it('reports false when there is nothing to disarm', () => {
		expect(disarmTools()).toBe(false);
		expect(toolMessages).toEqual([]);
	});
});

describe('installToolShortcuts', () => {
	it('disarms on Escape', () => {
		uninstall = installToolShortcuts();
		setDebugTool('add');
		setArmedType('box');

		window.dispatchEvent(escape());

		expect(getDebugTool()).toBe('none');
		expect(catalogState.armedTypeId).toBeNull();
	});

	it('claims Escape only when a tool was active', () => {
		uninstall = installToolShortcuts();

		const idle = escape();
		window.dispatchEvent(idle);
		// Escape still has to close popovers and dialogs the rest of the time.
		expect(idle.defaultPrevented).toBe(false);

		setDebugTool('add');
		const active = escape();
		window.dispatchEvent(active);
		expect(active.defaultPrevented).toBe(true);
	});

	it('leaves Escape to a focused text field', () => {
		uninstall = installToolShortcuts();
		setDebugTool('add');

		const input = document.createElement('input');
		document.body.append(input);
		input.dispatchEvent(escape());

		expect(getDebugTool()).toBe('add');
	});

	it('ignores other keys', () => {
		uninstall = installToolShortcuts();
		setDebugTool('add');

		window.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
		);

		expect(getDebugTool()).toBe('add');
	});

	it('installs nothing when disabled', () => {
		uninstall = installToolShortcuts({ enabled: false });
		setDebugTool('add');

		window.dispatchEvent(escape());

		expect(getDebugTool()).toBe('add');
	});

	it('stops listening once uninstalled', () => {
		const stop = installToolShortcuts();
		setDebugTool('add');
		stop();

		window.dispatchEvent(escape());

		expect(getDebugTool()).toBe('add');
	});
});
