import { beforeEach, describe, expect, it } from 'vitest';
import type { EntityTypeDescriptor } from '@zylem/bridge';

import {
	buttonDescriptor,
	catalogState,
	getEntityDescriptor,
	setArmedType,
	setEntityCatalog,
} from '../../src/components/toolbar/catalog-state';

function descriptor(
	id: string,
	overrides: Partial<EntityTypeDescriptor> = {},
): EntityTypeDescriptor {
	return {
		id,
		label: id[0]!.toUpperCase() + id.slice(1),
		group: 'Primitives',
		...overrides,
	};
}

beforeEach(() => {
	setEntityCatalog([]);
	catalogState.armedTypeId = null;
	catalogState.lastTypeId = null;
});

describe('setEntityCatalog', () => {
	it('replaces the list wholesale', () => {
		setEntityCatalog([descriptor('box'), descriptor('sphere')]);
		setEntityCatalog([descriptor('sphere')]);

		expect(catalogState.entities.map((entity) => entity.id)).toEqual(['sphere']);
	});

	it('disarms a type that vanished from the catalog', () => {
		setEntityCatalog([descriptor('box')]);
		setArmedType('box');

		// A game that unregistered the type can no longer place it, so leaving
		// the tool armed would fail silently on every click.
		setEntityCatalog([descriptor('sphere')]);

		expect(catalogState.armedTypeId).toBeNull();
	});

	it('forgets a remembered type that vanished', () => {
		setEntityCatalog([descriptor('box')]);
		setArmedType('box');
		setArmedType(null);

		setEntityCatalog([descriptor('sphere')]);

		expect(catalogState.lastTypeId).toBeNull();
	});

	it('keeps the armed type when it survives a re-publish', () => {
		setEntityCatalog([descriptor('box')]);
		setArmedType('box');

		setEntityCatalog([descriptor('box'), descriptor('sphere')]);

		expect(catalogState.armedTypeId).toBe('box');
	});
});

describe('arming', () => {
	it('remembers the last chosen type after disarming', () => {
		setEntityCatalog([descriptor('box')]);
		setArmedType('box');
		setArmedType(null);

		// Re-arming should not make the user re-pick from the palette.
		expect(catalogState.armedTypeId).toBeNull();
		expect(catalogState.lastTypeId).toBe('box');
	});

	it('shows the armed type on the button, else the last chosen', () => {
		setEntityCatalog([descriptor('box'), descriptor('sphere')]);

		expect(buttonDescriptor()).toBeNull();

		setArmedType('box');
		expect(buttonDescriptor()?.id).toBe('box');

		setArmedType(null);
		expect(buttonDescriptor()?.id).toBe('box');

		setArmedType('sphere');
		expect(buttonDescriptor()?.id).toBe('sphere');
	});

	it('resolves descriptors by id', () => {
		setEntityCatalog([descriptor('box')]);

		expect(getEntityDescriptor('box')?.label).toBe('Box');
		expect(getEntityDescriptor('missing')).toBeNull();
		expect(getEntityDescriptor(null)).toBeNull();
	});
});

// Searching and grouping moved to @zylem/ui's ItemPicker, and are covered by
// that package's `filterItems` / `groupItems` tests.
