/**
 * Editing brushes by their parts, and whole-brush transforms.
 *
 * Faces, edges, and vertices are named by the planes that meet there: a face
 * by its plane, an edge by the two planes either side, a vertex by every plane
 * through it. Names are plane indices, so they survive undo. Edits that keep
 * the plane list (face moves, rotate, scale) keep the names. Edits that
 * rebuild the hull (element moves, shear) hand back the names remapped by
 * position.
 */

import {
	brushBounds,
	brushFromPoints,
	clipBrush,
	compileBrush,
	type BrushPlane,
	type BrushVec3,
	type CompiledBrush,
} from './brush';
import {
	EPS,
	add,
	centroid,
	cleanNumber,
	cleanVec,
	copyVec,
	cross,
	dot,
	length,
	normalize,
	rotateVec,
	samePoint,
	scale,
	sub,
} from './vec';

export type BrushElementKind = 'face' | 'edge' | 'vertex';

export interface BrushElementKey {
	kind: BrushElementKind;
	/** Plane indices, ascending. One for a face, two for an edge, three or more for a vertex. */
	planes: number[];
}

export interface BrushEdge {
	/** The two planes either side, ascending. */
	planes: [number, number];
	/** Endpoints, as indices into the compiled vertices. */
	vertices: [number, number];
}

export interface BrushTopology extends CompiledBrush {
	/** The face planes through each compiled vertex, ascending. */
	vertexPlanes: number[][];
	edges: BrushEdge[];
}

export interface ElementMove {
	key: BrushElementKey;
	delta: BrushVec3;
}

export interface ElementMoveResult {
	planes: BrushPlane[];
	/** The moved elements in the rebuilt brush. An element that no longer exists is dropped. */
	keys: BrushElementKey[];
}

/** Most pieces `subdivideBrush` cuts unless told otherwise. */
export const MAX_SUBDIVIDE_PIECES = 256;

const ascending = (a: number, b: number) => a - b;

function copyPlanes(planes: readonly BrushPlane[]): BrushPlane[] {
	return planes.map((plane) => ({ normal: copyVec(plane.normal), distance: plane.distance }));
}

function copyKey(key: BrushElementKey): BrushElementKey {
	return { kind: key.kind, planes: [...key.planes] };
}

function sameIndices(a: readonly number[], b: readonly number[]): boolean {
	return a.length === b.length && a.every((value, index) => value === b[index]);
}

/** Compiled vertices and faces plus the plane names of every vertex and edge. */
export function brushTopology(planes: readonly BrushPlane[]): BrushTopology | null {
	const compiled = compileBrush(planes);
	if (!compiled) return null;
	const facePlanes = [...new Set(compiled.faces.map((face) => face.planeIndex))].sort(ascending);
	const vertexPlanes = compiled.vertices.map((vertex) =>
		facePlanes.filter((index) => {
			const plane = planes[index]!;
			return Math.abs(dot(plane.normal, vertex) - plane.distance) <= EPS;
		})
	);

	const sides = new Map<string, { vertices: [number, number]; planes: number[] }>();
	for (const face of compiled.faces) {
		const ring = face.indices;
		for (let index = 0; index < ring.length; index += 1) {
			const a = ring[index]!;
			const b = ring[(index + 1) % ring.length]!;
			const key = a < b ? `${a}:${b}` : `${b}:${a}`;
			const entry = sides.get(key);
			if (!entry) sides.set(key, { vertices: a < b ? [a, b] : [b, a], planes: [face.planeIndex] });
			else if (!entry.planes.includes(face.planeIndex)) entry.planes.push(face.planeIndex);
		}
	}
	const edges: BrushEdge[] = [];
	for (const entry of sides.values()) {
		if (entry.planes.length < 2) continue;
		const [p, q] = entry.planes.slice(0, 2).sort(ascending) as [number, number];
		edges.push({ planes: [p, q], vertices: entry.vertices });
	}
	return { ...compiled, vertexPlanes, edges };
}

/** Every edge with the two planes either side. */
export function brushEdges(planes: readonly BrushPlane[]): BrushEdge[] | null {
	return brushTopology(planes)?.edges ?? null;
}

function elementVertices(topology: BrushTopology, key: BrushElementKey): number[] | null {
	switch (key.kind) {
		case 'face': {
			const face = topology.faces.find((entry) => entry.planeIndex === key.planes[0]);
			return face ? [...face.indices] : null;
		}
		case 'edge': {
			const edge = topology.edges.find((entry) => sameIndices(entry.planes, key.planes));
			return edge ? [...edge.vertices] : null;
		}
		case 'vertex': {
			const exact = topology.vertexPlanes.findIndex((planes) => sameIndices(planes, key.planes));
			if (exact >= 0) return [exact];
			if (key.planes.length < 3) return null;
			// A later edit can add a plane through the corner; three of its planes still pin it.
			const covering = topology.vertexPlanes.flatMap((planes, index) =>
				key.planes.every((plane) => planes.includes(plane)) ? [index] : []
			);
			return covering.length === 1 ? covering : null;
		}
		default:
			return null;
	}
}

function findInTopology(
	topology: BrushTopology,
	kind: BrushElementKind,
	positions: readonly BrushVec3[]
): BrushElementKey | null {
	const at = (point: BrushVec3) =>
		topology.vertices.findIndex((vertex) => samePoint(vertex, point));
	switch (kind) {
		case 'vertex': {
			const index = positions[0] ? at(positions[0]) : -1;
			return index >= 0 ? { kind, planes: [...topology.vertexPlanes[index]!] } : null;
		}
		case 'edge': {
			if (positions.length < 2) return null;
			const a = at(positions[0]!);
			const b = at(positions[1]!);
			if (a < 0 || b < 0) return null;
			const edge = topology.edges.find(
				(entry) =>
					(entry.vertices[0] === a && entry.vertices[1] === b) ||
					(entry.vertices[0] === b && entry.vertices[1] === a)
			);
			return edge ? { kind, planes: [...edge.planes] } : null;
		}
		case 'face': {
			const wanted = new Set<number>();
			for (const point of positions) {
				const index = at(point);
				if (index < 0) return null;
				wanted.add(index);
			}
			const face = topology.faces.find(
				(entry) =>
					entry.indices.length === wanted.size && entry.indices.every((index) => wanted.has(index))
			);
			return face ? { kind, planes: [face.planeIndex] } : null;
		}
		default:
			return null;
	}
}

/** World positions of an element's corners: a face in winding order, an edge's two ends, or one vertex. */
export function elementPositions(
	planes: readonly BrushPlane[],
	key: BrushElementKey
): BrushVec3[] | null {
	const topology = brushTopology(planes);
	if (!topology) return null;
	const indices = elementVertices(topology, key);
	return indices ? indices.map((index) => copyVec(topology.vertices[index]!)) : null;
}

/** The element whose corners sit at `positions`, or `null` when the brush has none there. */
export function findElementAt(
	planes: readonly BrushPlane[],
	kind: BrushElementKind,
	positions: readonly BrushVec3[]
): BrushElementKey | null {
	const topology = brushTopology(planes);
	return topology ? findInTopology(topology, kind, positions) : null;
}

/**
 * Push or pull faces along their own normals by `distance`.
 *
 * `null` when the brush collapses or a moved face is left with no area.
 * The plane list keeps its order, so face names stay valid.
 */
export function moveFaces(
	planes: readonly BrushPlane[],
	planeIndices: readonly number[],
	distance: number
): BrushPlane[] | null {
	const moving = new Set(planeIndices);
	if (moving.size === 0 || !Number.isFinite(distance)) return null;
	for (const index of moving) {
		if (!Number.isInteger(index) || index < 0 || index >= planes.length) return null;
	}
	const next = planes.map((plane, index) => ({
		normal: copyVec(plane.normal),
		distance: moving.has(index) ? plane.distance + distance * length(plane.normal) : plane.distance,
	}));
	const compiled = compileBrush(next);
	if (!compiled) return null;
	const withFaces = new Set(compiled.faces.map((face) => face.planeIndex));
	for (const index of moving) {
		if (!withFaces.has(index)) return null;
	}
	return next;
}

export function moveFace(
	planes: readonly BrushPlane[],
	planeIndex: number,
	distance: number
): BrushPlane[] | null {
	return moveFaces(planes, [planeIndex], distance);
}

/**
 * A new brush swept from one face along its normal. A negative distance
 * sweeps into the source brush. Plane 0 faces the same way as the source face.
 */
export function extrudeFace(
	planes: readonly BrushPlane[],
	planeIndex: number,
	distance: number
): BrushPlane[] | null {
	if (!Number.isFinite(distance) || Math.abs(distance) < EPS) return null;
	const compiled = compileBrush(planes);
	const face = compiled?.faces.find((entry) => entry.planeIndex === planeIndex);
	if (!compiled || !face) return null;
	const source = planes[planeIndex]!;
	const magnitude = length(source.normal);
	const normal = scale(source.normal, 1 / magnitude);
	const offset = source.distance / magnitude;
	const ring = face.indices.map((index) => compiled.vertices[index]!);
	const middle = centroid(ring);

	const next: BrushPlane[] = [
		{ normal: cleanVec(normal), distance: cleanNumber(offset + Math.max(0, distance)) },
		{
			normal: cleanVec(scale(normal, -1)),
			distance: cleanNumber(-(offset + Math.min(0, distance))),
		},
	];
	for (let index = 0; index < ring.length; index += 1) {
		const p = ring[index]!;
		const q = ring[(index + 1) % ring.length]!;
		let side = normalize(cross(sub(q, p), normal));
		if (!side) continue;
		if (dot(side, sub(middle, p)) > 0) side = scale(side, -1);
		side = cleanVec(side);
		next.push({ normal: side, distance: cleanNumber(dot(side, p)) });
	}
	return compileBrush(next) ? next : null;
}

/**
 * Move elements, each by its own delta, and rebuild the hull.
 *
 * A corner shared by two moves takes the first one's delta. `null` when a key
 * is missing or a moved corner would end up inside or on the surface of the
 * new hull, since the brush would no longer be the convex shape its corners
 * describe.
 */
export function moveElementsBy(
	planes: readonly BrushPlane[],
	moves: readonly ElementMove[]
): ElementMoveResult | null {
	const topology = brushTopology(planes);
	if (!topology || moves.length === 0) return null;
	const offsets = new Map<number, BrushVec3>();
	const groups: number[][] = [];
	for (const move of moves) {
		const indices = elementVertices(topology, move.key);
		if (!indices) return null;
		groups.push(indices);
		for (const index of indices) {
			if (!offsets.has(index)) offsets.set(index, move.delta);
		}
	}
	if ([...offsets.values()].every((delta) => length(delta) < EPS)) {
		return { planes: copyPlanes(planes), keys: moves.map((move) => copyKey(move.key)) };
	}

	const points = topology.vertices.map((vertex, index) => {
		const delta = offsets.get(index);
		return delta ? add(vertex, delta) : copyVec(vertex);
	});
	const hull = brushFromPoints(points);
	if (!hull) return null;
	const rebuilt = brushTopology(hull);
	if (!rebuilt) return null;
	for (const point of points) {
		if (!rebuilt.vertices.some((vertex) => samePoint(vertex, point))) return null;
	}

	const keys: BrushElementKey[] = [];
	moves.forEach((move, index) => {
		const positions = groups[index]!.map((vertex) => points[vertex]!);
		const found = findInTopology(rebuilt, move.key.kind, positions);
		if (found) keys.push(found);
	});
	return { planes: hull, keys };
}

/** Move elements together by one delta. */
export function moveElements(
	planes: readonly BrushPlane[],
	keys: readonly BrushElementKey[],
	delta: BrushVec3
): ElementMoveResult | null {
	return moveElementsBy(
		planes,
		keys.map((key) => ({ key, delta }))
	);
}

/** Slide faces within their own planes: the part of `delta` along each face normal is dropped. */
export function shearFaces(
	planes: readonly BrushPlane[],
	planeIndices: readonly number[],
	delta: BrushVec3
): ElementMoveResult | null {
	const moves: ElementMove[] = [];
	for (const index of planeIndices) {
		const plane = planes[index];
		const normal = plane ? normalize(plane.normal) : null;
		if (!normal) return null;
		moves.push({
			key: { kind: 'face', planes: [index] },
			delta: sub(delta, scale(normal, dot(delta, normal))),
		});
	}
	return moveElementsBy(planes, moves);
}

/** Turn a brush `angle` radians about `axis` through `pivot`. The plane list keeps its order. */
export function rotateBrush(
	planes: readonly BrushPlane[],
	axis: BrushVec3,
	angle: number,
	pivot: BrushVec3
): BrushPlane[] | null {
	const unit = normalize(axis);
	if (!unit || !Number.isFinite(angle)) return null;
	const next = planes.map((plane) => {
		const normal = cleanVec(rotateVec(plane.normal, unit, angle));
		const onPlane = scale(plane.normal, plane.distance / dot(plane.normal, plane.normal));
		const moved = add(pivot, rotateVec(sub(onPlane, pivot), unit, angle));
		return { normal, distance: cleanNumber(dot(normal, moved)) };
	});
	return compileBrush(next) ? next : null;
}

/**
 * Scale a brush per axis about `pivot`. The plane list keeps its order.
 * `null` for a zero or negative factor, which would flatten or mirror it.
 */
export function scaleBrush(
	planes: readonly BrushPlane[],
	factor: BrushVec3,
	pivot: BrushVec3
): BrushPlane[] | null {
	if (!(factor.x > EPS && factor.y > EPS && factor.z > EPS)) return null;
	const next = planes.map((plane) => {
		// A point p' of the scaled solid satisfies n · (pivot + (p' - pivot) / factor) <= d.
		const raw = {
			x: plane.normal.x / factor.x,
			y: plane.normal.y / factor.y,
			z: plane.normal.z / factor.z,
		};
		const magnitude = length(raw);
		const offset = plane.distance - dot(plane.normal, pivot) + dot(raw, pivot);
		return {
			normal: cleanVec(scale(raw, 1 / magnitude)),
			distance: cleanNumber(offset / magnitude),
		};
	});
	return compileBrush(next) ? next : null;
}

function gridLines(lo: number, hi: number, tile: number): number[] {
	const lines: number[] = [];
	for (let step = Math.ceil((lo + EPS) / tile); step * tile < hi - EPS; step += 1)
		lines.push(step * tile);
	return lines;
}

/**
 * Drop the vertices of the named elements and rebuild the hull.
 *
 * A face drops every corner of that face, an edge its two ends, a vertex
 * itself. `null` when an element is missing or the points left do not
 * enclose a volume.
 */
export function deleteBrushElements(
	planes: readonly BrushPlane[],
	elements: readonly BrushElementKey[]
): BrushPlane[] | null {
	const topology = brushTopology(planes);
	if (!topology || elements.length === 0) return null;
	const drop = new Set<number>();
	for (const element of elements) {
		const indices = elementVertices(topology, element);
		if (!indices || indices.length === 0) return null;
		for (const index of indices) drop.add(index);
	}
	if (drop.size === 0 || drop.size >= topology.vertices.length) return null;
	const points = topology.vertices.filter((_, index) => !drop.has(index));
	return brushFromPoints(points);
}

/**
 * Cut a brush into pieces on the world XZ grid, `tile` units apart.
 *
 * Lines are absolute, so neighbouring brushes split on the same seams. A
 * brush no line crosses comes back whole. `null` for a non-positive tile or
 * more pieces than `maxPieces`.
 */
export function subdivideBrush(
	planes: readonly BrushPlane[],
	tile: number,
	options: { maxPieces?: number } = {}
): BrushPlane[][] | null {
	if (!(tile > EPS)) return null;
	const bounds = brushBounds(planes);
	if (!bounds) return null;
	const xs = gridLines(bounds.min.x, bounds.max.x, tile);
	const zs = gridLines(bounds.min.z, bounds.max.z, tile);
	if ((xs.length + 1) * (zs.length + 1) > (options.maxPieces ?? MAX_SUBDIVIDE_PIECES)) return null;

	let pieces: BrushPlane[][] = [copyPlanes(planes)];
	for (const x of xs) {
		pieces = pieces.flatMap((piece) =>
			clipBrush(piece, { normal: { x: 1, y: 0, z: 0 }, distance: x })
		);
	}
	for (const z of zs) {
		pieces = pieces.flatMap((piece) =>
			clipBrush(piece, { normal: { x: 0, y: 0, z: 1 }, distance: z })
		);
	}
	return pieces;
}
