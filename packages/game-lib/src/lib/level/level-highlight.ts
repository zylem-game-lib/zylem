/**
 * Overlays for the level tools: hover and selection on faces, edges, and
 * vertices, the element-mode wireframe, translucent brush ghosts, the draw
 * footprint, clip points, and axis guides. Builders return a fresh object
 * the caller owns.
 */

import {
	BufferGeometry,
	DoubleSide,
	Float32BufferAttribute,
	Group,
	Line,
	LineBasicMaterial,
	LineLoop,
	LineSegments,
	Mesh,
	MeshBasicMaterial,
	MeshStandardMaterial,
	Points,
	PointsMaterial,
	type Material,
	type Object3D,
} from 'three';
import {
	compileBrush,
	elementPositions,
	framePoint,
	primitiveBrushes,
	type BrushFootprint,
	type BrushFrame,
	type BrushPlane,
	type BrushTopology,
	type BrushVec3,
	type CompiledBrush,
	type LevelDrawShape,
	type LevelElementRef,
} from '@zylem/bridge';
import type { DrawState } from './level-draw-tool';
import { brushGeometry } from './level-geometry';

export const HOVER_COLOR = 0x66ccff;
export const SELECTION_COLOR = 0xffb020;
export const GHOST_COLOR = 0xc8c2b4;
const WIRE_COLOR = 0x39404a;

/** After the preview faces, so marks stay on what they mark. */
const OVERLAY_ORDER = 15;
/** Point sizes in CSS pixels. */
const WIRE_DOT_SIZE = 4;
export const MARKER_SIZE = 7;

/** Half-length of each guide, long enough to cross an editor view. */
const AXIS_GUIDE_SPAN = 250;
const AXIS_GUIDES: Array<{ color: number; axis: 'x' | 'y' | 'z' }> = [
	{ color: 0xff3333, axis: 'x' },
	{ color: 0x33cc66, axis: 'y' },
	{ color: 0x3388ff, axis: 'z' },
];

/** Points are sized in framebuffer pixels. */
function devicePixels(size: number): number {
	const ratio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
	return size * ratio;
}

export function disposeMaterial(material: Material | Material[]): void {
	if (!Array.isArray(material)) {
		material.dispose();
		return;
	}
	for (const entry of material) entry.dispose();
}

export function disposeObject(object: Object3D): void {
	object.traverse((child) => {
		const mesh = child as Mesh;
		mesh.geometry?.dispose();
		if (mesh.material) disposeMaterial(mesh.material);
	});
}

/** One replaceable overlay under a parent. Setting another disposes the one before. */
export class OverlaySlot {
	private current: Object3D | null = null;

	constructor(private readonly parent: Object3D) {}

	set(next: Object3D | null): void {
		if (this.current === next) return;
		if (this.current) {
			this.parent.remove(this.current);
			disposeObject(this.current);
		}
		this.current = next;
		if (next) this.parent.add(next);
	}

	clear(): void {
		this.set(null);
	}
}

function positionGeometry(positions: number[]): BufferGeometry {
	const geometry = new BufferGeometry();
	geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
	return geometry;
}

function flat(points: readonly BrushVec3[]): number[] {
	return points.flatMap((point) => [point.x, point.y, point.z]);
}

function lineMaterial(color: number, overlay: boolean): LineBasicMaterial {
	return new LineBasicMaterial({ color, depthTest: !overlay, transparent: overlay });
}

function ringLoop(corners: readonly BrushVec3[], color: number): LineLoop {
	const loop = new LineLoop(positionGeometry(flat(corners)), lineMaterial(color, true));
	loop.renderOrder = OVERLAY_ORDER + 1;
	return loop;
}

/** A face ring, tinted, with its outline. `null` for fewer than three corners. */
export function faceHighlight(
	corners: readonly BrushVec3[],
	color: number,
	opacity: number
): Object3D | null {
	if (corners.length < 3) return null;
	const geometry = positionGeometry(flat(corners));
	const indices: number[] = [];
	for (let index = 1; index < corners.length - 1; index += 1) indices.push(0, index, index + 1);
	geometry.setIndex(indices);
	const fill = new Mesh(
		geometry,
		new MeshBasicMaterial({
			color,
			transparent: true,
			opacity,
			side: DoubleSide,
			depthWrite: false,
			polygonOffset: true,
			polygonOffsetFactor: -2,
			polygonOffsetUnits: -4,
		})
	);
	fill.renderOrder = OVERLAY_ORDER;
	const group = new Group();
	group.add(fill, ringLoop(corners, color));
	return group;
}

/** Segments drawn over the faces. */
export function edgeHighlight(
	segments: ReadonlyArray<readonly [BrushVec3, BrushVec3]>,
	color: number
): LineSegments {
	const lines = new LineSegments(
		positionGeometry(segments.flatMap(([a, b]) => [a.x, a.y, a.z, b.x, b.y, b.z])),
		lineMaterial(color, true)
	);
	lines.renderOrder = OVERLAY_ORDER + 1;
	lines.frustumCulled = false;
	return lines;
}

/** Square markers a fixed number of pixels wide, drawn over the faces. */
export function vertexHighlight(
	points: readonly BrushVec3[],
	color: number,
	size = MARKER_SIZE
): Points {
	const markers = new Points(
		positionGeometry(flat(points)),
		new PointsMaterial({
			color,
			size: devicePixels(size),
			sizeAttenuation: false,
			depthTest: false,
			transparent: true,
		})
	);
	markers.renderOrder = OVERLAY_ORDER + 2;
	markers.frustumCulled = false;
	return markers;
}

/** Every edge of one solid. */
export function topologyEdges(topology: BrushTopology): Array<[BrushVec3, BrushVec3]> {
	return topology.edges.map((edge) => [
		topology.vertices[edge.vertices[0]]!,
		topology.vertices[edge.vertices[1]]!,
	]);
}

/**
 * Every edge of these solids as one set of lines, so element modes show what
 * can be picked. Vertex mode adds a dot on each corner.
 */
export function elementWire(
	topologies: Iterable<BrushTopology>,
	withVertices: boolean
): Object3D | null {
	const lines: number[] = [];
	const dots: number[] = [];
	for (const topology of topologies) {
		for (const [a, b] of topologyEdges(topology)) lines.push(a.x, a.y, a.z, b.x, b.y, b.z);
		if (withVertices) dots.push(...flat(topology.vertices));
	}
	if (lines.length === 0) return null;
	const group = new Group();
	group.name = 'level-element-wire';
	const wire = new LineSegments(positionGeometry(lines), lineMaterial(WIRE_COLOR, false));
	wire.frustumCulled = false;
	group.add(wire);
	if (dots.length > 0) {
		const points = new Points(
			positionGeometry(dots),
			new PointsMaterial({
				color: WIRE_COLOR,
				size: devicePixels(WIRE_DOT_SIZE),
				sizeAttenuation: false,
			})
		);
		points.frustumCulled = false;
		group.add(points);
	}
	return group;
}

function ringSegments(compiled: CompiledBrush): number[] {
	const lines: number[] = [];
	for (const face of compiled.faces) {
		face.indices.forEach((index, at) => {
			const a = compiled.vertices[index]!;
			const b = compiled.vertices[face.indices[(at + 1) % face.indices.length]!]!;
			lines.push(a.x, a.y, a.z, b.x, b.y, b.z);
		});
	}
	return lines;
}

/**
 * Translucent brushes compiled from planes the way the commit compiles them.
 * `null` when none compiles.
 */
export function ghostBrushes(
	brushes: readonly (readonly BrushPlane[])[],
	color = GHOST_COLOR,
	opacity = 0.35
): Group | null {
	const group = new Group();
	for (const planes of brushes) {
		const compiled = compileBrush(planes);
		if (!compiled) continue;
		const mesh = new Mesh(
			brushGeometry(compiled),
			new MeshStandardMaterial({
				color,
				transparent: true,
				opacity,
				depthWrite: false,
				side: DoubleSide,
			})
		);
		mesh.renderOrder = OVERLAY_ORDER - 1;
		const outline = new LineSegments(
			positionGeometry(ringSegments(compiled)),
			new LineBasicMaterial({ color, transparent: true, opacity: 0.9 })
		);
		group.add(mesh, outline);
	}
	return group.children.length > 0 ? group : null;
}

/** The footprint rectangle on its frame, filled faintly. */
export function footprintHighlight(
	frame: BrushFrame,
	footprint: BrushFootprint,
	color = GHOST_COLOR
): Object3D | null {
	const corners = [
		framePoint(frame, footprint.u0, footprint.v0),
		framePoint(frame, footprint.u1, footprint.v0),
		framePoint(frame, footprint.u1, footprint.v1),
		framePoint(frame, footprint.u0, footprint.v1),
	];
	return faceHighlight(corners, color, 0.25);
}

/** The footprint while it is dragged, then the ghost the kernel builds for the height step. */
export function drawGhost(state: DrawState, shape: LevelDrawShape): Object3D {
	const group = new Group();
	const footprint = footprintHighlight(state.frame, state.footprint);
	if (footprint) group.add(footprint);
	if (state.height) {
		const brushes = primitiveBrushes(
			shape.shape,
			state.frame,
			state.footprint,
			state.height,
			shape
		);
		const ghost = brushes ? ghostBrushes(brushes) : null;
		if (ghost) group.add(ghost);
	}
	return group;
}

/** World axes through a point. Depth is ignored so the lines stay visible while editing. */
export function axisGuides(center: BrushVec3): Group {
	const group = new Group();
	for (const guide of AXIS_GUIDES) {
		const start = { x: center.x, y: center.y, z: center.z };
		const end = { x: center.x, y: center.y, z: center.z };
		start[guide.axis] -= AXIS_GUIDE_SPAN;
		end[guide.axis] += AXIS_GUIDE_SPAN;
		const line = new Line(
			positionGeometry([start.x, start.y, start.z, end.x, end.y, end.z]),
			new LineBasicMaterial({ color: guide.color, depthTest: false })
		);
		line.frustumCulled = false;
		line.renderOrder = 20;
		group.add(line);
	}
	return group;
}

/** Clip points, the path through them, and guides through the first. */
export function clipMarks(points: readonly BrushVec3[]): Object3D | null {
	const [first] = points;
	if (!first) return null;
	const group = new Group();
	group.add(vertexHighlight(points, SELECTION_COLOR));
	const segments: Array<[BrushVec3, BrushVec3]> = [];
	for (let index = 1; index < points.length; index += 1) {
		segments.push([points[index - 1]!, points[index]!]);
	}
	if (segments.length > 0) group.add(edgeHighlight(segments, SELECTION_COLOR));
	group.add(axisGuides(first));
	return group;
}

/** A hover or selection mark for one element from its corners. */
export function elementMark(
	kind: LevelElementRef['kind'],
	corners: readonly BrushVec3[],
	color: number,
	opacity: number
): Object3D | null {
	if (kind === 'face') return faceHighlight(corners, color, opacity);
	if (kind === 'edge' && corners.length === 2)
		return edgeHighlight([[corners[0]!, corners[1]!]], color);
	if (kind === 'vertex' && corners.length > 0) return vertexHighlight(corners, color);
	return null;
}

/** Tinted faces, bright edges, and vertex markers for selected elements. */
export function elementSelection(
	elements: readonly LevelElementRef[],
	planesOf: (brushId: string) => readonly BrushPlane[] | undefined
): Object3D | null {
	const group = new Group();
	const edges: Array<[BrushVec3, BrushVec3]> = [];
	const vertices: BrushVec3[] = [];
	for (const ref of elements) {
		const planes = planesOf(ref.brushId);
		const corners = planes
			? elementPositions(planes, { kind: ref.kind, planes: ref.planes })
			: null;
		if (!corners) continue;
		if (ref.kind === 'face') {
			const face = faceHighlight(corners, SELECTION_COLOR, 0.35);
			if (face) group.add(face);
		} else if (ref.kind === 'edge' && corners.length === 2) {
			edges.push([corners[0]!, corners[1]!]);
		} else if (ref.kind === 'vertex' && corners[0]) {
			vertices.push(corners[0]);
		}
	}
	if (edges.length > 0) group.add(edgeHighlight(edges, SELECTION_COLOR));
	if (vertices.length > 0) group.add(vertexHighlight(vertices, SELECTION_COLOR));
	return group.children.length > 0 ? group : null;
}
