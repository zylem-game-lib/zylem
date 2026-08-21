import { describe, expect, it } from 'vitest';
import type { EntityTypeDescriptor } from '@zylem/bridge';

import {
	isAddArmed,
	resolvePlacementTarget,
	toPickerItems,
} from '../../src/components/toolbar/add-button-state';

describe('isAddArmed', () => {
	it('is armed only with the add tool and a chosen type', () => {
		expect(isAddArmed('add', 'box')).toBe(true);
	});

	it('is not armed while the add tool has nothing chosen', () => {
		// The tool can be selected before a type is picked, and clicking the
		// viewport then has to place nothing.
		expect(isAddArmed('add', null)).toBe(false);
	});

	it('is not armed once another tool takes over', () => {
		// The chosen type survives the switch so re-arming does not mean
		// re-picking, which is exactly why the tool has to be checked too.
		expect(isAddArmed('select', 'box')).toBe(false);
		expect(isAddArmed('none', 'box')).toBe(false);
	});
});

describe('resolvePlacementTarget', () => {
	const catalog: EntityTypeDescriptor[] = [
		{ id: 'box', label: 'Box' },
		{ id: 'sphere', label: 'Sphere' },
	];

	it('places the armed type while the tool is armed', () => {
		expect(resolvePlacementTarget(catalog, 'sphere', 'box')?.id).toBe('sphere');
	});

	it('falls back to the last type chosen once disarmed', () => {
		// Escape clears the armed type but not the last one, so re-arming has to
		// come back to what was being placed rather than to the top of the list.
		expect(resolvePlacementTarget(catalog, null, 'sphere')?.id).toBe('sphere');
	});

	it('falls back to the first catalog entry on a fresh editor', () => {
		// The press that has never picked anything is the one that used to open
		// the menu instead of arming.
		expect(resolvePlacementTarget(catalog, null, null)?.id).toBe('box');
	});

	it('ignores ids the catalog no longer contains', () => {
		expect(resolvePlacementTarget(catalog, 'gone', 'also-gone')?.id).toBe('box');
	});

	it('has no answer for an empty catalog', () => {
		// The only state where pressing Add cannot arm, which is why the button
		// is disabled for it rather than left looking pressable.
		expect(resolvePlacementTarget([], 'box', 'box')).toBeNull();
	});
});

describe('toPickerItems', () => {
	const entities: EntityTypeDescriptor[] = [
		{
			id: 'box',
			label: 'Box',
			group: 'Primitives',
			icon: '<svg />',
			description: 'A cube',
			tags: ['cube'],
		},
		{ id: 'bare', label: 'Bare' },
	];

	it('carries the fields the palette searches and groups by', () => {
		const [box] = toPickerItems(entities);

		expect(box).toEqual({
			id: 'box',
			label: 'Box',
			group: 'Primitives',
			icon: '<svg />',
			description: 'A cube',
			tags: ['cube'],
		});
	});

	it('leaves a descriptor with no optional fields alone', () => {
		const [, bare] = toPickerItems(entities);

		expect(bare!.id).toBe('bare');
		expect(bare!.group).toBeUndefined();
		expect(bare!.tags).toBeUndefined();
	});

	it('preserves catalog order, which decides the palette order', () => {
		expect(toPickerItems(entities).map((item) => item.id)).toEqual(['box', 'bare']);
	});

	it('maps an empty catalog to an empty list', () => {
		expect(toPickerItems([])).toEqual([]);
	});
});
