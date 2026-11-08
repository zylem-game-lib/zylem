import { describe, expect, it } from 'vitest';

import { boxBrush } from '../src/level/brush';
import {
	DEFAULT_SECTOR_SIZE,
	parseSectorKey,
	sectorAt,
	sectorBounds,
	sectorKey,
	sectorOf,
	sectorSizeOf,
	sectorTint,
} from '../src/level/sectors';

describe('sectors', () => {
	it('falls back to the default size when the document has none', () => {
		expect(sectorSizeOf({})).toBe(DEFAULT_SECTOR_SIZE);
		expect(sectorSizeOf({ sectors: { size: 0 } })).toBe(DEFAULT_SECTOR_SIZE);
		expect(sectorSizeOf({ sectors: { size: 16 } })).toBe(16);
	});

	it('floors coordinates so negative space has its own sectors', () => {
		expect(sectorAt({ x: 0, z: 0 }, 32)).toEqual({ x: 0, z: 0 });
		expect(sectorAt({ x: 31.9, z: 32 }, 32)).toEqual({ x: 0, z: 1 });
		expect(sectorAt({ x: -0.1, z: -32 }, 32)).toEqual({ x: -1, z: -1 });
		expect(sectorAt({ x: -0, z: 31.9999999999 }, 32)).toEqual({ x: 0, z: 1 });
	});

	it('round-trips keys', () => {
		expect(sectorKey({ x: -2, z: 3 })).toBe('-2:3');
		expect(parseSectorKey('-2:3')).toEqual({ x: -2, z: 3 });
		expect(parseSectorKey('nope')).toBeNull();
	});

	it('assigns a brush by its center, even when it crosses a boundary', () => {
		const straddling = boxBrush({ x: 30, y: 0, z: 0 }, { x: 40, y: 1, z: 2 });
		expect(sectorOf(straddling, 32)).toEqual({ x: 1, z: 0 });
		const inside = boxBrush({ x: -10, y: 0, z: -10 }, { x: -2, y: 1, z: -2 });
		expect(sectorOf(inside, 32)).toEqual({ x: -1, z: -1 });
		expect(sectorOf([], 32)).toBeNull();
	});

	it('bounds a sector on the grid', () => {
		expect(sectorBounds({ x: -1, z: 2 }, 16)).toEqual({
			min: { x: -16, z: 32 },
			max: { x: 0, z: 48 },
		});
	});

	it('tints neighbours differently', () => {
		const center = sectorTint({ x: 0, z: 0 });
		expect(center).toMatch(/^#[0-9a-f]{6}$/);
		for (const [x, z] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
			[1, 1],
			[-1, -1],
			[1, -1],
			[-1, 1],
		] as const) {
			expect(sectorTint({ x, z })).not.toBe(center);
		}
		expect(sectorTint({ x: 3, z: -3 })).toBe(center);
	});
});
