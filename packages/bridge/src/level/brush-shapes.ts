/**
 * Draw frames and primitive brushes.
 *
 * Drawing happens on a plane: the face under the cursor, the ground, or the
 * view plane. A frame names that plane with an origin and two in-plane axes,
 * so a footprint is a rectangle in `(u, v)` and the height runs along the
 * normal. Every primitive is built as planes in that frame and checked with
 * `compileBrush`, so a ghost drawn from the same call matches what commits.
 */

import { compileBrush, type BrushPlane, type BrushVec3 } from './brush';
import {
	EPS,
	add,
	cleanNumber as clean,
	cleanVec,
	cross,
	dot,
	length,
	normalize,
	scale,
	sub,
} from './vec';

export interface BrushFrame {
	/** The point of the plane nearest the world origin. */
	origin: BrushVec3;
	u: BrushVec3;
	v: BrushVec3;
	/** `u × v`. Positive heights build along it. */
	normal: BrushVec3;
}

/** A rectangle in frame coordinates. Corners may come in either order. */
export interface BrushFootprint {
	u0: number;
	v0: number;
	u1: number;
	v1: number;
}

export type BrushShape = 'box' | 'wedge' | 'cylinder' | 'arch';

export interface BrushShapeOptions {
	/**
	 * Quarter turns. A wedge rises toward +u, +v, -u, -v for turns 0-3; an arch
	 * spans u on even turns and v on odd ones.
	 */
	turn?: number;
	/** Cylinder side count, clamped to 3-64. */
	sides?: number;
	/** Arch segment count, clamped to 2-32. */
	segments?: number;
	/** Arch ring thickness in world units. */
	thickness?: number;
}

export const DEFAULT_CYLINDER_SIDES = 12;
export const DEFAULT_ARCH_SEGMENTS = 8;
export const DEFAULT_ARCH_THICKNESS = 1;

/** A box with every other option at its default; matches the protocol's `LevelDrawShape`. */
export const DEFAULT_DRAW_SHAPE: Readonly<{ shape: BrushShape } & Required<BrushShapeOptions>> =
	Object.freeze({
		shape: 'box',
		turn: 0,
		sides: DEFAULT_CYLINDER_SIDES,
		segments: DEFAULT_ARCH_SEGMENTS,
		thickness: DEFAULT_ARCH_THICKNESS,
	});

const UP: BrushVec3 = { x: 0, y: 1, z: 0 };
const RIGHT: BrushVec3 = { x: 1, y: 0, z: 0 };
/** An arch whose opening is thinner than this is filled with pie slices. */
const MIN_OPENING = 1e-3;

type Point2 = readonly [number, number];

/**
 * A frame on the plane `normal · p = distance`.
 *
 * Floors and ceilings take world X as `u`, and walls and slopes take the
 * up-slope direction as `v`, so axis-aligned planes keep frame coordinates on
 * the world grid.
 */
export function frameForPlane(normal: BrushVec3, distance: number): BrushFrame {
	const magnitude = length(normal);
	const n = magnitude < EPS ? UP : scale(normal, 1 / magnitude);
	const d = magnitude < EPS ? distance : distance / magnitude;
	let u: BrushVec3;
	let v: BrushVec3;
	if (Math.abs(n.y) < 0.9) {
		v = normalize(sub(UP, scale(n, n.y))) ?? UP;
		u = cross(v, n);
	} else {
		u = normalize(sub(RIGHT, scale(n, n.x))) ?? RIGHT;
		v = cross(n, u);
	}
	return { origin: cleanVec(scale(n, d)), u: cleanVec(u), v: cleanVec(v), normal: cleanVec(n) };
}

export function framePoint(frame: BrushFrame, u: number, v: number, h = 0): BrushVec3 {
	return add(frame.origin, add(add(scale(frame.u, u), scale(frame.v, v)), scale(frame.normal, h)));
}

export function pointInFrame(
	frame: BrushFrame,
	point: BrushVec3
): { u: number; v: number; h: number } {
	const offset = sub(point, frame.origin);
	return { u: dot(offset, frame.u), v: dot(offset, frame.v), h: dot(offset, frame.normal) };
}

/** The footprint with `u0 <= u1` and `v0 <= v1`. */
export function orderFootprint(footprint: BrushFootprint): BrushFootprint {
	return {
		u0: Math.min(footprint.u0, footprint.u1),
		v0: Math.min(footprint.v0, footprint.v1),
		u1: Math.max(footprint.u0, footprint.u1),
		v1: Math.max(footprint.v0, footprint.v1),
	};
}

function quarter(turn: number | undefined): number {
	const whole = Math.round(turn ?? 0);
	return Number.isFinite(whole) ? ((whole % 4) + 4) % 4 : 0;
}

function clampCount(value: number | undefined, min: number, max: number, fallback: number): number {
	if (value === undefined || !Number.isFinite(value)) return fallback;
	return Math.min(max, Math.max(min, Math.round(value)));
}

/** Counter-clockwise convex hull, collinear points dropped. */
function hull2d(points: readonly Point2[]): Point2[] {
	const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
	if (sorted.length < 3) return sorted;
	const turn = (o: Point2, a: Point2, b: Point2) =>
		(a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
	const lower: Point2[] = [];
	for (const point of sorted) {
		while (
			lower.length >= 2 &&
			turn(lower[lower.length - 2]!, lower[lower.length - 1]!, point) <= 1e-9
		) {
			lower.pop();
		}
		lower.push(point);
	}
	const upper: Point2[] = [];
	for (let index = sorted.length - 1; index >= 0; index -= 1) {
		const point = sorted[index]!;
		while (
			upper.length >= 2 &&
			turn(upper[upper.length - 2]!, upper[upper.length - 1]!, point) <= 1e-9
		) {
			upper.pop();
		}
		upper.push(point);
	}
	lower.pop();
	upper.pop();
	return [...lower, ...upper];
}

/**
 * A convex polygon in the `(a, b)` plane swept along `axis` from `lo` to `hi`.
 * `a`, `b`, and `axis` are orthonormal; points are `origin + a·x + b·y + axis·s`.
 */
function prism(
	origin: BrushVec3,
	a: BrushVec3,
	b: BrushVec3,
	polygon: readonly Point2[],
	axis: BrushVec3,
	lo: number,
	hi: number
): BrushPlane[] | null {
	if (hi - lo < EPS) return null;
	const ring = hull2d(polygon);
	if (ring.length < 3) return null;
	const planes: BrushPlane[] = [];
	for (let index = 0; index < ring.length; index += 1) {
		const p = ring[index]!;
		const q = ring[(index + 1) % ring.length]!;
		const dx = q[0] - p[0];
		const dy = q[1] - p[1];
		const span = Math.hypot(dx, dy);
		if (span < EPS) continue;
		const normal = cleanVec(add(scale(a, dy / span), scale(b, -dx / span)));
		const point = add(origin, add(scale(a, p[0]), scale(b, p[1])));
		planes.push({ normal, distance: clean(dot(normal, point)) });
	}
	const base = dot(axis, origin);
	planes.push({ normal: cleanVec(axis), distance: clean(base + hi) });
	planes.push({ normal: cleanVec(scale(axis, -1)), distance: clean(-(base + lo)) });
	return compileBrush(planes) ? planes : null;
}

function footprintBox(
	frame: BrushFrame,
	footprint: BrushFootprint,
	height: number
): BrushPlane[] | null {
	const { u0, v0, u1, v1 } = orderFootprint(footprint);
	return prism(
		frame.origin,
		frame.u,
		frame.v,
		[
			[u0, v0],
			[u1, v0],
			[u1, v1],
			[u0, v1],
		],
		frame.normal,
		Math.min(0, height),
		Math.max(0, height)
	);
}

/** A ramp over the footprint whose high edge is picked by `turn`. */
export function wedgeBrush(
	frame: BrushFrame,
	footprint: BrushFootprint,
	height: number,
	turn = 0
): BrushPlane[] | null {
	const f = orderFootprint(footprint);
	const q = quarter(turn);
	const alongU = q % 2 === 0;
	const [s0, s1] = alongU ? [f.u0, f.u1] : [f.v0, f.v1];
	const [d0, d1] = alongU ? [f.v0, f.v1] : [f.u0, f.u1];
	const high = q < 2 ? s1 : s0;
	return prism(
		frame.origin,
		alongU ? frame.u : frame.v,
		frame.normal,
		[
			[s0, 0],
			[s1, 0],
			[high, height],
		],
		alongU ? frame.v : frame.u,
		d0,
		d1
	);
}

/** Corners of a regular polygon whose edges touch the unit circle, one edge facing +x. */
function circumscribedPolygon(sides: number): Point2[] {
	const radius = 1 / Math.cos(Math.PI / sides);
	const corners: Point2[] = [];
	for (let index = 0; index < sides; index += 1) {
		const angle = ((index + 0.5) * 2 * Math.PI) / sides;
		corners.push([radius * Math.cos(angle), radius * Math.sin(angle)]);
	}
	return corners;
}

/** A prism with `sides` faces stretched to fill the footprint. */
export function cylinderBrush(
	frame: BrushFrame,
	footprint: BrushFootprint,
	height: number,
	sides = DEFAULT_CYLINDER_SIDES
): BrushPlane[] | null {
	const f = orderFootprint(footprint);
	if (f.u1 - f.u0 < EPS || f.v1 - f.v0 < EPS) return null;
	const corners = circumscribedPolygon(clampCount(sides, 3, 64, DEFAULT_CYLINDER_SIDES));
	const xs = corners.map((corner) => corner[0]);
	const ys = corners.map((corner) => corner[1]);
	const minX = Math.min(...xs);
	const maxX = Math.max(...xs);
	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);
	const fitted = corners.map(
		([x, y]): Point2 => [
			f.u0 + ((x - minX) / (maxX - minX)) * (f.u1 - f.u0),
			f.v0 + ((y - minY) / (maxY - minY)) * (f.v1 - f.v0),
		]
	);
	return prism(
		frame.origin,
		frame.u,
		frame.v,
		fitted,
		frame.normal,
		Math.min(0, height),
		Math.max(0, height)
	);
}

/**
 * A half-elliptical arch, one convex brush per segment.
 *
 * The span runs across the footprint (u on even turns, v on odd), the other
 * footprint axis is the wall depth, and `height` is the rise. When the ring
 * is thicker than the opening, the segments become solid pie slices.
 */
export function archBrushes(
	frame: BrushFrame,
	footprint: BrushFootprint,
	height: number,
	options: Pick<BrushShapeOptions, 'turn' | 'segments' | 'thickness'> = {}
): BrushPlane[][] | null {
	const f = orderFootprint(footprint);
	const alongU = quarter(options.turn) % 2 === 0;
	const [s0, s1] = alongU ? [f.u0, f.u1] : [f.v0, f.v1];
	const [d0, d1] = alongU ? [f.v0, f.v1] : [f.u0, f.u1];
	if (s1 - s0 < EPS || d1 - d0 < EPS || Math.abs(height) < EPS) return null;

	const count = clampCount(options.segments, 2, 32, DEFAULT_ARCH_SEGMENTS);
	const thickness = Number.isFinite(options.thickness)
		? Math.max(0, options.thickness as number)
		: DEFAULT_ARCH_THICKNESS;
	const center = (s0 + s1) / 2;
	const radiusS = (s1 - s0) / 2;
	const rise = Math.abs(height);
	const sign = Math.sign(height);
	const innerS = radiusS - thickness;
	const innerRise = rise - thickness;
	const solid = innerS < MIN_OPENING || innerRise < MIN_OPENING;
	const outer = (angle: number): Point2 => [
		center + radiusS * Math.cos(angle),
		sign * rise * Math.sin(angle),
	];
	const inner = (angle: number): Point2 =>
		solid ? [center, 0] : [center + innerS * Math.cos(angle), sign * innerRise * Math.sin(angle)];

	const span = alongU ? frame.u : frame.v;
	const depth = alongU ? frame.v : frame.u;
	const brushes: BrushPlane[][] = [];
	for (let index = 0; index < count; index += 1) {
		const from = (Math.PI * index) / count;
		const to = (Math.PI * (index + 1)) / count;
		const planes = prism(
			frame.origin,
			span,
			frame.normal,
			[inner(from), inner(to), outer(to), outer(from)],
			depth,
			d0,
			d1
		);
		if (!planes) return null;
		brushes.push(planes);
	}
	return brushes;
}

/**
 * The brushes a primitive bakes to, or `null` for a flat footprint or height.
 * Every shape but the arch is one brush.
 */
export function primitiveBrushes(
	shape: BrushShape,
	frame: BrushFrame,
	footprint: BrushFootprint,
	height: number,
	options: BrushShapeOptions = {}
): BrushPlane[][] | null {
	const f = orderFootprint(footprint);
	if (Math.abs(height) < EPS || f.u1 - f.u0 < EPS || f.v1 - f.v0 < EPS) return null;
	const single = (planes: BrushPlane[] | null) => (planes ? [planes] : null);
	switch (shape) {
		case 'box':
			return single(footprintBox(frame, f, height));
		case 'wedge':
			return single(wedgeBrush(frame, f, height, options.turn));
		case 'cylinder':
			return single(cylinderBrush(frame, f, height, options.sides));
		case 'arch':
			return archBrushes(frame, f, height, options);
		default:
			return null;
	}
}
