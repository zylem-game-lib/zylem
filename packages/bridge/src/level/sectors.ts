/**
 * Level sectors: a fixed grid of square cells on the XZ plane.
 *
 * A brush belongs to the sector holding its center, so a brush that crosses a
 * boundary still loads with exactly one sector. Keys are `x:z` cell indices.
 */

import { brushCenter, type BrushPlane } from './brush';

export const DEFAULT_SECTOR_SIZE = 32;

export interface SectorCoord {
	x: number;
	z: number;
}

export interface SectorBounds {
	min: { x: number; z: number };
	max: { x: number; z: number };
}

/** The document's sector size, or the default when it has none or a bad one. */
export function sectorSizeOf(document: { sectors?: { size?: number } }): number {
	const size = document.sectors?.size;
	return typeof size === 'number' && Number.isFinite(size) && size > 0 ? size : DEFAULT_SECTOR_SIZE;
}

/** The cell holding a point. Floors, so negative space has its own cells. */
export function sectorAt(point: { x: number; z: number }, size: number): SectorCoord {
	// The nudge keeps a center computed as 31.999999 on a 32 boundary in the upper cell.
	return {
		x: Math.floor(point.x / size + 1e-9) || 0,
		z: Math.floor(point.z / size + 1e-9) || 0,
	};
}

/** The cell holding the brush's center, or `null` when it does not compile. */
export function sectorOf(planes: readonly BrushPlane[], size: number): SectorCoord | null {
	const center = brushCenter(planes);
	return center ? sectorAt(center, size) : null;
}

export function sectorKey(coord: SectorCoord): string {
	return `${coord.x}:${coord.z}`;
}

export function parseSectorKey(key: string): SectorCoord | null {
	const match = /^(-?\d+):(-?\d+)$/.exec(key);
	if (!match) return null;
	return { x: Number(match[1]) || 0, z: Number(match[2]) || 0 };
}

export function sectorBounds(coord: SectorCoord, size: number): SectorBounds {
	return {
		min: { x: coord.x * size, z: coord.z * size },
		max: { x: (coord.x + 1) * size, z: (coord.z + 1) * size },
	};
}

function hslHex(hue: number, saturation: number, lightness: number): string {
	const a = saturation * Math.min(lightness, 1 - lightness);
	const channel = (n: number) => {
		const k = (n + hue / 30) % 12;
		const value = lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
		return Math.round(value * 255)
			.toString(16)
			.padStart(2, '0');
	};
	return `#${channel(0)}${channel(8)}${channel(4)}`;
}

/**
 * A `#rrggbb` tint for a sector. Cells repeat every three steps on each axis,
 * so no two neighbours, diagonals included, share a color.
 */
export function sectorTint(coord: SectorCoord): string {
	const column = ((coord.x % 3) + 3) % 3;
	const row = ((coord.z % 3) + 3) % 3;
	return hslHex((column * 120 + row * 40) % 360, 0.55, (column + row) % 2 === 0 ? 0.55 : 0.45);
}
