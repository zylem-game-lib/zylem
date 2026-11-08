/**
 * Sectors in the edit preview: which solids a hidden sector leaves out, the
 * color a solid takes from its sector, and the sector grid on the ground.
 */

import type { Object3D } from 'three';
import {
	sectorKey,
	sectorOf,
	sectorSizeOf,
	sectorTint,
	type BrushPlane,
	type LevelSyncPayload,
} from '@zylem/bridge';

export function solidSectorHidden(
	planes: readonly BrushPlane[],
	payload: LevelSyncPayload,
): boolean {
	const hidden = payload.hiddenSectors;
	if (!hidden || hidden.length === 0) return false;
	const sector = sectorOf(planes, sectorSizeOf(payload.document));
	return sector !== null && hidden.includes(sectorKey(sector));
}

/** The solid's sector color while tinting is on, else `null`. */
export function solidSectorTint(
	planes: readonly BrushPlane[],
	payload: LevelSyncPayload,
): string | null {
	if (!payload.showSectorTint) return null;
	const sector = sectorOf(planes, sectorSizeOf(payload.document));
	return sector ? sectorTint(sector) : null;
}

/** Sector lines and labels on the ground, or `null` when there is nothing to draw. */
export function buildSectorOverlay(_payload: LevelSyncPayload): Object3D | null {
	return null;
}
