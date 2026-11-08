import { Box3, LineSegments, Sprite, SpriteMaterial, type Object3D } from 'three';
import { describe, expect, it } from 'vitest';
import {
	boxBrush,
	sectorTint,
	type BrushPlane,
	type LevelSyncPayload,
} from '@zylem/bridge';
import {
	SECTOR_OVERLAY_NAME,
	buildSectorOverlay,
	solidSectorHidden,
	solidSectorTint,
} from '../../../src/lib/level/level-sectors';

/** Center (2, 1, 2): sector 0:0 at size 32. */
const NEAR = boxBrush({ x: 1, y: 0, z: 1 }, { x: 3, y: 2, z: 3 });
/** Center (41, 1, -9): sector 1:-1 at size 32, 0:-1 at size 64. */
const FAR = boxBrush({ x: 40, y: 0, z: -10 }, { x: 42, y: 2, z: -8 });

function payload(
	patch: Partial<LevelSyncPayload> = {},
	solids: BrushPlane[][] = [NEAR, FAR],
	size?: number,
): LevelSyncPayload {
	return {
		document: {
			version: 2,
			solids: solids.map((planes, index) => ({ id: `s${index}`, planes })),
			doodads: [],
			entities: [],
			...(size ? { sectors: { size } } : {}),
		},
		hiddenLayers: [],
		selectedIds: [],
		activeLayer: 'solid',
		placement: null,
		...patch,
	};
}

function overlayOf(value: LevelSyncPayload): Object3D {
	const overlay = buildSectorOverlay(value);
	if (!overlay) throw new Error('expected a sector overlay');
	return overlay;
}

function linesOf(overlay: Object3D): LineSegments[] {
	return overlay.children.filter((child): child is LineSegments => child instanceof LineSegments);
}

function labelsOf(overlay: Object3D): Sprite[] {
	return overlay.children.filter((child): child is Sprite => child instanceof Sprite);
}

function lineExtent(overlay: Object3D): Box3 {
	const [lines] = linesOf(overlay);
	if (!lines) throw new Error('expected sector lines');
	lines.geometry.computeBoundingBox();
	return lines.geometry.boundingBox!;
}

describe('sector visibility and tint', () => {
	it('hides a solid whose center is in a hidden sector', () => {
		const hidden = payload({ hiddenSectors: ['1:-1'] });
		expect(solidSectorHidden(NEAR, hidden)).toBe(false);
		expect(solidSectorHidden(FAR, hidden)).toBe(true);
		expect(solidSectorHidden(FAR, payload())).toBe(false);
	});

	it('reads the sector size from the document', () => {
		const hidden = payload({ hiddenSectors: ['0:-1'] }, [NEAR, FAR], 64);
		expect(solidSectorHidden(FAR, hidden)).toBe(true);
		expect(solidSectorHidden(NEAR, hidden)).toBe(false);
	});

	it('tints by sector only while tinting is on', () => {
		expect(solidSectorTint(FAR, payload())).toBeNull();
		expect(solidSectorTint(FAR, payload({ showSectorTint: true }))).toBe(
			sectorTint({ x: 1, z: -1 }),
		);
	});
});

describe('sector overlay', () => {
	it('grids the occupied sectors and one sector beyond them', () => {
		const overlay = overlayOf(payload());
		expect(overlay.name).toBe(SECTOR_OVERLAY_NAME);
		const lines = linesOf(overlay);
		expect(lines).toHaveLength(1);
		// Sectors x -1..2 and z -2..1: five boundaries on each axis.
		expect(lines[0]!.geometry.getAttribute('position').count).toBe(20);
		const extent = lineExtent(overlay);
		expect(extent.min.x).toBe(-32);
		expect(extent.max.x).toBe(96);
		expect(extent.min.z).toBe(-64);
		expect(extent.max.z).toBe(64);
	});

	it('follows the document sector size', () => {
		// Both solids land in x 0 and z -1..0, so the grid spans x -1..1 and z -2..1.
		const extent = lineExtent(overlayOf(payload({}, [NEAR, FAR], 64)));
		expect(extent.min.x).toBe(-64);
		expect(extent.max.x).toBe(128);
		expect(extent.min.z).toBe(-128);
		expect(extent.max.z).toBe(128);
	});

	it('shows the sectors around the origin for an empty level', () => {
		const overlay = overlayOf(payload({}, []));
		expect(linesOf(overlay)[0]!.geometry.getAttribute('position').count).toBe(16);
		expect(labelsOf(overlay)).toHaveLength(9);
	});

	it('labels every sector in range and dims hidden ones', () => {
		const overlay = overlayOf(payload({ hiddenSectors: ['1:-1'] }));
		const labels = labelsOf(overlay);
		expect(labels).toHaveLength(16);
		const opacity = (key: string) => {
			const label = labels.find((entry) => entry.name === `sector-label:${key}`);
			if (!label) throw new Error(`no label for ${key}`);
			return (label.material as SpriteMaterial).opacity;
		};
		expect(opacity('1:-1')).toBeLessThan(opacity('0:0'));
	});

	it('outlines only occupied sectors across a very wide level', () => {
		const distant = boxBrush({ x: 6400, y: 0, z: 6400 }, { x: 6402, y: 2, z: 6402 });
		const overlay = overlayOf(payload({}, [NEAR, distant]));
		// Four edges for each of the two sectors.
		expect(linesOf(overlay)[0]!.geometry.getAttribute('position').count).toBe(16);
		expect(labelsOf(overlay).map((label) => label.name).sort()).toEqual([
			'sector-label:0:0',
			'sector-label:200:200',
		]);
	});
});
