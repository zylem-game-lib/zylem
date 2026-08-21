/**
 * The placeable entity types the game offers, and which one the Add tool is
 * armed with.
 *
 * The list is game-owned: it arrives over the bridge as `catalog:snapshot`, so
 * a host that registers its own entity types game-side gets them in the palette
 * with no editor change. Icons come through as inline SVG markup because the
 * editor and its hosts do not share an icon library.
 */

import { proxy } from 'valtio/vanilla';
import type { EntityTypeDescriptor } from '@zylem/bridge';

import { mirrorProxy } from '../common/proxy-mirror';

export interface CatalogState {
	entities: EntityTypeDescriptor[];
	/** Type the Add tool will place, or null when disarmed. */
	armedTypeId: string | null;
	/**
	 * Last type chosen from the palette, so re-arming the tool does not make the
	 * user re-pick. Survives disarming; cleared only when the catalog no longer
	 * contains it.
	 */
	lastTypeId: string | null;
}

export const catalogState = proxy<CatalogState>({
	entities: [],
	armedTypeId: null,
	lastTypeId: null,
});

/** Solid-reactive view of {@link catalogState}, for components. */
export const catalogStore = mirrorProxy(catalogState);

export function setEntityCatalog(entities: EntityTypeDescriptor[]): void {
	catalogState.entities = entities;

	// A type that vanished from the catalog cannot be placed any more.
	const ids = new Set(entities.map((entity) => entity.id));
	if (catalogState.armedTypeId && !ids.has(catalogState.armedTypeId)) {
		catalogState.armedTypeId = null;
	}
	if (catalogState.lastTypeId && !ids.has(catalogState.lastTypeId)) {
		catalogState.lastTypeId = null;
	}
}

export function getEntityDescriptor(id: string | null): EntityTypeDescriptor | null {
	if (!id) return null;
	return catalogState.entities.find((entity) => entity.id === id) ?? null;
}

export function setArmedType(typeId: string | null): void {
	catalogState.armedTypeId = typeId;
	if (typeId) catalogState.lastTypeId = typeId;
}

/** The descriptor shown on the Add button: armed type, else the last chosen. */
export function buttonDescriptor(): EntityTypeDescriptor | null {
	return (
		getEntityDescriptor(catalogState.armedTypeId)
		?? getEntityDescriptor(catalogState.lastTypeId)
	);
}

// Searching and grouping the catalog now happen in @zylem/ui's ItemPicker
// (`filterItems` / `groupItems`), which the Add palette is built on. An
// `EntityTypeDescriptor` is already shaped like a `PickerItem`, so nothing
// catalog-specific was needed to make the move.
