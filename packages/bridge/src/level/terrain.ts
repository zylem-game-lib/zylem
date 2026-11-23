import type { BridgePose, BridgeVec3 } from '../protocol';
import type { BrushSurface } from './brush';
import { copySurface, sameSurface } from './brush-surface';

/** A centered XZ grid with unit cells in local space. Rows advance along +Z. */
export interface TerrainPlane {
	id: string;
	pose: BridgePose;
	cells: number;
	/** One local Y per vertex, indexed by z * (cells + 1) + x. */
	heights: number[];
	/** Painted cells, indexed by z * cells + x. Texture and gameplay tag are independent. */
	surfaces?: Record<number, BrushSurface>;
	tags?: Record<number, string>;
}

export const DEFAULT_TERRAIN_CELLS = 16;
export const MAX_TERRAIN_CELLS = 64;
export const DEFAULT_TERRAIN_BRUSH = { radius: 2, strength: 0.75 } as const;

export interface TerrainBrushSettings {
	radius: number;
	strength: number;
	tag: string | null;
	cells: number;
}

export type TerrainBrush =
	| { kind: 'sculpt'; delta: number }
	| { kind: 'texture'; surface: BrushSurface | null }
	| { kind: 'tag'; tag: string | null };

export function createTerrainPlane(
	id: string,
	position: BridgeVec3,
	cells = DEFAULT_TERRAIN_CELLS
): TerrainPlane {
	if (!Number.isInteger(cells) || cells < 1 || cells > MAX_TERRAIN_CELLS)
		throw new RangeError(`Terrain size must be between 1 and ${MAX_TERRAIN_CELLS} cells.`);
	return {
		id,
		pose: { position: { ...position } },
		cells,
		heights: Array((cells + 1) ** 2).fill(0),
	};
}

/** Cell and height on the actual two triangles, including the plane's outer edges. */
export function terrainSample(plane: TerrainPlane, localX: number, localZ: number) {
	const { cells, heights } = plane;
	const x = localX + cells / 2,
		z = localZ + cells / 2;
	if (!(x >= 0 && z >= 0 && x <= cells && z <= cells)) return null;
	const col = Math.min(cells - 1, Math.floor(x)),
		row = Math.min(cells - 1, Math.floor(z));
	const u = x - col,
		v = z - row;
	const a = row * (cells + 1) + col;
	const b = heights[a + 1]!,
		c = heights[a + cells + 1]!;
	const height =
		u + v <= 1
			? heights[a]! * (1 - u - v) + b * u + c * v
			: heights[a + cells + 2]! * (u + v - 1) + b * (1 - v) + c * (1 - u);
	const cell = row * cells + col;
	return { cell, height, tag: plane.tags?.[cell] ?? null };
}

type TerrainPoint = Pick<BridgeVec3, 'x' | 'z'>;

/** Navigation overlay and palette color for a game-defined tag. */
export function terrainTagColor(tag: string): string {
	let hash = 0;
	for (const letter of tag) hash = (Math.imul(hash, 31) + letter.charCodeAt(0)) | 0;
	return `hsl(${(hash >>> 0) % 360}, 66%, 56%)`;
}

/** Sweep the brush between samples. Each vertex receives its strongest dab once per stroke. */
export function sweepTerrainBrush(
	weights: Map<number, number>,
	plane: TerrainPlane,
	brush: TerrainBrush,
	from: TerrainPoint,
	to: TerrainPoint,
	radius: number
): boolean {
	if (!Number.isFinite(radius) || radius <= 0) return false;
	const vertices = brush.kind === 'sculpt';
	const stride = plane.cells + (vertices ? 1 : 0);
	const origin = -plane.cells / 2 + (vertices ? 0 : 0.5);
	const dx = to.x - from.x,
		dz = to.z - from.z;
	const lengthSq = dx * dx + dz * dz;
	const minX = Math.max(0, Math.ceil(Math.min(from.x, to.x) - radius - origin));
	const maxX = Math.min(stride - 1, Math.floor(Math.max(from.x, to.x) + radius - origin));
	const minZ = Math.max(0, Math.ceil(Math.min(from.z, to.z) - radius - origin));
	const maxZ = Math.min(stride - 1, Math.floor(Math.max(from.z, to.z) + radius - origin));
	let changed = false;
	for (let z = minZ; z <= maxZ; z++) {
		for (let x = minX; x <= maxX; x++) {
			const px = origin + x - from.x,
				pz = origin + z - from.z;
			const t = lengthSq ? Math.max(0, Math.min(1, (px * dx + pz * dz) / lengthSq)) : 0;
			const distance = Math.hypot(px - t * dx, pz - t * dz);
			if (distance >= radius) continue;
			const falloff = 1 - distance / radius;
			const weight = vertices ? falloff * falloff * (3 - 2 * falloff) : 1;
			const index = z * stride + x;
			if (weight <= (weights.get(index) ?? 0)) continue;
			weights.set(index, weight);
			changed = true;
		}
	}
	return changed;
}

/** Apply the same stroke to the live preview and the saved document. An unchanged stroke returns its input. */
export function applyTerrainBrush(
	plane: TerrainPlane,
	brush: TerrainBrush,
	weights: Iterable<readonly [number, number]>
): TerrainPlane {
	let result = plane;
	const count = brush.kind === 'sculpt' ? plane.heights.length : plane.cells ** 2;
	for (const [index, weight] of weights) {
		if (!Number.isInteger(index) || index < 0 || index >= count || !(weight > 0 && weight <= 1))
			continue;
		if (brush.kind === 'sculpt') {
			const value = plane.heights[index]! + brush.delta * weight;
			if (!Number.isFinite(value) || value === plane.heights[index]) continue;
			if (result === plane) result = { ...plane, heights: [...plane.heights] };
			result.heights[index] = value;
		} else if (brush.kind === 'tag') {
			const tag = brush.tag?.trim() || null;
			if (tag === (plane.tags?.[index] ?? null)) continue;
			if (result === plane) result = { ...plane, tags: { ...plane.tags } };
			if (tag) result.tags![index] = tag;
			else delete result.tags![index];
		} else {
			if (sameSurface(plane.surfaces?.[index], brush.surface ?? undefined)) continue;
			if (result === plane) result = { ...plane, surfaces: { ...plane.surfaces } };
			if (brush.surface) result.surfaces![index] = copySurface(brush.surface);
			else delete result.surfaces![index];
		}
	}
	if (result !== plane) {
		if (brush.kind === 'tag' && !Object.keys(result.tags!).length) delete result.tags;
		if (brush.kind === 'texture' && !Object.keys(result.surfaces!).length) delete result.surfaces;
	}
	return result;
}
