/**
 * The gizmo tools' decisions, kept out of the components so they can be tested
 * without a DOM — the same split as `add-button-state.ts`.
 */

/**
 * The entity a gizmo tool should act on.
 *
 * The current selection when there is one. Otherwise the last entity worked on,
 * which is what lets you place a box and press Rotate without clicking the box
 * first. That fallback is checked against the entities that actually exist,
 * because the remembered uuid outlives the entity: deleting it, or undoing the
 * create that made it, leaves the memory pointing at nothing.
 *
 * `null` means there is nothing to act on at all, and the buttons are disabled —
 * entering a gizmo mode pauses the simulation, so arming one with no target would
 * freeze the game and show no gizmo to explain why.
 */
export function resolveTransformTarget(
	selectedIds: readonly string[],
	lastTouchedId: string | null,
	existingUuids: readonly string[],
): string | null {
	const selected = selectedIds[0];
	if (selected) return selected;

	if (!lastTouchedId) return null;
	return existingUuids.includes(lastTouchedId) ? lastTouchedId : null;
}
