/**
 * Slot the editor palette fills when `@zylem/game-lib/catalog` is loaded.
 *
 * The runtime holds the setter only. The swatch applier stays in the catalog
 * entry, so a game that never imports catalog does not bundle it.
 */

import type { EntityApplySwatchPayload, SceneOperationPayload } from '@zylem/bridge';
import type { SwatchApplyOutcome } from '../bridge/game-bridge';
import type { GameEntity } from '../entities/entity';

export interface SwatchApplierStage {
	resolveEntity(uuid: string): GameEntity<any> | null;
}

export interface InstalledSwatchApplier {
	applySwatches(payload: EntityApplySwatchPayload & { opId: string }): SwatchApplyOutcome;
	applySceneOperation(op: SceneOperationPayload, direction: 'undo' | 'redo'): void;
	dispose(): void;
}

type SwatchApplierFactory = (stage: SwatchApplierStage) => InstalledSwatchApplier;

let factory: SwatchApplierFactory | null = null;

/** Called by the catalog entry. Replacing the factory is idempotent. */
export function installSwatchApplier(next: SwatchApplierFactory): void {
	factory = next;
}

export function createSwatchApplier(stage: SwatchApplierStage): InstalledSwatchApplier | null {
	return factory ? factory(stage) : null;
}

/** Reported when no catalog entry has installed an applier. */
export function emptySwatchApplyOutcome(
	payload: Pick<EntityApplySwatchPayload, 'uuids' | 'swatches'>,
): SwatchApplyOutcome {
	return {
		results: payload.uuids.flatMap((uuid) =>
			payload.swatches.map((swatch) => ({
				uuid,
				kind: swatch.kind,
				source: swatch.source,
				ok: false,
				reason: 'entity-not-found' as const,
			})),
		),
		entries: [],
	};
}
