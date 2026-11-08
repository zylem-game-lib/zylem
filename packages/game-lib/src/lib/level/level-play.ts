/**
 * The level as it plays: solids grouped by the sector holding their centers,
 * each sector one merged mesh and one set of convex hulls for a static body.
 */

import type { BufferGeometry } from 'three';
import {
	compileBrush,
	sectorKey,
	sectorOf,
	type BrushSolid,
	type CompiledBrush,
} from '@zylem/bridge';
import { hullVertices } from './level-collision';
import { mergedBrushGeometry } from './level-geometry';

export interface PlaySector {
	/** `x:z`, as `sectorKey` writes it. */
	key: string;
	geometry: BufferGeometry;
	hulls: Float32Array[];
}

/** Solids that do not compile are left out, as they are in the edit preview. */
export function buildPlaySectors(solids: readonly BrushSolid[], size: number): PlaySector[] {
	const groups = new Map<string, CompiledBrush[]>();
	for (const solid of solids) {
		const compiled = compileBrush(solid.planes);
		const sector = compiled ? sectorOf(solid.planes, size) : null;
		if (!compiled || !sector) continue;
		const key = sectorKey(sector);
		const group = groups.get(key);
		if (group) group.push(compiled);
		else groups.set(key, [compiled]);
	}
	return [...groups].map(([key, brushes]) => ({
		key,
		geometry: mergedBrushGeometry(brushes),
		hulls: brushes.map(hullVertices),
	}));
}
