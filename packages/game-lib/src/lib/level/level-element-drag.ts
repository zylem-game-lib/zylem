/**
 * Pointer drags on the parts of solids.
 *
 * Face push and pull along the normal, face extrude, vertex and edge moves,
 * and face shear. Each starts from the document's planes, previews through
 * the kernel the editor applies, keeps the last step the kernel accepted, and
 * ends as one gesture. A drag that changed nothing ends as `null`, which the
 * session reads as a click.
 */

import {
	extrudeFace,
	moveElementsBy,
	moveFaces,
	shearFaces,
	type BrushPlane,
	type BrushVec3,
	type LevelElementRef,
	type LevelGesture,
} from '@zylem/bridge';
import {
	cleanVec,
	rayHitPlane,
	snapPoint,
	snapValue,
	type AxisDrag,
	type DrawRay,
} from './level-draw';
import { copyElement } from './level-pick';

export interface DragPreview {
	/** Solids drawn from these planes in place of the document's. */
	solids: Map<string, BrushPlane[]>;
	/** Solids the gesture would add. */
	added: BrushPlane[][];
}

export interface ElementDrag {
	/** Follow the pointer. Alt turns a face drag into an extrude. */
	update(ray: DrawRay, input: { altKey?: boolean }): void;
	/** The last preview the kernel accepted, or `null` while nothing has changed. */
	preview(): DragPreview | null;
	/** The gesture to publish, or `null` when the drag changed nothing. */
	finish(): LevelGesture | null;
}

/** Start planes of the solids a drag touches, by id. */
export type DragSolids = ReadonlyMap<string, readonly BrushPlane[]>;

const ZERO: BrushVec3 = Object.freeze({ x: 0, y: 0, z: 0 });

function sub(a: BrushVec3, b: BrushVec3): BrushVec3 {
	return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function add(a: BrushVec3, b: BrushVec3): BrushVec3 {
	return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function dot(a: BrushVec3, b: BrushVec3): number {
	return a.x * b.x + a.y * b.y + a.z * b.z;
}

/** `value` with its part along `normal` removed. */
function inPlane(value: BrushVec3, normal: BrushVec3): BrushVec3 {
	const squared = dot(normal, normal);
	if (squared < 1e-24) return value;
	const along = dot(value, normal) / squared;
	return cleanVec({
		x: value.x - normal.x * along,
		y: value.y - normal.y * along,
		z: value.z - normal.z * along,
	});
}

function isZero(value: BrushVec3): boolean {
	return Math.hypot(value.x, value.y, value.z) < 1e-9;
}

function sameVec(a: BrushVec3, b: BrushVec3): boolean {
	return a.x === b.x && a.y === b.y && a.z === b.z;
}

function finite(value: BrushVec3): boolean {
	return Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z);
}

/** Refs grouped by owning solid, in first-seen order. */
export function refsByBrush(refs: readonly LevelElementRef[]): Map<string, LevelElementRef[]> {
	const groups = new Map<string, LevelElementRef[]>();
	for (const ref of refs) {
		const group = groups.get(ref.brushId);
		if (group) group.push(ref);
		else groups.set(ref.brushId, [ref]);
	}
	return groups;
}

/** A kernel step, or `undefined` when it refused or threw. */
function attempt<T>(step: () => T | null | undefined): T | undefined {
	try {
		return step() ?? undefined;
	} catch {
		return undefined;
	}
}

/**
 * Push or pull faces along their normals, or extrude them with Alt.
 *
 * The distance is read along the pressed face's normal and every face moves
 * by it along its own.
 */
export class FaceDrag implements ElementDrag {
	private distance = 0;
	private extrude: boolean;
	private shown: DragPreview | null = null;
	private readonly groups: Map<string, LevelElementRef[]>;

	constructor(
		private readonly faces: readonly LevelElementRef[],
		private readonly solids: DragSolids,
		private readonly measure: AxisDrag,
		private readonly step: number,
		extrude: boolean
	) {
		this.extrude = extrude;
		this.groups = refsByBrush(faces);
	}

	update(ray: DrawRay, input: { altKey?: boolean }): void {
		const travel = this.measure.measure(ray);
		if (travel === null || !Number.isFinite(travel)) return;
		const distance = snapValue(travel, this.step);
		const extrude = input.altKey === true;
		if (distance === this.distance && extrude === this.extrude) return;
		const preview = distance === 0 ? null : this.build(distance, extrude);
		if (preview === undefined) return;
		this.distance = distance;
		this.extrude = extrude;
		this.shown = preview;
	}

	preview(): DragPreview | null {
		return this.shown;
	}

	finish(): LevelGesture | null {
		if (this.distance === 0) return null;
		return {
			kind: this.extrude ? 'face-extrude' : 'face-move',
			faces: this.faces.map(copyElement),
			distance: this.distance,
		};
	}

	private build(distance: number, extrude: boolean): DragPreview | undefined {
		if (extrude) {
			const added: BrushPlane[][] = [];
			for (const face of this.faces) {
				const planes = this.solids.get(face.brushId);
				const swept = planes && attempt(() => extrudeFace(planes, face.planes[0] ?? -1, distance));
				if (!swept) return undefined;
				added.push(swept);
			}
			return { solids: new Map(), added };
		}
		const solids = new Map<string, BrushPlane[]>();
		for (const [brushId, refs] of this.groups) {
			const planes = this.solids.get(brushId);
			const moved =
				planes &&
				attempt(() =>
					moveFaces(
						planes,
						refs.map((ref) => ref.planes[0] ?? -1),
						distance
					)
				);
			if (!moved) return undefined;
			solids.set(brushId, moved);
		}
		return { solids, added: [] };
	}
}

/**
 * Move vertices or edges in a plane through the grabbed point.
 *
 * A lone vertex lands on grid points; anything else moves by whole grid
 * steps, so parts that start on the grid stay on it.
 */
export class ElementMoveDrag implements ElementDrag {
	private delta: BrushVec3 = ZERO;
	private shown: DragPreview | null = null;
	private readonly groups: Map<string, LevelElementRef[]>;

	/**
	 * @param plane The plane the pointer moves on, through `grabbed`.
	 * @param snapTo The lone vertex being moved, which snaps to grid points.
	 */
	constructor(
		private readonly elements: readonly LevelElementRef[],
		private readonly solids: DragSolids,
		private readonly plane: BrushPlane,
		private readonly grabbed: BrushVec3,
		private readonly snapTo: BrushVec3 | null,
		private readonly step: number
	) {
		this.groups = refsByBrush(elements);
	}

	update(ray: DrawRay): void {
		const hit = rayHitPlane(ray, this.plane.normal, this.plane.distance);
		if (!hit) return;
		const delta = this.snapped(sub(hit, this.grabbed));
		if (!finite(delta) || sameVec(delta, this.delta)) return;
		const preview = isZero(delta) ? null : this.build(delta);
		if (preview === undefined) return;
		this.delta = delta;
		this.shown = preview;
	}

	preview(): DragPreview | null {
		return this.shown;
	}

	finish(): LevelGesture | null {
		if (isZero(this.delta)) return null;
		return {
			kind: 'element-move',
			elements: this.elements.map(copyElement),
			delta: { ...this.delta },
		};
	}

	private snapped(raw: BrushVec3): BrushVec3 {
		const delta = this.snapTo
			? sub(snapPoint(add(this.snapTo, raw), this.step), this.snapTo)
			: snapPoint(raw, this.step);
		return inPlane(delta, this.plane.normal);
	}

	private build(delta: BrushVec3): DragPreview | undefined {
		const solids = new Map<string, BrushPlane[]>();
		for (const [brushId, refs] of this.groups) {
			const planes = this.solids.get(brushId);
			const moved =
				planes &&
				attempt(() =>
					moveElementsBy(
						planes,
						refs.map((ref) => ({ key: { kind: ref.kind, planes: ref.planes }, delta }))
					)
				);
			if (!moved) return undefined;
			solids.set(brushId, moved.planes);
		}
		return { solids, added: [] };
	}
}

/** Slide faces within their own planes; the pointer moves on the pressed face's plane. */
export class ShearDrag implements ElementDrag {
	private delta: BrushVec3 = ZERO;
	private shown: DragPreview | null = null;
	private readonly groups: Map<string, LevelElementRef[]>;

	constructor(
		private readonly faces: readonly LevelElementRef[],
		private readonly solids: DragSolids,
		private readonly plane: BrushPlane,
		private readonly grabbed: BrushVec3,
		private readonly step: number
	) {
		this.groups = refsByBrush(faces);
	}

	update(ray: DrawRay): void {
		const hit = rayHitPlane(ray, this.plane.normal, this.plane.distance);
		if (!hit) return;
		const delta = cleanVec(snapPoint(sub(hit, this.grabbed), this.step));
		if (!finite(delta) || sameVec(delta, this.delta)) return;
		const preview = this.slides(delta) ? this.build(delta) : null;
		if (preview === undefined) return;
		this.delta = delta;
		this.shown = preview;
	}

	preview(): DragPreview | null {
		return this.shown;
	}

	finish(): LevelGesture | null {
		if (!this.slides(this.delta)) return null;
		return { kind: 'shear', faces: this.faces.map(copyElement), delta: { ...this.delta } };
	}

	private slides(delta: BrushVec3): boolean {
		return !isZero(inPlane(delta, this.plane.normal));
	}

	private build(delta: BrushVec3): DragPreview | undefined {
		const solids = new Map<string, BrushPlane[]>();
		for (const [brushId, refs] of this.groups) {
			const planes = this.solids.get(brushId);
			const sheared =
				planes &&
				attempt(() =>
					shearFaces(
						planes,
						refs.map((ref) => ref.planes[0] ?? -1),
						delta
					)
				);
			if (!sheared) return undefined;
			solids.set(brushId, sheared.planes);
		}
		return { solids, added: [] };
	}
}
