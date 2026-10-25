/**
 * Authoring types for a click-to-place session.
 *
 * The session is armed on the stage. The representative follows the cursor,
 * and a left click asks `spawnOnClick` for the entity to add. Drag-to-drop is
 * not this session — picking something up is a hover-area click that arms one.
 */

import type { EntityRepresentative } from './entity-representative';
import type { PlacementPointContext } from './pointer-target';

export interface ArmPlacementOptions {
	representative: EntityRepresentative;
	/** Handed to droppable `accepts` and to `spawnOnClick`. Author-defined. */
	payload?: unknown;
	/**
	 * Left click while armed. Return an entity (or a factory / promise the
	 * stage can spawn) to add it. Return `null` or `false` to reject the click.
	 * Called only when the cursor is somewhere a placement is allowed.
	 */
	spawnOnClick?: (ctx: PlacementPointContext) => unknown;
	/** Stay armed after a successful click so the next click places another. */
	repeat?: boolean;
	/** World-unit lattice. Omit to keep the hit point or the area center. */
	snap?: number;
	/**
	 * Where the preview sits while a droppable is under the cursor.
	 * Defaults to the area's own `placeAt`, then `'area'`.
	 */
	placeAt?: 'area' | 'hit';
}

export interface PlacementSession {
	cancel(): void;
	setPayload(payload: unknown): void;
	setRepresentative(representative: EntityRepresentative): void;
}

export type { PlacementPointContext };
