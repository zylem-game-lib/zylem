import { Color, type ColorRepresentation } from 'three';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { normalizeVec3, VEC3_ZERO, type Vec3Input } from '../core/vector';

export interface LineGeometryBuildOptions {
	points: Vec3Input[];
	colors?: Array<ColorRepresentation | undefined>;
}

/** Flatten world-space points to the `[x,y,z,...]` layout expected by `LineGeometry`. */
export function toFlatPositions(points: Vec3Input[]): number[] {
	const flat: number[] = [];
	for (const point of points) {
		const { x, y, z } = normalizeVec3(point, VEC3_ZERO);
		flat.push(x, y, z);
	}
	return flat;
}

/** Flatten optional per-vertex colors to `[r,g,b,...]` in 0–1 range. */
export function toFlatColors(
	colors: Array<ColorRepresentation | undefined> | undefined,
	pointCount: number,
	fallback: ColorRepresentation,
): number[] | undefined {
	if (!colors || colors.length === 0) {
		return undefined;
	}

	const flat: number[] = [];
	const fallbackColor = new Color(fallback);

	for (let i = 0; i < pointCount; i++) {
		const source = colors[i] ?? colors[colors.length - 1] ?? fallback;
		const color = new Color(source ?? fallbackColor);
		flat.push(color.r, color.g, color.b);
	}

	return flat;
}

/** Build a `LineGeometry` from polyline options. */
export function buildLineGeometry(options: LineGeometryBuildOptions): LineGeometry {
	const geometry = new LineGeometry();
	const positions = toFlatPositions(options.points);
	geometry.setPositions(positions);

	const colors = toFlatColors(options.colors, options.points.length, '#ffffff');
	if (colors) {
		geometry.setColors(colors);
	}

	return geometry;
}
