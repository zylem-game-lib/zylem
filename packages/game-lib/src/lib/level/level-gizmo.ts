/**
 * The transform gizmo on a level selection.
 *
 * Drives the stage's `TransformGizmo` as the entity tool does, but on
 * document objects: whole solids, doodad and entity poses, or a solid's
 * elements. Previews run through the kernel the editor applies, so a drag
 * shows what its gesture commits. Snapping follows the snap settings, and Alt
 * drags freely, as it does for entities.
 */

import { Euler, Quaternion, Vector3, type Camera, type Object3D } from 'three';
import {
	brushCenter,
	elementPositions,
	moveElements,
	rotateBrush,
	scaleBrush,
	translateBrush,
	type BridgePose,
	type BrushPlane,
	type BrushVec3,
	type LevelDocument,
	type LevelElementRef,
	type LevelGesture,
	type LevelSyncPayload,
	type LevelTransform,
} from '@zylem/bridge';
import { getSnapSettings } from '../debug/debug-state';
import {
	TransformGizmo,
	type GizmoDelta,
	type GizmoMode,
	type GizmoRay,
} from '../debug/transform-gizmo';
import { snapPoint, snapValue } from './level-draw';
import { refsByBrush } from './level-element-drag';
import { copyElement } from './level-pick';

/** A pose as the preview writes it onto a visual. */
export interface PreviewPose {
	position: BrushVec3;
	quaternion: { x: number; y: number; z: number; w: number };
	scale: BrushVec3;
}

export interface GizmoTarget {
	pivot: BrushVec3;
	/** Solids that move whole: the object selection, or the owners of selected elements. */
	solids: Map<string, BrushPlane[]>;
	/** Doodads and entities. Markers keep their size, so `scales` is false for them. */
	poses: Map<string, { pose: PreviewPose; scales: boolean }>;
	/** Selected elements. A translate moves these instead of whole solids. */
	elements: LevelElementRef[];
}

export interface GizmoPreview {
	solids: Map<string, BrushPlane[]>;
	poses: Map<string, PreviewPose>;
}

interface GizmoDrag {
	target: GizmoTarget;
	/** The last transform the kernel accepted. */
	transform: LevelTransform | null;
	preview: GizmoPreview | null;
}

/** Smallest scale factor a freeform drag may reach. */
const MIN_SCALE = 1e-3;

function centroid(points: readonly BrushVec3[]): BrushVec3 {
	const sum = points.reduce(
		(acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y, z: acc.z + point.z }),
		{ x: 0, y: 0, z: 0 }
	);
	return { x: sum.x / points.length, y: sum.y / points.length, z: sum.z / points.length };
}

/** A doodad's or entity's pose in the document. */
export function documentPose(document: LevelDocument, id: string): BridgePose | null {
	return (
		document.doodads.find((doodad) => doodad.id === id)?.pose ??
		document.entities.find((entity) => entity.id === id)?.pose ??
		null
	);
}

/** A document pose with every part filled in: a quaternion for rotation, and unit scale when absent. */
export function previewPose(pose: BridgePose): PreviewPose {
	const position = pose.position ?? { x: 0, y: 0, z: 0 };
	const rotation = pose.rotation ?? { x: 0, y: 0, z: 0 };
	const quaternion =
		pose.quaternion ?? new Quaternion().setFromEuler(new Euler(rotation.x, rotation.y, rotation.z));
	return {
		position: { ...position },
		quaternion: { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w },
		scale: { ...(pose.scale ?? { x: 1, y: 1, z: 1 }) },
	};
}

/**
 * What the gizmo moves. In object mode, the selected solids, doodads, and
 * entities; in an element mode, the selected elements and their solids.
 * Only what the edit preview shows (`solids`, `objects`) takes part.
 */
export function gizmoTarget(
	payload: LevelSyncPayload,
	solids: ReadonlyMap<string, { planes: BrushPlane[] }>,
	objects: ReadonlyMap<string, unknown>,
	pivot: BrushVec3
): GizmoTarget | null {
	const target: GizmoTarget = { pivot, solids: new Map(), poses: new Map(), elements: [] };
	if ((payload.elementMode ?? 'object') === 'object') {
		for (const id of payload.selectedIds) {
			const solid = solids.get(id);
			if (solid) {
				target.solids.set(id, solid.planes);
				continue;
			}
			const pose = objects.has(id) ? documentPose(payload.document, id) : null;
			if (!pose) continue;
			const marker = payload.document.entities.find((entity) => entity.id === id);
			target.poses.set(id, {
				pose: previewPose(pose),
				scales: !marker || marker.typeId === 'zone',
			});
		}
	} else {
		for (const ref of payload.elements ?? []) {
			const solid = solids.get(ref.brushId);
			if (!solid) continue;
			target.solids.set(ref.brushId, solid.planes);
			target.elements.push(ref);
		}
	}
	return target.solids.size > 0 || target.poses.size > 0 ? target : null;
}

/**
 * Where the gizmo sits: the centroid of solid centres and object positions,
 * or of element centres in an element mode.
 */
export function selectionPivot(
	payload: LevelSyncPayload,
	solids: ReadonlyMap<string, { planes: BrushPlane[] }>,
	objects: ReadonlyMap<string, unknown>
): BrushVec3 | null {
	const points: BrushVec3[] = [];
	if ((payload.elementMode ?? 'object') === 'object') {
		for (const id of payload.selectedIds) {
			const solid = solids.get(id);
			const center = solid ? brushCenter(solid.planes) : null;
			if (center) points.push(center);
			else if (objects.has(id))
				points.push(documentPose(payload.document, id)?.position ?? { x: 0, y: 0, z: 0 });
		}
	} else {
		for (const ref of payload.elements ?? []) {
			const solid = solids.get(ref.brushId);
			const corners = solid
				? elementPositions(solid.planes, { kind: ref.kind, planes: ref.planes })
				: null;
			if (corners && corners.length > 0) points.push(centroid(corners));
		}
	}
	return points.length > 0 ? centroid(points) : null;
}

function isIdentity(transform: LevelTransform): boolean {
	switch (transform.kind) {
		case 'translate':
			return transform.delta.x === 0 && transform.delta.y === 0 && transform.delta.z === 0;
		case 'rotate':
			return transform.angle === 0;
		case 'scale':
			return transform.factor.x === 1 && transform.factor.y === 1 && transform.factor.z === 1;
	}
}

function transformPlanes(
	planes: readonly BrushPlane[],
	transform: LevelTransform
): BrushPlane[] | null {
	switch (transform.kind) {
		case 'translate':
			return translateBrush(planes, transform.delta);
		case 'rotate':
			return rotateBrush(planes, transform.axis, transform.angle, transform.pivot);
		case 'scale':
			return scaleBrush(planes, transform.factor, transform.pivot);
	}
}

/** The pose the editor will write for this transform. */
function transformPose(pose: PreviewPose, transform: LevelTransform, scales: boolean): PreviewPose {
	const position = new Vector3(pose.position.x, pose.position.y, pose.position.z);
	const quaternion = new Quaternion(
		pose.quaternion.x,
		pose.quaternion.y,
		pose.quaternion.z,
		pose.quaternion.w
	);
	const scale = { ...pose.scale };
	switch (transform.kind) {
		case 'translate':
			position.add(new Vector3(transform.delta.x, transform.delta.y, transform.delta.z));
			break;
		case 'rotate': {
			const pivot = new Vector3(transform.pivot.x, transform.pivot.y, transform.pivot.z);
			const turn = new Quaternion().setFromAxisAngle(
				new Vector3(transform.axis.x, transform.axis.y, transform.axis.z).normalize(),
				transform.angle
			);
			position.sub(pivot).applyQuaternion(turn).add(pivot);
			quaternion.premultiply(turn);
			break;
		}
		case 'scale': {
			const { factor, pivot } = transform;
			position.set(
				pivot.x + (position.x - pivot.x) * factor.x,
				pivot.y + (position.y - pivot.y) * factor.y,
				pivot.z + (position.z - pivot.z) * factor.z
			);
			if (scales) {
				scale.x *= factor.x;
				scale.y *= factor.y;
				scale.z *= factor.z;
			}
			break;
		}
	}
	return {
		position: { x: position.x, y: position.y, z: position.z },
		quaternion: { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w },
		scale,
	};
}

/** The planes and poses a transform gives the target, or `null` when the kernel refuses a solid. */
function buildPreview(target: GizmoTarget, transform: LevelTransform): GizmoPreview | null {
	const solids = new Map<string, BrushPlane[]>();
	if (transform.kind === 'translate' && target.elements.length > 0) {
		for (const [brushId, refs] of refsByBrush(target.elements)) {
			const planes = target.solids.get(brushId);
			const moved = planes
				? moveElements(
						planes,
						refs.map((ref) => ({ kind: ref.kind, planes: ref.planes })),
						transform.delta
					)
				: null;
			if (!moved) return null;
			solids.set(brushId, moved.planes);
		}
		return { solids, poses: new Map() };
	}
	for (const [id, planes] of target.solids) {
		const next = transformPlanes(planes, transform);
		if (!next) return null;
		solids.set(id, next);
	}
	const poses = new Map<string, PreviewPose>();
	for (const [id, entry] of target.poses) {
		poses.set(id, transformPose(entry.pose, transform, entry.scales));
	}
	return { solids, poses };
}

function snapFactor(value: number, step: number): number {
	if (value === 1 || !(step > 0)) return Math.max(value, MIN_SCALE);
	return Math.max(snapValue(value, step), step);
}

export class LevelGizmo {
	private readonly gizmo = new TransformGizmo();
	private drag: GizmoDrag | null = null;

	get root(): Object3D {
		return this.gizmo.root;
	}

	get visible(): boolean {
		return this.gizmo.visible;
	}

	get isDragging(): boolean {
		return this.drag !== null;
	}

	/** Show in `mode` at `pivot`, or hide when either is missing. Held in place mid-drag. */
	place(mode: GizmoMode | null, pivot: BrushVec3 | null): void {
		if (this.drag) return;
		if (!mode || !pivot) {
			this.gizmo.hide();
			return;
		}
		this.gizmo.setMode(mode);
		this.gizmo.show(new Vector3(pivot.x, pivot.y, pivot.z));
		this.gizmo.root.updateMatrixWorld(true);
	}

	/** Keep the gizmo a constant size on screen. */
	update(camera: Camera): void {
		this.gizmo.update(camera);
		this.gizmo.root.updateMatrixWorld(true);
	}

	/** Highlight the handle under the pointer. Returns whether there is one. */
	hover(ray: GizmoRay | null): boolean {
		if (this.drag) return true;
		const axis = ray ? this.gizmo.pick(ray) : null;
		this.gizmo.setHighlight(axis);
		return axis !== null;
	}

	/** Grab the handle under the pointer. `false` when there is none or the view cannot drag it. */
	begin(ray: GizmoRay, camera: Camera, target: GizmoTarget): boolean {
		if (this.drag || !this.gizmo.visible) return false;
		const axis = this.gizmo.pick(ray);
		if (!axis || !this.gizmo.beginDrag(axis, ray, camera)) return false;
		this.drag = { target, transform: null, preview: null };
		return true;
	}

	/**
	 * Follow the pointer. Returns the last preview the kernel accepted.
	 *
	 * @param freeform Skip snapping (Alt), read per event like the entity gizmo.
	 */
	move(ray: GizmoRay, camera: Camera, freeform: boolean): GizmoPreview | null {
		const drag = this.drag;
		if (!drag) return null;
		const delta = this.gizmo.updateDrag(ray, camera);
		const transform = delta ? this.snapped(delta, drag.target.pivot, freeform) : null;
		if (!transform) return drag.preview;
		let preview: GizmoPreview | null = null;
		try {
			preview = buildPreview(drag.target, transform);
		} catch {
			preview = null;
		}
		if (preview) {
			drag.transform = transform;
			drag.preview = preview;
		}
		return drag.preview;
	}

	/** End the drag: the gesture to publish, or `null` when nothing moved. */
	end(): LevelGesture | null {
		const drag = this.drag;
		this.cancel();
		const transform = drag?.transform;
		if (!drag || !transform || isIdentity(transform)) return null;
		const { target } = drag;
		if (transform.kind === 'translate' && target.elements.length > 0) {
			return {
				kind: 'element-move',
				elements: target.elements.map(copyElement),
				delta: { ...transform.delta },
			};
		}
		const ids = [...target.solids.keys(), ...target.poses.keys()];
		return ids.length > 0 ? { kind: 'transform', ids, transform } : null;
	}

	/** Drop the drag without a gesture. */
	cancel(): void {
		this.drag = null;
		this.gizmo.endDrag();
	}

	dispose(): void {
		this.cancel();
		this.gizmo.dispose();
	}

	private snapped(delta: GizmoDelta, pivot: BrushVec3, freeform: boolean): LevelTransform | null {
		const snap = getSnapSettings();
		const snapping = snap.enabled && !freeform;
		switch (delta.kind) {
			case 'translate': {
				const offset = { x: delta.offset.x, y: delta.offset.y, z: delta.offset.z };
				return { kind: 'translate', delta: snapPoint(offset, snapping ? snap.translate : 0) };
			}
			case 'rotate': {
				const angle = snapValue(delta.angle, snapping ? snap.rotate : 0);
				if (!Number.isFinite(angle)) return null;
				return {
					kind: 'rotate',
					axis: { x: delta.axis.x, y: delta.axis.y, z: delta.axis.z },
					angle,
					pivot: { ...pivot },
				};
			}
			case 'scale': {
				const step = snapping ? snap.scale : 0;
				const factor = {
					x: snapFactor(delta.factor.x, step),
					y: snapFactor(delta.factor.y, step),
					z: snapFactor(delta.factor.z, step),
				};
				if (!Number.isFinite(factor.x + factor.y + factor.z)) return null;
				return { kind: 'scale', factor, pivot: { ...pivot } };
			}
		}
	}
}
