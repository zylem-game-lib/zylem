/**
 * Picking in the edit preview.
 *
 * Objects and faces are what a raycast hits; a face is its triangle mapped to
 * a plane. Edges and vertices are picked on screen, a few pixels around the
 * pointer, nearest first, a near tie going to the one in front, and one a
 * solid hides from the camera is passed over.
 */

import {
	Raycaster,
	Vector2,
	Vector3,
	type BufferGeometry,
	type Camera,
	type Mesh,
	type Object3D,
} from 'three';
import type {
	BrushPlane,
	BrushTopology,
	BrushVec3,
	LevelElementMode,
	LevelElementRef,
} from '@zylem/bridge';
import type { GizmoRay } from '../debug/transform-gizmo';
import type { DrawRay } from './level-draw';

/** How far from an edge the pointer may be, in CSS pixels. */
export const EDGE_PICK_PIXELS = 8;
/** How far from a vertex the pointer may be, in CSS pixels. */
export const VERTEX_PICK_PIXELS = 10;
/** Two presses this close in time and space are a double-click. */
export const DOUBLE_CLICK_MS = 400;
export const DOUBLE_CLICK_PIXELS = 6;

/** Candidates closer together than this many pixels are told apart by depth. */
const SCREEN_TIE_PIXELS = 1.5;
/** A line of sight may stop this much short of a point, relative to its length, and still see it. */
const SIGHT_TOLERANCE = 1e-3;

export interface ScreenPoint {
	/** CSS pixels from the left. */
	x: number;
	/** CSS pixels from the top. */
	y: number;
	/** Distance in front of the camera along its view axis. */
	depth: number;
}

/** World to screen, for one camera and viewport. */
export interface ScreenProjector {
	/** `null` behind a perspective camera. */
	project(point: BrushVec3): ScreenPoint | null;
	/** Distance in front of the camera along its view axis, behind or not. */
	depthOf(point: BrushVec3): number;
	/** Nearest depth a perspective camera can see; `-Infinity` for orthographic ones. */
	readonly nearDepth: number;
	/** Perspective division bends screen-space interpolation. */
	readonly perspective: boolean;
}

/** One solid's compiled topology. */
export interface PickSolid {
	id: string;
	topology: BrushTopology;
}

export interface ScreenCandidate<T> {
	item: T;
	/** Pixels from the pointer. */
	distance: number;
	/** View depth of `point`. */
	depth: number;
	/** World position on the element nearest the pointer. */
	point: BrushVec3;
}

export interface VertexPick {
	brushId: string;
	/** Index into the topology's vertices. */
	index: number;
}

export interface EdgePick {
	brushId: string;
	/** Index into the topology's edges. */
	index: number;
}

export interface ClickStamp {
	/** Milliseconds. */
	time: number;
	x: number;
	y: number;
}

/** A solid in the edit preview. */
export interface PickableSolid {
	planes: BrushPlane[];
	topology: BrushTopology;
	mesh: Mesh;
}

export interface PickedFace {
	ref: LevelElementRef;
	plane: BrushPlane;
	point: BrushVec3;
}

export interface PickedElement {
	ref: LevelElementRef;
	/** World point on the element under the pointer. */
	point: BrushVec3;
	/** A face's ring, an edge's ends, or the vertex. */
	corners: BrushVec3[];
}

/** The camera and canvas picking reads, fetched per pick. */
export interface PickView {
	camera(): Camera | null;
	viewport(): { width: number; height: number } | null;
}

const _point = new Vector3();

/** A projector for `camera` drawn into a `width` × `height` CSS-pixel viewport. */
export function cameraProjector(
	camera: Camera,
	viewport: { width: number; height: number }
): ScreenProjector {
	camera.updateMatrixWorld();
	const perspective = (camera as { isPerspectiveCamera?: boolean }).isPerspectiveCamera === true;
	const near = perspective ? ((camera as { near?: number }).near ?? 0.1) : -Infinity;
	const depthOf = (point: BrushVec3) =>
		-_point.set(point.x, point.y, point.z).applyMatrix4(camera.matrixWorldInverse).z;
	return {
		perspective,
		nearDepth: near,
		depthOf,
		project(point) {
			const depth = depthOf(point);
			if (perspective && depth < near) return null;
			_point.set(point.x, point.y, point.z).project(camera);
			return {
				x: ((_point.x + 1) / 2) * viewport.width,
				y: ((1 - _point.y) / 2) * viewport.height,
				depth,
			};
		},
	};
}

/** The pointer's pixel for a ray from the camera. */
export function pointerOnScreen(
	projector: ScreenProjector,
	ray: DrawRay
): { x: number; y: number } | null {
	const along = Math.max(1, projector.nearDepth * 4);
	const ahead = {
		x: ray.origin.x + ray.direction.x * along,
		y: ray.origin.y + ray.direction.y * along,
		z: ray.origin.z + ray.direction.z * along,
	};
	const screen = projector.project(ahead);
	return screen ? { x: screen.x, y: screen.y } : null;
}

/** The plane index of a triangle in a brush mesh, as `brushGeometry` records it. */
export function trianglePlane(
	geometry: BufferGeometry,
	faceIndex: number | null | undefined
): number | null {
	const planes = geometry.userData.trianglePlanes as readonly number[] | undefined;
	if (!planes || typeof faceIndex !== 'number') return null;
	return planes[faceIndex] ?? null;
}

/** Pixel distance from `p` to the segment `ab`, and how far along it the nearest point lies. */
export function segmentDistance(
	p: { x: number; y: number },
	a: { x: number; y: number },
	b: { x: number; y: number }
): { distance: number; t: number } {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const span = dx * dx + dy * dy;
	const t =
		span < 1e-12 ? 0 : Math.min(1, Math.max(0, ((p.x - a.x) * dx + (p.y - a.y) * dy) / span));
	return { distance: Math.hypot(a.x + dx * t - p.x, a.y + dy * t - p.y), t };
}

/** Nearest first; within a pixel or so of each other, the one in front first. */
export function rankCandidates<T>(candidates: ScreenCandidate<T>[]): ScreenCandidate<T>[] {
	return [...candidates].sort((a, b) => {
		if (Math.abs(a.distance - b.distance) > SCREEN_TIE_PIXELS) return a.distance - b.distance;
		return a.depth - b.depth;
	});
}

/** Vertices within `threshold` pixels of the pointer, ranked. */
export function vertexCandidates(
	pointer: { x: number; y: number },
	solids: Iterable<PickSolid>,
	projector: ScreenProjector,
	threshold = VERTEX_PICK_PIXELS
): ScreenCandidate<VertexPick>[] {
	const found: ScreenCandidate<VertexPick>[] = [];
	for (const solid of solids) {
		solid.topology.vertices.forEach((vertex, index) => {
			const screen = projector.project(vertex);
			if (!screen) return;
			const distance = Math.hypot(screen.x - pointer.x, screen.y - pointer.y);
			if (distance > threshold) return;
			found.push({
				item: { brushId: solid.id, index },
				distance,
				depth: screen.depth,
				point: vertex,
			});
		});
	}
	return rankCandidates(found);
}

function lerp(a: BrushVec3, b: BrushVec3, t: number): BrushVec3 {
	return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
}

/** The part of `ab` in front of a perspective camera's near plane, or `null` when none is. */
function visibleSpan(
	a: BrushVec3,
	b: BrushVec3,
	projector: ScreenProjector
): [BrushVec3, BrushVec3] | null {
	if (!projector.perspective) return [a, b];
	const limit = projector.nearDepth * 1.001;
	const da = projector.depthOf(a);
	const db = projector.depthOf(b);
	if (da < limit && db < limit) return null;
	if (da >= limit && db >= limit) return [a, b];
	const cut = lerp(a, b, (limit - da) / (db - da));
	return da < limit ? [cut, b] : [a, cut];
}

/** Where along a world segment the point at screen fraction `t` sits. */
function worldFraction(t: number, depthA: number, depthB: number, perspective: boolean): number {
	if (!perspective) return t;
	const denominator = (1 - t) * depthB + t * depthA;
	return Math.abs(denominator) < 1e-12 ? t : (t * depthA) / denominator;
}

/** Edges within `threshold` pixels of the pointer, ranked. */
export function edgeCandidates(
	pointer: { x: number; y: number },
	solids: Iterable<PickSolid>,
	projector: ScreenProjector,
	threshold = EDGE_PICK_PIXELS
): ScreenCandidate<EdgePick>[] {
	const found: ScreenCandidate<EdgePick>[] = [];
	for (const solid of solids) {
		const { vertices, edges } = solid.topology;
		edges.forEach((edge, index) => {
			const span = visibleSpan(vertices[edge.vertices[0]]!, vertices[edge.vertices[1]]!, projector);
			if (!span) return;
			const a = projector.project(span[0]);
			const b = projector.project(span[1]);
			if (!a || !b) return;
			const { distance, t } = segmentDistance(pointer, a, b);
			if (distance > threshold) return;
			const point = lerp(
				span[0],
				span[1],
				worldFraction(t, a.depth, b.depth, projector.perspective)
			);
			found.push({
				item: { brushId: solid.id, index },
				distance,
				depth: projector.depthOf(point),
				point,
			});
		});
	}
	return rankCandidates(found);
}

/** Whether `next` completes a double-click begun by `previous`. */
export function isDoubleClick(
	previous: ClickStamp | null,
	next: ClickStamp,
	ms = DOUBLE_CLICK_MS,
	pixels = DOUBLE_CLICK_PIXELS
): boolean {
	if (!previous) return false;
	const elapsed = next.time - previous.time;
	if (!(elapsed >= 0 && elapsed <= ms)) return false;
	return Math.hypot(next.x - previous.x, next.y - previous.y) <= pixels;
}

export function sameElement(a: LevelElementRef, b: LevelElementRef): boolean {
	return (
		a.brushId === b.brushId &&
		a.kind === b.kind &&
		a.planes.length === b.planes.length &&
		a.planes.every((plane, index) => plane === b.planes[index])
	);
}

export function copyElement(ref: LevelElementRef): LevelElementRef {
	return { brushId: ref.brushId, kind: ref.kind, planes: [...ref.planes] };
}

function toDrawRay(ray: GizmoRay): DrawRay {
	return {
		origin: { x: ray.origin.x, y: ray.origin.y, z: ray.origin.z },
		direction: { x: ray.direction.x, y: ray.direction.y, z: ray.direction.z },
	};
}

/** Whether the object and every parent are visible. */
function isShown(object: Object3D): boolean {
	for (let node: Object3D | null = object; node; node = node.parent) {
		if (!node.visible) return false;
	}
	return true;
}

function levelIdOf(object: Object3D): string | null {
	for (let node: Object3D | null = object; node; node = node.parent) {
		const id = node.userData.levelId;
		if (typeof id === 'string') return id;
	}
	return null;
}

/**
 * Picks against the edit preview's solids and objects. The maps are read live,
 * and a hidden solid (one a drag stands in for) is passed over.
 */
export class LevelPicker {
	private readonly raycaster = new Raycaster();

	constructor(
		private readonly solids: ReadonlyMap<string, PickableSolid>,
		private readonly objects: ReadonlyMap<string, Object3D>,
		private readonly view: PickView
	) {}

	projector(): ScreenProjector | null {
		const camera = this.view.camera();
		const viewport = this.view.viewport();
		return camera && viewport ? cameraProjector(camera, viewport) : null;
	}

	/** The pointer's pixel for a ray, or `null` without a camera. */
	screenOf(ray: GizmoRay): { x: number; y: number } | null {
		const projector = this.projector();
		return projector ? pointerOnScreen(projector, toDrawRay(ray)) : null;
	}

	/** The solid, doodad, or entity under the pointer. */
	object(ray: GizmoRay): string | null {
		this.raycaster.set(ray.origin, ray.direction);
		const pickables: Object3D[] = [...this.visibleMeshes(), ...this.objects.values()];
		for (const hit of this.raycaster.intersectObjects(pickables, true)) {
			if (!isShown(hit.object)) continue;
			const id = levelIdOf(hit.object);
			if (id) return id;
		}
		return null;
	}

	face(ray: GizmoRay): PickedFace | null {
		this.raycaster.set(ray.origin, ray.direction);
		const hit = this.raycaster.intersectObjects(this.visibleMeshes(), false)[0];
		if (!hit) return null;
		const id = levelIdOf(hit.object);
		const solid = id ? this.solids.get(id) : undefined;
		const planeIndex = trianglePlane((hit.object as Mesh).geometry, hit.faceIndex);
		const plane = planeIndex === null ? undefined : solid?.planes[planeIndex];
		if (!id || planeIndex === null || !plane) return null;
		return {
			ref: { brushId: id, kind: 'face', planes: [planeIndex] },
			plane,
			point: { x: hit.point.x, y: hit.point.y, z: hit.point.z },
		};
	}

	/** The part of a solid under the pointer in an element mode. */
	element(ray: GizmoRay, mode: Exclude<LevelElementMode, 'object'>): PickedElement | null {
		if (mode === 'face') {
			const face = this.face(ray);
			const topology = face ? this.solids.get(face.ref.brushId)?.topology : undefined;
			if (!face || !topology) return null;
			const ring = topology.faces.find((entry) => entry.planeIndex === face.ref.planes[0]);
			return {
				ref: face.ref,
				point: face.point,
				corners: ring ? ring.indices.map((index) => topology.vertices[index]!) : [],
			};
		}
		const projector = this.projector();
		const pointer = projector ? pointerOnScreen(projector, toDrawRay(ray)) : null;
		if (!projector || !pointer) return null;
		const shown: PickSolid[] = [];
		for (const [id, solid] of this.solids) {
			if (solid.mesh.visible) shown.push({ id, topology: solid.topology });
		}

		if (mode === 'vertex') {
			for (const candidate of vertexCandidates(pointer, shown, projector)) {
				const planes = this.solids.get(candidate.item.brushId)?.topology.vertexPlanes[
					candidate.item.index
				];
				if (!planes || !this.inSight(candidate.point)) continue;
				return {
					ref: { brushId: candidate.item.brushId, kind: 'vertex', planes: [...planes] },
					point: candidate.point,
					corners: [candidate.point],
				};
			}
			return null;
		}
		for (const candidate of edgeCandidates(pointer, shown, projector)) {
			const topology = this.solids.get(candidate.item.brushId)?.topology;
			const edge = topology?.edges[candidate.item.index];
			if (!topology || !edge || !this.inSight(candidate.point)) continue;
			return {
				ref: { brushId: candidate.item.brushId, kind: 'edge', planes: [...edge.planes] },
				point: candidate.point,
				corners: [topology.vertices[edge.vertices[0]]!, topology.vertices[edge.vertices[1]]!],
			};
		}
		return null;
	}

	/** Whether the camera sees `point`, rather than a solid in front of it. */
	private inSight(point: BrushVec3): boolean {
		const camera = this.view.camera();
		if (!camera) return true;
		const target = new Vector3(point.x, point.y, point.z);
		const screen = target.clone().project(camera);
		this.raycaster.setFromCamera(new Vector2(screen.x, screen.y), camera);
		const { origin, direction } = this.raycaster.ray;
		const along = target.sub(origin).dot(direction);
		const hit = this.raycaster.intersectObjects(this.visibleMeshes(), false)[0];
		return !hit || hit.distance >= along - SIGHT_TOLERANCE * Math.max(1, Math.abs(along));
	}

	private visibleMeshes(): Mesh[] {
		const meshes: Mesh[] = [];
		for (const solid of this.solids.values()) if (solid.mesh.visible) meshes.push(solid.mesh);
		return meshes;
	}
}
