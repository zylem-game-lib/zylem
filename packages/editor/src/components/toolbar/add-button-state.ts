/**
 * The Add tool's decisions, kept out of the component so they can be tested
 * without a DOM. The component is left as the part that renders and fires the
 * bridge calls.
 */

import type { PickerItem } from '@zylem/ui/components';
import type { EntityTypeDescriptor } from '@zylem/bridge';

import type { DebugTools } from '../entities/entities-state';

/**
 * Whether the Add tool will place something on the next click in the viewport.
 *
 * Both halves matter: the tool can be selected with nothing chosen yet, and a
 * type stays chosen after the tool is switched away so re-arming does not mean
 * re-picking.
 */
export function isAddArmed(tool: DebugTools, armedTypeId: string | null): boolean {
	return tool === 'add' && armedTypeId !== null;
}

/**
 * What pressing the Add button places.
 *
 * Three fallbacks deep, because each one is a state the button can be in and
 * none of them may leave the press with nothing to do: the armed type while
 * placing, the last type chosen once disarmed (so re-arming is not re-picking),
 * and the catalog's first entry on a fresh editor that has never picked at all.
 * Only an empty catalog returns null, and the button is disabled for that.
 *
 * Pure over its arguments rather than reading the store, so the component can
 * pass its reactive view in and keep its dependency tracking.
 */
export function resolvePlacementTarget(
	entities: EntityTypeDescriptor[],
	armedTypeId: string | null,
	lastTypeId: string | null,
): EntityTypeDescriptor | null {
	const byId = (id: string | null) =>
		id ? entities.find((entity) => entity.id === id) ?? null : null;

	return byId(armedTypeId) ?? byId(lastTypeId) ?? entities[0] ?? null;
}

/**
 * Catalog descriptors as picker items.
 *
 * `tags` and `group` are carried across rather than dropped, because they are
 * what makes the palette's search and headings work — a type findable by synonym
 * game-side should stay findable here.
 */
export function toPickerItems(entities: EntityTypeDescriptor[]): PickerItem[] {
	return entities.map((entity) => ({
		id: entity.id,
		label: entity.label,
		group: entity.group,
		// Inline SVG markup from the game's registry rather than an icon-set name,
		// because the editor and its hosts do not share an icon library. The source
		// is the running game in the same realm, so this is not a new trust
		// boundary.
		icon: entity.icon,
		description: entity.description,
		tags: entity.tags,
	}));
}
