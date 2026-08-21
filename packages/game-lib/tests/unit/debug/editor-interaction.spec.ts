/**
 * The predicate that decides whether the editor's pointer tools run at all.
 *
 * Worth its own spec because it is the whole fix for tools that did nothing:
 * both the stage's `debugUpdate` gate and the delegate's listener attachment
 * read it, so an armed tool being "active" is asserted in one place.
 */

import { afterEach, describe, expect, it } from 'vitest';

import {
	debugState,
	isEditorInteractionActive,
	setDebugTool,
} from '../../../src/lib/debug/debug-state';

afterEach(() => {
	setDebugTool('none');
	debugState.enabled = false;
});

describe('isEditorInteractionActive', () => {
	it('is inactive with debug off and no tool armed', () => {
		// Plain gameplay: nothing to drive, and the delegate should cost nothing.
		expect(isEditorInteractionActive()).toBe(false);
	});

	it('is active for debug mode on its own', () => {
		debugState.enabled = true;

		expect(isEditorInteractionActive()).toBe(true);
	});

	it('is active for an armed tool with debug off', () => {
		// The regression this exists for: Add armed, Debug off, and the delegate
		// never ticked — so no ghost was drawn and clicks placed nothing.
		setDebugTool('add');

		expect(isEditorInteractionActive()).toBe(true);
	});

	it.each(['select', 'delete', 'translate', 'rotate', 'scale'] as const)(
		'is active for the %s tool with debug off',
		(tool) => {
			// Add was the reported case, but every tool the toolbar can arm was
			// inert for the same reason.
			setDebugTool(tool);

			expect(isEditorInteractionActive()).toBe(true);
		},
	);
});
