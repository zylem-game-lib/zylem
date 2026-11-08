/**
 * Sectors in the edit preview: which solids a hidden sector leaves out, the
 * color a solid takes from its sector, and the sector grid on the ground.
 */

import {
	BufferGeometry,
	CanvasTexture,
	Float32BufferAttribute,
	Group,
	LineBasicMaterial,
	LineSegments,
	SRGBColorSpace,
	Sprite,
	SpriteMaterial,
	type Object3D,
} from 'three';
import {
	sectorBounds,
	sectorKey,
	sectorOf,
	sectorSizeOf,
	sectorTint,
	type BrushPlane,
	type LevelSyncPayload,
	type SectorCoord,
} from '@zylem/bridge';

export const SECTOR_OVERLAY_NAME = 'level-sector-overlay';

const LINE_COLOR = 0x6c8cff;
const LINE_OPACITY = 0.55;
/** Just above the construction grid, which also lies on y=0. */
const LINE_HEIGHT = 0.01;
/** Empty sectors drawn past the occupied ones. */
const MARGIN = 1;
/** Wider than this many sectors on either axis, only occupied sectors are outlined. */
const MAX_GRID_SPAN = 128;
/** More sectors than this in range, and only occupied ones are labelled. */
const MAX_LABELS = 256;
const LABEL_OPACITY = 0.9;
const HIDDEN_LABEL_OPACITY = 0.35;
/** Label size as a fraction of the sector size. */
const LABEL_WIDTH = 0.25;
const LABEL_INSET = 0.04;

interface SectorRange {
	minX: number;
	maxX: number;
	minZ: number;
	maxZ: number;
}

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

function occupiedSectors(payload: LevelSyncPayload, size: number): Map<string, SectorCoord> {
	const occupied = new Map<string, SectorCoord>();
	for (const solid of payload.document.solids) {
		const sector = sectorOf(solid.planes, size);
		if (sector) occupied.set(sectorKey(sector), sector);
	}
	return occupied;
}

/** An empty level still shows the sectors around the origin. */
function rangeOf(sectors: Iterable<SectorCoord>): SectorRange {
	const range = { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };
	let first = true;
	for (const sector of sectors) {
		if (first) {
			range.minX = range.maxX = sector.x;
			range.minZ = range.maxZ = sector.z;
			first = false;
			continue;
		}
		range.minX = Math.min(range.minX, sector.x);
		range.maxX = Math.max(range.maxX, sector.x);
		range.minZ = Math.min(range.minZ, sector.z);
		range.maxZ = Math.max(range.maxZ, sector.z);
	}
	return {
		minX: range.minX - MARGIN,
		maxX: range.maxX + MARGIN,
		minZ: range.minZ - MARGIN,
		maxZ: range.maxZ + MARGIN,
	};
}

function gridSegments(range: SectorRange, size: number): number[] {
	const points: number[] = [];
	const x0 = range.minX * size;
	const x1 = (range.maxX + 1) * size;
	const z0 = range.minZ * size;
	const z1 = (range.maxZ + 1) * size;
	for (let x = range.minX; x <= range.maxX + 1; x += 1) {
		points.push(x * size, LINE_HEIGHT, z0, x * size, LINE_HEIGHT, z1);
	}
	for (let z = range.minZ; z <= range.maxZ + 1; z += 1) {
		points.push(x0, LINE_HEIGHT, z * size, x1, LINE_HEIGHT, z * size);
	}
	return points;
}

function outlineSegments(sectors: Iterable<SectorCoord>, size: number): number[] {
	const points: number[] = [];
	for (const sector of sectors) {
		const { min, max } = sectorBounds(sector, size);
		const y = LINE_HEIGHT;
		points.push(min.x, y, min.z, max.x, y, min.z);
		points.push(max.x, y, min.z, max.x, y, max.z);
		points.push(max.x, y, max.z, min.x, y, max.z);
		points.push(min.x, y, max.z, min.x, y, min.z);
	}
	return points;
}

function sectorLines(points: number[]): LineSegments {
	const geometry = new BufferGeometry();
	geometry.setAttribute('position', new Float32BufferAttribute(points, 3));
	const lines = new LineSegments(
		geometry,
		new LineBasicMaterial({
			color: LINE_COLOR,
			transparent: true,
			opacity: LINE_OPACITY,
			depthWrite: false,
		}),
	);
	lines.frustumCulled = false;
	return lines;
}

/** Shared across rebuilds, so a sync never leaks label textures. */
const labelTextures = new Map<string, CanvasTexture | null>();

function labelTexture(text: string): CanvasTexture | null {
	if (labelTextures.has(text)) return labelTextures.get(text) ?? null;
	const canvas = typeof document === 'undefined' ? null : document.createElement('canvas');
	const context = canvas?.getContext('2d') ?? null;
	let texture: CanvasTexture | null = null;
	if (canvas && context) {
		canvas.width = 256;
		canvas.height = 64;
		context.font = '600 40px system-ui, sans-serif';
		context.textAlign = 'left';
		context.textBaseline = 'middle';
		context.fillStyle = '#c5d2ff';
		context.fillText(text, 8, 32);
		texture = new CanvasTexture(canvas);
		texture.colorSpace = SRGBColorSpace;
	}
	labelTextures.set(text, texture);
	return texture;
}

/** The sector's key in its min-x, min-z corner, readable over the solids. */
function sectorLabel(sector: SectorCoord, size: number, hidden: boolean): Sprite | null {
	const key = sectorKey(sector);
	const texture = labelTexture(key);
	if (!texture) return null;
	const label = new Sprite(
		new SpriteMaterial({
			map: texture,
			transparent: true,
			opacity: hidden ? HIDDEN_LABEL_OPACITY : LABEL_OPACITY,
			depthTest: false,
			depthWrite: false,
		}),
	);
	const width = size * LABEL_WIDTH;
	const { min } = sectorBounds(sector, size);
	label.name = `sector-label:${key}`;
	label.scale.set(width, width / 4, 1);
	label.position.set(
		min.x + size * LABEL_INSET + width / 2,
		LINE_HEIGHT,
		min.z + size * LABEL_INSET + width / 8,
	);
	label.renderOrder = 5;
	return label;
}

function* sectorsIn(range: SectorRange): Generator<SectorCoord> {
	for (let x = range.minX; x <= range.maxX; x += 1) {
		for (let z = range.minZ; z <= range.maxZ; z += 1) yield { x, z };
	}
}

export function buildSectorOverlay(payload: LevelSyncPayload): Object3D | null {
	const size = sectorSizeOf(payload.document);
	const occupied = occupiedSectors(payload, size);
	const range = rangeOf(occupied.values());
	const spanX = range.maxX - range.minX + 1;
	const spanZ = range.maxZ - range.minZ + 1;
	const wide = spanX > MAX_GRID_SPAN || spanZ > MAX_GRID_SPAN;

	const overlay = new Group();
	overlay.name = SECTOR_OVERLAY_NAME;
	overlay.add(
		sectorLines(wide ? outlineSegments(occupied.values(), size) : gridSegments(range, size)),
	);

	const hidden = new Set(payload.hiddenSectors ?? []);
	const labelled = spanX * spanZ > MAX_LABELS ? occupied.values() : sectorsIn(range);
	for (const sector of labelled) {
		const label = sectorLabel(sector, size, hidden.has(sectorKey(sector)));
		if (label) overlay.add(label);
	}
	return overlay;
}
