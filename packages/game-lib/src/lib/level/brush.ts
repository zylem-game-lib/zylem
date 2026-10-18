/**
 * Convex brush kernel.
 *
 * A brush is the intersection of half-spaces: a point is inside when
 * `normal · point <= distance` for every plane. The normal points outward.
 * Planes are world-space, so moving a brush shifts every distance by
 * `normal · delta`. No Three.js and no physics types.
 *
 * Copy of `packages/bridge/src/level/brush.ts`, kept inside this package so
 * the declaration build does not reach outside `src`.
 */

export interface BrushVec3 {
	x: number;
	y: number;
	z: number;
}

export interface BrushPlane {
	normal: BrushVec3;
	/** The solid is `normal · point <= distance`. */
	distance: number;
}

export interface CompiledFace {
	/** Index into the plane list that produced this face. */
	planeIndex: number;
	/** Vertex indices, wound counter-clockwise when looking along the outward normal. */
	indices: number[];
}

export interface CompiledBrush {
	vertices: BrushVec3[];
	faces: CompiledFace[];
}

const EPS = 1e-5;

function dot(a: BrushVec3, b: BrushVec3): number {
	return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a: BrushVec3, b: BrushVec3): BrushVec3 {
	return {
		x: a.y * b.z - a.z * b.y,
		y: a.z * b.x - a.x * b.z,
		z: a.x * b.y - a.y * b.x,
	};
}

function sub(a: BrushVec3, b: BrushVec3): BrushVec3 {
	return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function add(a: BrushVec3, b: BrushVec3): BrushVec3 {
	return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function scale(a: BrushVec3, factor: number): BrushVec3 {
	return { x: a.x * factor, y: a.y * factor, z: a.z * factor };
}

function length(a: BrushVec3): number {
	return Math.hypot(a.x, a.y, a.z);
}

function normalize(a: BrushVec3): BrushVec3 | null {
	const magnitude = length(a);
	if (magnitude < EPS) return null;
	return scale(a, 1 / magnitude);
}

function samePoint(a: BrushVec3, b: BrushVec3): boolean {
	return Math.abs(a.x - b.x) <= EPS && Math.abs(a.y - b.y) <= EPS && Math.abs(a.z - b.z) <= EPS;
}

function copyVec(value: BrushVec3): BrushVec3 {
	return { x: value.x, y: value.y, z: value.z };
}

/** Six planes of an axis-aligned box. Zero volume still returns planes; compile rejects it. */
export function boxBrush(min: BrushVec3, max: BrushVec3): BrushPlane[] {
	const lo = {
		x: Math.min(min.x, max.x),
		y: Math.min(min.y, max.y),
		z: Math.min(min.z, max.z),
	};
	const hi = {
		x: Math.max(min.x, max.x),
		y: Math.max(min.y, max.y),
		z: Math.max(min.z, max.z),
	};
	return [
		{ normal: { x: 1, y: 0, z: 0 }, distance: hi.x },
		{ normal: { x: -1, y: 0, z: 0 }, distance: -lo.x },
		{ normal: { x: 0, y: 1, z: 0 }, distance: hi.y },
		{ normal: { x: 0, y: -1, z: 0 }, distance: -lo.y },
		{ normal: { x: 0, y: 0, z: 1 }, distance: hi.z },
		{ normal: { x: 0, y: 0, z: -1 }, distance: -lo.z },
	];
}

function intersectPlanes(a: BrushPlane, b: BrushPlane, c: BrushPlane): BrushVec3 | null {
	const n1 = a.normal;
	const n2 = b.normal;
	const n3 = c.normal;
	const denominator = dot(n1, cross(n2, n3));
	if (Math.abs(denominator) < 1e-8) return null;
	const c23 = cross(n2, n3);
	const c31 = cross(n3, n1);
	const c12 = cross(n1, n2);
	return {
		x: (a.distance * c23.x + b.distance * c31.x + c.distance * c12.x) / denominator,
		y: (a.distance * c23.y + b.distance * c31.y + c.distance * c12.y) / denominator,
		z: (a.distance * c23.z + b.distance * c31.z + c.distance * c12.z) / denominator,
	};
}

function inside(point: BrushVec3, planes: readonly BrushPlane[]): boolean {
	for (const plane of planes) {
		if (dot(plane.normal, point) - plane.distance > EPS) return false;
	}
	return true;
}

function orderIndices(vertices: readonly BrushVec3[], indices: readonly number[], normal: BrushVec3): number[] {
	const origin = vertices[indices[0]!]!;
	let tangent = cross(normal, { x: 1, y: 0, z: 0 });
	if (length(tangent) < 1e-8) tangent = cross(normal, { x: 0, y: 1, z: 0 });
	const tangentUnit = normalize(tangent);
	if (!tangentUnit) return [...indices];
	// `tangent × bitangent = normal`, so atan2 increases counter-clockwise
	// when the outward normal points at the viewer.
	const bitangent = cross(normal, tangentUnit);
	const scored = indices.map((index) => {
		const offset = sub(vertices[index]!, origin);
		return { index, angle: Math.atan2(dot(offset, bitangent), dot(offset, tangentUnit)) };
	});
	scored.sort((a, b) => a.angle - b.angle);
	return scored.map((entry) => entry.index);
}

/**
 * Vertices and faces of a bounded convex solid, or `null` when the planes do
 * not close (empty, flat, or open).
 */
export function compileBrush(planes: readonly BrushPlane[]): CompiledBrush | null {
	if (planes.length < 4) return null;

	const vertices: BrushVec3[] = [];
	for (let i = 0; i < planes.length; i += 1) {
		for (let j = i + 1; j < planes.length; j += 1) {
			for (let k = j + 1; k < planes.length; k += 1) {
				const point = intersectPlanes(planes[i]!, planes[j]!, planes[k]!);
				if (!point || !inside(point, planes)) continue;
				if (vertices.some((existing) => samePoint(existing, point))) continue;
				vertices.push(point);
			}
		}
	}
	if (vertices.length < 4) return null;

	const faces: CompiledFace[] = [];
	for (let i = 0; i < planes.length; i += 1) {
		const plane = planes[i]!;
		const onPlane: number[] = [];
		for (let v = 0; v < vertices.length; v += 1) {
			if (Math.abs(dot(plane.normal, vertices[v]!) - plane.distance) <= EPS) onPlane.push(v);
		}
		if (onPlane.length < 3) continue;
		const indices = orderIndices(vertices, onPlane, plane.normal);
		if (indices.length < 3) continue;
		faces.push({ planeIndex: i, indices });
	}
	if (faces.length < 4) return null;
	return { vertices, faces };
}

/** Shift every plane so the solid moves by `delta`. */
export function translateBrush(planes: readonly BrushPlane[], delta: BrushVec3): BrushPlane[] {
	return planes.map((plane) => ({
		normal: copyVec(plane.normal),
		distance: plane.distance + dot(plane.normal, delta),
	}));
}

function planesWithFaces(planes: readonly BrushPlane[]): BrushPlane[] | null {
	const compiled = compileBrush(planes);
	if (!compiled) return null;
	const used = new Set(compiled.faces.map((face) => face.planeIndex));
	const kept = planes.filter((_, index) => used.has(index));
	if (kept.length < 4 || !compileBrush(kept)) return null;
	return kept.map((plane) => ({ normal: copyVec(plane.normal), distance: plane.distance }));
}

/**
 * Split a brush with a half-space.
 *
 * Each side that still compiles is returned, redundant planes dropped. A clip
 * that misses leaves the original solid as the only entry.
 */
export function clipBrush(planes: readonly BrushPlane[], clip: BrushPlane): BrushPlane[][] {
	const keep = planesWithFaces([...planes, clip]);
	const drop = planesWithFaces([
		...planes,
		{
			normal: scale(clip.normal, -1),
			distance: -clip.distance,
		},
	]);
	const sides: BrushPlane[][] = [];
	if (keep) sides.push(keep);
	if (drop) sides.push(drop);
	return sides;
}

interface HullFace {
	a: number;
	b: number;
	c: number;
	normal: BrushVec3;
	distance: number;
}

function makeFace(
	points: readonly BrushVec3[],
	a: number,
	b: number,
	c: number,
	interior: BrushVec3,
): HullFace | null {
	const normal = normalize(cross(sub(points[b]!, points[a]!), sub(points[c]!, points[a]!)));
	if (!normal) return null;
	let outward = normal;
	let second = b;
	let third = c;
	if (dot(outward, interior) > dot(outward, points[a]!) + EPS) {
		outward = scale(outward, -1);
		second = c;
		third = b;
	}
	return { a, b: second, c: third, normal: outward, distance: dot(outward, points[a]!) };
}

function inFront(face: HullFace, point: BrushVec3): boolean {
	return dot(face.normal, point) - face.distance > EPS;
}

function dedupePoints(points: readonly BrushVec3[]): BrushVec3[] {
	const unique: BrushVec3[] = [];
	for (const point of points) {
		if (unique.some((existing) => samePoint(existing, point))) continue;
		unique.push(copyVec(point));
	}
	return unique;
}

function initialTetra(points: readonly BrushVec3[]): [number, number, number, number] | null {
	let i1 = 0;
	let best = 0;
	for (let i = 1; i < points.length; i += 1) {
		const gap = length(sub(points[i]!, points[0]!));
		if (gap > best) {
			best = gap;
			i1 = i;
		}
	}
	if (best < EPS) return null;

	const axis = sub(points[i1]!, points[0]!);
	let i2 = -1;
	let bestLine = 0;
	for (let i = 0; i < points.length; i += 1) {
		if (i === 0 || i === i1) continue;
		const area = length(cross(axis, sub(points[i]!, points[0]!)));
		if (area > bestLine) {
			bestLine = area;
			i2 = i;
		}
	}
	if (i2 < 0 || bestLine < EPS) return null;

	const normal = cross(axis, sub(points[i2]!, points[0]!));
	let i3 = -1;
	let bestPlane = 0;
	for (let i = 0; i < points.length; i += 1) {
		if (i === 0 || i === i1 || i === i2) continue;
		const volume = Math.abs(dot(normal, sub(points[i]!, points[0]!)));
		if (volume > bestPlane) {
			bestPlane = volume;
			i3 = i;
		}
	}
	if (i3 < 0 || bestPlane < 1e-8) return null;
	return [0, i1, i2, i3];
}

function centroid(points: readonly BrushVec3[]): BrushVec3 {
	const sum = points.reduce((acc, point) => add(acc, point), { x: 0, y: 0, z: 0 });
	return scale(sum, 1 / points.length);
}

/** Planes of the convex hull, or `null` when the points do not span a volume. */
function convexHullPlanes(points: readonly BrushVec3[]): BrushPlane[] | null {
	const unique = dedupePoints(points);
	if (unique.length < 4) return null;
	const tetra = initialTetra(unique);
	if (!tetra) return null;
	const [i0, i1, i2, i3] = tetra;
	const interior = centroid([unique[i0]!, unique[i1]!, unique[i2]!, unique[i3]!]);
	const faces: HullFace[] = [];
	for (const [a, b, c] of [
		[i0, i1, i2],
		[i0, i2, i3],
		[i0, i3, i1],
		[i1, i3, i2],
	] as const) {
		const face = makeFace(unique, a, b, c, interior);
		if (!face) return null;
		faces.push(face);
	}

	for (let index = 0; index < unique.length; index += 1) {
		if (index === i0 || index === i1 || index === i2 || index === i3) continue;
		const point = unique[index]!;
		const visible: number[] = [];
		for (let faceIndex = 0; faceIndex < faces.length; faceIndex += 1) {
			if (inFront(faces[faceIndex]!, point)) visible.push(faceIndex);
		}
		if (visible.length === 0) continue;

		const visibleSet = new Set(visible);
		const edges = new Map<string, { a: number; b: number; count: number }>();
		for (const faceIndex of visible) {
			const face = faces[faceIndex]!;
			for (const [a, b] of [
				[face.a, face.b],
				[face.b, face.c],
				[face.c, face.a],
			] as const) {
				const key = a < b ? `${a}:${b}` : `${b}:${a}`;
				const existing = edges.get(key);
				if (existing) existing.count += 1;
				else edges.set(key, { a, b, count: 1 });
			}
		}

		const next = faces.filter((_, faceIndex) => !visibleSet.has(faceIndex));
		for (const edge of edges.values()) {
			if (edge.count !== 1) continue;
			const face = makeFace(unique, edge.a, edge.b, index, interior);
			if (face) next.push(face);
		}
		faces.length = 0;
		faces.push(...next);
	}

	const planes: BrushPlane[] = [];
	for (const face of faces) {
		const match = planes.some(
			(plane) =>
				Math.abs(dot(plane.normal, face.normal) - 1) < 1e-4 &&
				Math.abs(plane.distance - face.distance) < 1e-4,
		);
		if (!match) planes.push({ normal: copyVec(face.normal), distance: face.distance });
	}
	return planes.length >= 4 ? planes : null;
}

/**
 * Move one compiled vertex and rebuild the planes.
 *
 * `null` when the index is out of range or any input point would fall inside
 * the hull — the solid would no longer be the convex shape those points describe.
 */
export function setBrushVertex(
	planes: readonly BrushPlane[],
	vertexIndex: number,
	position: BrushVec3,
): BrushPlane[] | null {
	const compiled = compileBrush(planes);
	if (!compiled) return null;
	if (vertexIndex < 0 || vertexIndex >= compiled.vertices.length) return null;

	const next = compiled.vertices.map((vertex, index) =>
		index === vertexIndex ? copyVec(position) : copyVec(vertex),
	);
	const hull = convexHullPlanes(next);
	if (!hull) return null;
	const check = compileBrush(hull);
	if (!check) return null;

	for (const vertex of dedupePoints(next)) {
		if (!check.vertices.some((other) => samePoint(vertex, other))) return null;
	}
	return hull;
}
