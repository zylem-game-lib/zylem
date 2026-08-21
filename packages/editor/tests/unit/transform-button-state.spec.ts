import { describe, expect, it } from 'vitest';

import { resolveTransformTarget } from '../../src/components/toolbar/transform-button-state';

const SCENE = ['box-1', 'sphere-1'];

describe('resolveTransformTarget', () => {
	it('acts on the current selection', () => {
		expect(resolveTransformTarget(['sphere-1'], 'box-1', SCENE)).toBe('sphere-1');
	});

	it('falls back to the last entity worked on', () => {
		// The point of the feature: place a box, press Rotate, turn the box —
		// without having to click it first.
		expect(resolveTransformTarget([], 'box-1', SCENE)).toBe('box-1');
	});

	it('ignores a remembered entity that no longer exists', () => {
		// Deleting it, or undoing the create that made it, leaves the memory
		// pointing at nothing. Arming on that would pause the game and show no
		// gizmo to explain why.
		expect(resolveTransformTarget([], 'deleted-1', SCENE)).toBeNull();
	});

	it('has no target with nothing selected and nothing remembered', () => {
		expect(resolveTransformTarget([], null, SCENE)).toBeNull();
	});

	it('has no target in an empty scene', () => {
		expect(resolveTransformTarget([], 'box-1', [])).toBeNull();
	});

	it('prefers the selection even when it is not the remembered entity', () => {
		// Selection is the stronger signal; the memory only covers its absence.
		expect(resolveTransformTarget(['box-1'], 'sphere-1', SCENE)).toBe('box-1');
	});

	it('takes the first of a multi-entity selection', () => {
		// Matches the gizmo, which pivots on the selection as a whole but reports
		// the first entry as primary.
		expect(resolveTransformTarget(['sphere-1', 'box-1'], null, SCENE)).toBe('sphere-1');
	});
});
