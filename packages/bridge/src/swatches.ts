/**
 * Consumer-side helpers for the swatch messages.
 *
 * `entity:apply-swatch` is batch-shaped so that a drag-and-drop (one uuid, one
 * swatch) and an editor "apply to selection" button (many uuids, possibly many
 * swatches) are the same message and the same single undo step. This module
 * keeps that contract discoverable from the editor side.
 */

import type { BridgeChannel } from './channel';
import type { SwatchSpec } from './protocol';

/**
 * Apply swatches to the game's current selection, as last published on
 * `entity:selection`.
 *
 * @returns `false` when nothing is selected (no message is sent).
 */
export function applySwatchesToSelection(
	channel: BridgeChannel,
	swatches: SwatchSpec[],
	options: { opId?: string } = {},
): boolean {
	const selection = channel.getState('entity:selection');
	const uuids =
		selection?.selectedUuids ??
		(selection?.selectedUuid ? [selection.selectedUuid] : []);
	if (uuids.length === 0 || swatches.length === 0) return false;

	channel.send('entity:apply-swatch', {
		...(options.opId ? { opId: options.opId } : {}),
		uuids: [...uuids],
		swatches,
	});
	return true;
}
