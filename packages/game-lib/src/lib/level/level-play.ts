/**
 * The level as it plays: solids grouped by the sector holding their centers,
 * each sector one merged mesh, drawn once per texture, and one set of convex
 * hulls for a static body.
 */

import type { BufferGeometry } from 'three';
import {
	compileBrush,
	sectorKey,
	sectorOf,
	type BrushPlane,
	type BrushSolid,
	type CompiledBrush,
} from '@zylem/bridge';
import { hullVertices } from './level-collision';
import { mergedBrushGeometry } from './level-geometry';

export interface PlaySector {
	/** `x:z`, as `sectorKey` writes it. */
	key: string;
	/** One group per texture; `geometryTextures` lists them. */
	geometry: BufferGeometry;
	hulls: Float32Array[];
}

/** Solids that do not compile are left out, as they are in the edit preview. */
export function buildPlaySectors(solids: readonly BrushSolid[], size: number): PlaySector[] {
	const groups = new Map<string, { brushes: CompiledBrush[]; planes: BrushPlane[][] }>();
	for (const solid of solids) {
		const compiled = compileBrush(solid.planes);
		const sector = compiled ? sectorOf(solid.planes, size) : null;
		if (!compiled || !sector) continue;
		const key = sectorKey(sector);
		let group = groups.get(key);
		if (!group) {
			group = { brushes: [], planes: [] };
			groups.set(key, group);
		}
		group.brushes.push(compiled);
		group.planes.push(solid.planes);
	}
	return [...groups].map(([key, { brushes, planes }]) => ({
		key,
		geometry: mergedBrushGeometry(brushes, planes),
		hulls: brushes.map(hullVertices),
	}));
}
