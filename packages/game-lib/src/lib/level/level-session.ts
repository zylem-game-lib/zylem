/**
 * The stage's picture of the level document.
 *
 * The editor owns the file. This session draws it, routes level pointer
 * gestures to the tools, reports what they finish, and on play swaps the
 * brush faces for one merged mesh and one static body of convex hulls per
 * sector. Nothing it creates is a normal stage entity except play-mode
 * trigger zones, and those are marked editor-owned so they are not published
 * back.
 */

import {
	Box3,
	Box3Helper,
	BoxGeometry,
	Color,
	DoubleSide,
	EdgesGeometry,
	Group,
	LineBasicMaterial,
	LineSegments,
	Mesh,
	MeshStandardMaterial,
	Object3D,
	OctahedronGeometry,
	Vector3,
	type Camera,
} from 'three';
import {
	DEFAULT_DRAW_SHAPE,
	brushCenter,
	brushTopology,
	clipBrush,
	deleteBrushElements,
	frameForPlane,
	primitiveBrushes,
	sectorSizeOf,
	type BridgePose,
	type BrushFrame,
	type BrushPlane,
	type BrushTopology,
	type BrushVec3,
	type LevelDocument,
	type LevelDrawShape,
	type LevelElementMode,
	type LevelElementRef,
	type LevelGesture,
	type LevelSelectPayload,
	type LevelSyncPayload,
} from '@zylem/bridge';
import { getDebugTool, getSnapSettings, isTransformTool } from '../debug/debug-state';
import { getEntityType } from '../entities/entity-registry';
import type { GizmoRay } from '../debug/transform-gizmo';
import { computePlacementPose, type PlacementHit } from '../stage/placement-geometry';
import { LevelClipTool } from './level-clip-tool';
import {
	AxisDrag,
	facingAxisPlane,
	fallbackDrawFrame,
	framePlane,
	rayHitPlane,
	snapOntoPlane,
	type DrawRay,
	type ViewBasis,
} from './level-draw';
import { LevelDrawTool } from './level-draw-tool';
import { ElementMoveDrag, FaceDrag, ShearDrag, type ElementDrag } from './level-element-drag';
import { brushGeometry } from './level-geometry';
import { LevelGizmo, documentPose, gizmoTarget, selectionPivot } from './level-gizmo';
import {
	HOVER_COLOR,
	OverlaySlot,
	axisGuides,
	clipMarks,
	disposeObject,
	drawGhost,
	edgeHighlight,
	elementMark,
	elementSelection,
	elementWire,
	topologyEdges,
} from './level-highlight';
import {
	LevelPicker,
	copyElement,
	isDoubleClick,
	sameElement,
	type ClickStamp,
	type PickedElement,
} from './level-pick';
import { buildPlaySectors } from './level-play';
import { buildSectorOverlay, solidSectorHidden, solidSectorTint } from './level-sectors';
import { LevelToolPreview } from './level-tool-preview';

export interface LevelZoneSpawn {
	name: string;
	position: BrushVec3;
	size: BrushVec3;
}

export interface LevelSessionHost {
	getScene(): { add(object: Object3D): void; remove(object: Object3D): void } | null;
	cameraId(): string | null;
	/** World direction the rendering camera looks. */
	viewDirection(): BrushVec3;
	/** The rendering camera, for the gizmo, on-screen picking, and screen-up measures. */
	camera(): Camera | null;
	/** The canvas in CSS pixels, for pixel thresholds. */
	viewport(): { width: number; height: number } | null;
	/** Physics hit under the pointer, for doodad and entity placement. */
	physicsHit(ray: GizmoRay): PlacementHit | null;
	spawnZone(zone: LevelZoneSpawn): Promise<string | null>;
	detach(uuid: string): void;
	/** One static body, one convex hull per buffer. Null when physics is unavailable. */
	spawnHulls(hulls: Float32Array[]): unknown | null;
	despawnHulls(handle: unknown): void;
	publishGesture(gesture: LevelGesture): void;
	publishSelect(payload: LevelSelectPayload): void;
	publishNotice(message: string): void;
}

/** What the session reads off a pointer event. A `PointerEvent` fits. */
export interface LevelPointerInput {
	shiftKey?: boolean;
	altKey?: boolean;
	/** Milliseconds, for telling a double-click. */
	timeStamp?: number;
}

/** Neutral stand-in. A solid stores no material, so nothing replaces this yet. */
const DEFAULT_BRUSH_COLOR = 0xc8c2b4;
/** Lighter than the default so a selected solid still reads as chosen. */
const SELECTED_BRUSH_COLOR = 0xe4ddd0;
/** The two halves of a clip preview. */
const CLIP_TINTS = ['#5aa9ff', '#ff9a5a'] as const;
/** A held press moves this many pixels before it counts as a drag. */
const DRAG_PIXELS = 4;

let activeDocument: LevelDocument | null = null;

/** The document currently previewed or playing, for hosts that spawn from markers. */
export function getActiveLevelDocument(): LevelDocument | null {
	return activeDocument;
}

function setActiveDocument(document: LevelDocument | null): void {
	activeDocument = document;
}

interface SolidView {
	planes: BrushPlane[];
	topology: BrushTopology;
	mesh: Mesh;
	/** Axis guides through a selected solid in object mode. */
	guides: Object3D | null;
}

/** The press the pointer holds, from down to up. */
type Held =
	| { kind: 'draw' }
	| {
			kind: 'drag';
			drag: ElementDrag | null;
			/** Published when the press ends without changing anything. */
			click: LevelSelectPayload;
			from: { x: number; y: number } | null;
			moved: boolean;
	  }
	| { kind: 'gizmo' }
	| { kind: 'press' };

function toDrawRay(ray: GizmoRay): DrawRay {
	return {
		origin: { x: ray.origin.x, y: ray.origin.y, z: ray.origin.z },
		direction: { x: ray.direction.x, y: ray.direction.y, z: ray.direction.z },
	};
}

function sizeOf(props: Record<string, unknown>, fallback: BrushVec3): BrushVec3 {
	const size = props.size as { x?: number; y?: number; z?: number } | undefined;
	return {
		x: size?.x ?? fallback.x,
		y: size?.y ?? fallback.y,
		z: size?.z ?? fallback.z,
	};
}

function unit(value: BrushVec3): BrushVec3 {
	const magnitude = Math.hypot(value.x, value.y, value.z) || 1;
	return { x: value.x / magnitude, y: value.y / magnitude, z: value.z / magnitude };
}

function cloneVisual(source: Object3D): Object3D {
	const cloned = source.clone(true);
	cloned.traverse((child) => {
		const mesh = child as Mesh;
		if (mesh.geometry) mesh.geometry = mesh.geometry.clone();
		if (!mesh.material) return;
		const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
		const copies = materials.map((material) => material.clone());
		mesh.material = Array.isArray(mesh.material) ? copies : copies[0]!;
	});
	return cloned;
}

function visualForType(typeId: string, props: Record<string, unknown>): Object3D {
	const registration = getEntityType(typeId);
	if (registration) {
		try {
			const node = registration.create({ position: { x: 0, y: 0, z: 0 }, props });
			if (node && typeof (node as Promise<unknown>).then !== 'function') {
				const source = (node as { group?: Object3D; mesh?: Object3D }).group
					?? (node as { mesh?: Object3D }).mesh;
				if (source) return cloneVisual(source);
			}
		} catch {
			// A factory that needs the stage falls through to a box of the same size.
		}
	}
	const size = sizeOf(props, { x: 1, y: 1, z: 1 });
	return new Mesh(
		new BoxGeometry(size.x, size.y, size.z),
		new MeshStandardMaterial({ color: 0xc8c2b4 }),
	);
}

/** Every part of the pose, so a visual a preview moved goes back exactly. */
function applyPose(object: Object3D, pose: BridgePose): void {
	const position = pose.position ?? { x: 0, y: 0, z: 0 };
	object.position.set(position.x, position.y, position.z);
	if (pose.quaternion) {
		object.quaternion.set(pose.quaternion.x, pose.quaternion.y, pose.quaternion.z, pose.quaternion.w);
	} else if (pose.rotation) {
		object.rotation.set(pose.rotation.x, pose.rotation.y, pose.rotation.z);
	} else {
		object.quaternion.identity();
	}
	const scale = pose.scale ?? { x: 1, y: 1, z: 1 };
	object.scale.set(scale.x, scale.y, scale.z);
}

/**
 * `tint` is the sector color; a selected solid takes it lighter. Faces sit a
 * hair back in depth so edge lines drawn on them win the depth test.
 */
function brushMaterial(selected: boolean, tint: string | null = null): MeshStandardMaterial {
	const material = new MeshStandardMaterial({
		color: tint ?? (selected ? SELECTED_BRUSH_COLOR : DEFAULT_BRUSH_COLOR),
		side: DoubleSide,
		polygonOffset: true,
		polygonOffsetFactor: 1,
		polygonOffsetUnits: 1,
	});
	if (tint && selected) material.color.lerp(new Color(0xffffff), 0.35);
	return material;
}

function selectPayload(
	id: string | null,
	elements: LevelElementRef[] | undefined,
	additive: boolean,
	ungroup: boolean,
): LevelSelectPayload {
	return {
		id,
		...(elements ? { elements } : {}),
		...(additive ? { additive: true } : {}),
		...(ungroup ? { ungroup: true } : {}),
	};
}

function elementKey(ref: LevelElementRef): string {
	return `${ref.brushId}:${ref.kind}:${ref.planes.join(',')}`;
}

export class LevelSession {
	private root = new Group();
	/** Tool overlays and the gizmo. Kept across rebuilds; each slot owns what it shows. */
	private tools = new Group();
	private hoverSlot = new OverlaySlot(this.tools);
	private ghostSlot = new OverlaySlot(this.tools);
	private guideSlot = new OverlaySlot(this.tools);
	private mounted = false;
	private generation = 0;
	private mode: 'edit' | 'play' = 'edit';
	private payload: LevelSyncPayload | null = null;
	/** Solids in the edit preview, by id. Filled in place, since the picker and preview read it. */
	private solids = new Map<string, SolidView>();
	/** Doodad and entity visuals in the edit preview, by id. */
	private objects = new Map<string, Object3D>();
	/** The selected elements, drawn over the solids. */
	private selectionView: Object3D | null = null;
	private picker: LevelPicker;
	/** A drag's or clip's preview. Outlives the drag until the sync it causes. */
	private preview: LevelToolPreview;
	private drawTool = new LevelDrawTool();
	private clipTool = new LevelClipTool();
	/** Where the clip preview last followed the pointer. */
	private clipCursor: BrushVec3 | null = null;
	private gizmo = new LevelGizmo();
	private gizmoPivot: BrushVec3 | null = null;
	private held: Held | null = null;
	private lastClick: ClickStamp | null = null;
	private hoverRay: GizmoRay | null = null;
	private hoverKey: string | null = null;
	/** One static body per sector while playing. */
	private bodyHandles: unknown[] = [];
	private zoneIds: string[] = [];

	constructor(private host: LevelSessionHost) {
		this.root.name = 'level-preview';
		this.tools.name = 'level-tools';
		this.tools.add(this.gizmo.root);
		this.picker = new LevelPicker(this.solids, this.objects, {
			camera: () => host.camera(),
			viewport: () => host.viewport(),
		});
		this.preview = new LevelToolPreview(this.tools, {
			solids: this.solids,
			objects: this.objects,
			selection: () => this.selectionView,
			material: (id, planes) => brushMaterial(this.isObjectSelected(id), this.sectorTint(planes)),
			half: (index) => brushMaterial(false, CLIP_TINTS[index % 2]!),
			restore: (id, object) => {
				const pose = this.payload ? documentPose(this.payload.document, id) : null;
				if (pose) applyPose(object, pose);
			},
		});
	}

	get isActive(): boolean {
		return this.payload !== null;
	}

	/** Edit preview, not play. The construction grid stays up for this stretch. */
	get isEditing(): boolean {
		return this.payload !== null && this.mode === 'edit';
	}

	/** A draw, clip points, or a drag under way. Escape cancels it. */
	get hasGesture(): boolean {
		return (
			this.drawTool.phase !== 'idle' ||
			this.clipTool.active ||
			this.gizmo.isDragging ||
			(this.held !== null && this.held.kind !== 'press')
		);
	}

	/** The plane a draw is on and where it started, for the construction grid. */
	get drawPlane(): { frame: BrushFrame; focus: BrushVec3 } | null {
		const frame = this.drawTool.activeFrame;
		const focus = this.drawTool.anchor;
		return frame && focus ? { frame, focus } : null;
	}

	/** Attach the preview if a sync arrived before the scene existed, and keep the gizmo screen-sized. */
	tick(): void {
		if (!this.payload) return;
		if (!this.mounted) {
			if (!this.host.getScene()) return;
			this.rebuild();
		}
		this.syncGizmo();
	}

	/** Show the document. A draw in progress carries on with the new payload's shape. */
	sync(payload: LevelSyncPayload): void {
		const previousMode = this.elementMode();
		this.mode = 'edit';
		this.payload = payload;
		setActiveDocument(payload.document);
		const dragging = this.held?.kind === 'drag' || this.held?.kind === 'gizmo';
		if (dragging && this.elementMode() !== previousMode) this.cancelHeld();
		this.rebuild();
	}

	play(document: LevelDocument): void {
		this.cancelGesture();
		this.mode = 'play';
		this.payload = {
			document,
			hiddenLayers: [],
			selectedIds: this.payload?.selectedIds ?? [],
			activeLayer: this.payload?.activeLayer ?? 'solid',
			placement: null,
		};
		setActiveDocument(document);
		this.rebuild();
	}

	close(): void {
		this.generation += 1;
		this.cancelGesture();
		this.payload = null;
		setActiveDocument(null);
		this.teardownOwned();
		this.clearTools();
		this.unmount();
	}

	dispose(): void {
		this.close();
		this.gizmo.dispose();
	}

	/** Drop the gesture in progress without publishing anything. */
	cancelGesture(): void {
		this.cancelHeld();
		this.drawTool.cancel();
		this.clipTool.cancel();
		this.clipCursor = null;
		this.ghostSlot.clear();
		this.guideSlot.clear();
		this.setHover(null);
		this.preview.show(null);
	}

	/**
	 * Take the press when level mode is showing.
	 *
	 * @returns Whether the rest of the pointer pipeline should leave this press alone.
	 */
	pointerDown(ray: GizmoRay, input: LevelPointerInput = {}): boolean {
		if (!this.isEditing) return false;
		this.cancelHeld();
		if (this.preview.value && !this.clipTool.active) this.preview.show(null);

		if (this.drawTool.phase === 'height') {
			this.commitDraw();
			this.held = { kind: 'press' };
			return true;
		}

		switch (getDebugTool()) {
			case 'select':
				return this.pressSelect(ray, input);
			case 'shear':
				return this.pressShear(ray, input);
			case 'brush':
				return this.pressDraw(ray);
			case 'clip':
				return this.pressClip(ray, input);
			case 'translate':
			case 'rotate':
			case 'scale':
				return this.pressTransform(ray, input);
			case 'delete':
				this.pressDelete(ray);
				return true;
			case 'add':
				this.placeArmed(ray);
				this.held = { kind: 'press' };
				return true;
			default:
				return false;
		}
	}

	pointerMove(ray: GizmoRay, input: LevelPointerInput = {}): void {
		const held = this.held;
		if (!held || !this.isEditing) return;
		if (held.kind === 'draw') {
			this.drawTool.drag(toDrawRay(ray));
			this.showDraw();
			return;
		}
		if (held.kind === 'drag') {
			if (!held.drag) return;
			if (!held.moved && !this.leftPress(held.from, ray)) return;
			held.moved = true;
			held.drag.update(toDrawRay(ray), input);
			const preview = held.drag.preview();
			this.preview.show(preview ? { solids: preview.solids, added: preview.added } : null);
			return;
		}
		if (held.kind === 'gizmo') {
			const camera = this.host.camera();
			if (!camera) return;
			const preview = this.gizmo.move(ray, camera, input.altKey === true);
			this.preview.show(preview ? { solids: preview.solids, poses: preview.poses } : null);
		}
	}

	/**
	 * Follow the pointer between presses: the height step, the clip preview,
	 * the gizmo handles, and the hover highlight.
	 */
	pointerHover(ray: GizmoRay): void {
		if (!this.isEditing) {
			this.setHover(null);
			return;
		}
		if (this.held) return;
		this.hoverRay = { origin: ray.origin.clone(), direction: ray.direction.clone() };

		if (this.drawTool.phase === 'height') {
			this.drawTool.raise(toDrawRay(ray));
			this.showDraw();
			return;
		}

		const tool = getDebugTool();
		if (tool === 'brush' || tool === 'clip') {
			this.setHover(null);
			const point = this.surfacePoint(ray);
			if (tool === 'clip' && this.clipTool.active) {
				this.guideSlot.clear();
				this.showClip(point);
			} else {
				this.guideSlot.set(point ? axisGuides(point) : null);
			}
			return;
		}
		this.guideSlot.clear();

		if (isTransformTool(tool) && this.gizmo.hover(ray)) {
			this.setHover(null);
			return;
		}
		if (tool === 'select' || tool === 'delete' || isTransformTool(tool)) {
			this.hoverIn(ray, this.elementMode());
			return;
		}
		if (tool === 'shear') {
			this.hoverIn(ray, 'face');
			return;
		}
		this.setHover(null);
	}

	pointerUp(ray: GizmoRay): void {
		const held = this.held;
		this.held = null;
		if (!held) return;

		if (held.kind === 'draw') {
			if (this.drawTool.phase !== 'footprint') return;
			const drawRay = toDrawRay(ray);
			this.drawTool.drag(drawRay);
			this.drawTool.release(drawRay, this.viewBasis());
			this.showDraw();
			return;
		}

		if (held.kind === 'drag') {
			const gesture = held.moved ? held.drag?.finish() ?? null : null;
			if (gesture) {
				this.host.publishGesture(gesture);
				return;
			}
			this.preview.show(null);
			this.host.publishSelect(held.click);
			return;
		}

		if (held.kind === 'gizmo') {
			const gesture = this.gizmo.end();
			if (gesture) this.host.publishGesture(gesture);
			else this.preview.show(null);
		}
	}

	private elementMode(): LevelElementMode {
		return this.payload?.elementMode ?? 'object';
	}

	private pressSelect(ray: GizmoRay, input: LevelPointerInput): boolean {
		const additive = input.shiftKey === true;
		this.held = { kind: 'press' };
		const mode = this.elementMode();
		if (mode === 'object') {
			const id = this.picker.object(ray);
			const ungroup = id ? this.registerClick(ray, input) : false;
			this.host.publishSelect(selectPayload(id, undefined, additive, ungroup));
			return true;
		}
		const element = this.picker.element(ray, mode);
		if (!element) {
			this.host.publishSelect(selectPayload(null, undefined, additive, false));
			return true;
		}
		this.pressElement(ray, element, mode, input);
		return true;
	}

	/** Hold a press on an element: released in place it selects, dragged it edits. */
	private pressElement(
		ray: GizmoRay,
		element: PickedElement,
		mode: Exclude<LevelElementMode, 'object'>,
		input: LevelPointerInput,
	): void {
		const ungroup = this.registerClick(ray, input);
		const click = selectPayload(element.ref.brushId, [element.ref], input.shiftKey === true, ungroup);
		const drag = mode === 'face'
			? this.faceDrag(ray, element, input)
			: this.elementDrag(element);
		this.hold(ray, drag, click);
	}

	private pressShear(ray: GizmoRay, input: LevelPointerInput): boolean {
		const additive = input.shiftKey === true;
		const face = this.picker.face(ray);
		if (!face) {
			this.host.publishSelect(selectPayload(null, undefined, additive, false));
			this.held = { kind: 'press' };
			return true;
		}
		const ungroup = this.registerClick(ray, input);
		const faces = this.dragSet(face.ref);
		const drag = new ShearDrag(faces, this.startPlanes(faces), face.plane, face.point, this.snapStep());
		const elements = this.elementMode() === 'face' ? [face.ref] : undefined;
		this.hold(ray, drag, selectPayload(face.ref.brushId, elements, additive, ungroup));
		return true;
	}

	/**
	 * Delete the object under the pointer, or the element the current mode
	 * picks. Empty space leaves Delete armed. An element that would not leave
	 * a solid is refused.
	 */
	private pressDelete(ray: GizmoRay): void {
		this.held = { kind: 'press' };
		const mode = this.elementMode();
		if (mode === 'object') {
			const id = this.picker.object(ray);
			if (id) this.host.publishGesture({ kind: 'delete', id });
			return;
		}
		const element = this.picker.element(ray, mode);
		if (!element) return;
		const solid = this.solids.get(element.ref.brushId);
		const planes = solid
			? deleteBrushElements(solid.planes, [{ kind: element.ref.kind, planes: element.ref.planes }])
			: null;
		if (!planes) {
			this.host.publishNotice('That would not leave a solid.');
			return;
		}
		this.host.publishGesture({ kind: 'element-delete', elements: [copyElement(element.ref)] });
	}

	private pressDraw(ray: GizmoRay): boolean {
		const start = this.drawStart(ray);
		if (!start) {
			this.held = { kind: 'press' };
			return true;
		}
		this.drawTool.begin(start.frame, start.point, this.snapStep());
		this.held = { kind: 'draw' };
		this.guideSlot.clear();
		this.showDraw();
		return true;
	}

	private pressClip(ray: GizmoRay, input: LevelPointerInput): boolean {
		this.held = { kind: 'press' };
		const brushIds = this.clipTargets();
		if (brushIds.length === 0) {
			this.host.publishNotice('Select the solids to clip first.');
			return true;
		}
		const point = this.surfacePoint(ray);
		if (!point) return true;
		this.guideSlot.clear();
		const plane = this.clipTool.click(point, this.host.viewDirection(), input.shiftKey === true);
		if (!plane) {
			this.showClip(point);
			return true;
		}
		this.clipCursor = null;
		this.ghostSlot.clear();
		this.host.publishGesture({ kind: 'clip', brushIds, plane });
		return true;
	}

	/**
	 * Grab a gizmo handle. Off the handles, a press on something acts as the
	 * Select tool's would, since the editor trades Select for Move after a
	 * pick: an element can still be dragged, Alt-extruded, or added with
	 * Shift. A press on nothing is left to the camera.
	 */
	private pressTransform(ray: GizmoRay, input: LevelPointerInput): boolean {
		const camera = this.host.camera();
		const payload = this.payload;
		const target = camera && payload && this.gizmoPivot
			? gizmoTarget(payload, this.solids, this.objects, this.gizmoPivot)
			: null;
		if (camera && target && this.gizmo.begin(ray, camera, target)) {
			this.held = { kind: 'gizmo' };
			this.setHover(null);
			return true;
		}
		const mode = this.elementMode();
		if (mode === 'object') {
			const id = this.picker.object(ray);
			if (!id) return false;
			const ungroup = this.registerClick(ray, input);
			this.host.publishSelect(selectPayload(id, undefined, input.shiftKey === true, ungroup));
			this.held = { kind: 'press' };
			return true;
		}
		const element = this.picker.element(ray, mode);
		if (!element) return false;
		this.pressElement(ray, element, mode, input);
		return true;
	}

	private hold(ray: GizmoRay, drag: ElementDrag | null, click: LevelSelectPayload): void {
		this.held = { kind: 'drag', drag, click, from: this.picker.screenOf(ray), moved: false };
		this.setHover(null);
	}

	/** Stamp a click on something; `true` when it completes a double-click. */
	private registerClick(ray: GizmoRay, input: LevelPointerInput): boolean {
		const screen = this.picker.screenOf(ray);
		const stamp = {
			time: input.timeStamp ?? performance.now(),
			x: screen?.x ?? 0,
			y: screen?.y ?? 0,
		};
		const double = isDoubleClick(this.lastClick, stamp);
		this.lastClick = double ? null : stamp;
		return double;
	}

	private leftPress(from: { x: number; y: number } | null, ray: GizmoRay): boolean {
		if (!from) return true;
		const at = this.picker.screenOf(ray);
		return !at || Math.hypot(at.x - from.x, at.y - from.y) >= DRAG_PIXELS;
	}

	/** The pressed element and, when it is selected, every selected element of its kind. */
	private dragSet(ref: LevelElementRef): LevelElementRef[] {
		const selected = this.payload?.elements ?? [];
		if (!selected.some((entry) => sameElement(entry, ref))) return [ref];
		return selected.filter((entry) => entry.kind === ref.kind && this.solids.has(entry.brushId));
	}

	private startPlanes(refs: readonly LevelElementRef[]): Map<string, BrushPlane[]> {
		const planes = new Map<string, BrushPlane[]>();
		for (const ref of refs) {
			const solid = this.solids.get(ref.brushId);
			if (solid) planes.set(ref.brushId, solid.planes);
		}
		return planes;
	}

	private faceDrag(ray: GizmoRay, face: PickedElement, input: LevelPointerInput): ElementDrag | null {
		const plane = this.solids.get(face.ref.brushId)?.planes[face.ref.planes[0] ?? -1];
		if (!plane) return null;
		const measure = new AxisDrag(face.point, unit(plane.normal), toDrawRay(ray), this.viewBasis());
		const faces = this.dragSet(face.ref);
		return new FaceDrag(faces, this.startPlanes(faces), measure, this.snapStep(), input.altKey === true);
	}

	private elementDrag(element: PickedElement): ElementDrag {
		const elements = this.dragSet(element.ref);
		const plane = facingAxisPlane(this.host.cameraId(), this.host.viewDirection(), element.point);
		const lone = elements.length === 1 && element.ref.kind === 'vertex' ? element.corners[0] ?? null : null;
		return new ElementMoveDrag(elements, this.startPlanes(elements), plane, element.point, lone, this.snapStep());
	}

	/** The frame a draw starts on: the face under the pointer, else the view plane or the ground. */
	private drawStart(ray: GizmoRay): { frame: BrushFrame; point: BrushVec3 } | null {
		const face = this.picker.face(ray);
		if (face) {
			return { frame: frameForPlane(face.plane.normal, face.plane.distance), point: face.point };
		}
		const frame = fallbackDrawFrame(this.host.cameraId(), this.host.viewDirection());
		const plane = framePlane(frame);
		const point = rayHitPlane(toDrawRay(ray), plane.normal, plane.distance);
		return point ? { frame, point } : null;
	}

	/** A point on the face under the pointer, else on the draw plane, snapped to the grid. */
	private surfacePoint(ray: GizmoRay): BrushVec3 | null {
		const step = this.snapStep();
		const face = this.picker.face(ray);
		if (face) return snapOntoPlane(face.point, face.plane, step);
		const plane = framePlane(fallbackDrawFrame(this.host.cameraId(), this.host.viewDirection()));
		const hit = rayHitPlane(toDrawRay(ray), plane.normal, plane.distance);
		return hit ? snapOntoPlane(hit, plane, step) : null;
	}

	private drawShape(): LevelDrawShape {
		return { ...(this.payload?.drawShape ?? DEFAULT_DRAW_SHAPE) };
	}

	/** Publish the primitive. Its ghost stays up until the sync that adds the solid. */
	private commitDraw(): void {
		const gesture = this.drawTool.commit(this.drawShape());
		const shape = gesture?.shape;
		if (gesture && shape && primitiveBrushes(shape.shape, gesture.frame, gesture.footprint, gesture.height, shape)) {
			this.host.publishGesture(gesture);
			return;
		}
		this.ghostSlot.clear();
	}

	private showDraw(): void {
		const state = this.drawTool.state();
		this.ghostSlot.set(state ? drawGhost(state, this.drawShape()) : null);
	}

	/** Selected solids, plus the owners of selected elements. */
	private clipTargets(): string[] {
		const payload = this.payload;
		if (!payload) return [];
		const solids = new Set(payload.document.solids.map((solid) => solid.id));
		const ids = new Set<string>();
		for (const id of payload.selectedIds) if (solids.has(id)) ids.add(id);
		for (const element of payload.elements ?? []) {
			if (solids.has(element.brushId)) ids.add(element.brushId);
		}
		return [...ids];
	}

	/** Placed points, the path to the pointer, and the halves the cut would make. */
	private showClip(cursor: BrushVec3 | null): void {
		this.clipCursor = cursor;
		const placed = this.clipTool.placed;
		this.ghostSlot.set(clipMarks(cursor ? [...placed, cursor] : placed));
		const plane = cursor && placed.length > 0 ? this.clipTool.preview(cursor, this.host.viewDirection()) : null;
		const split = new Map<string, BrushPlane[][]>();
		if (plane) {
			for (const id of this.clipTargets()) {
				const solid = this.solids.get(id);
				const halves = solid ? clipBrush(solid.planes, plane) : [];
				if (halves.length > 1) split.set(id, halves);
			}
		}
		this.preview.show(split.size > 0 ? { split } : null);
	}

	/** Highlight what a click would pick in `mode`. */
	private hoverIn(ray: GizmoRay, mode: LevelElementMode): void {
		if (mode === 'object') {
			const id = this.picker.object(ray);
			this.setHover(id ? `object:${id}` : null, () => (id ? this.objectOutline(id) : null));
			return;
		}
		const element = this.picker.element(ray, mode);
		this.setHover(element ? elementKey(element.ref) : null, () =>
			element ? elementMark(element.ref.kind, element.corners, HOVER_COLOR, 0.2) : null,
		);
	}

	private setHover(key: string | null, build?: () => Object3D | null): void {
		if (key === this.hoverKey) return;
		this.hoverKey = key;
		this.hoverSlot.set(key && build ? build() : null);
	}

	private objectOutline(id: string): Object3D | null {
		const solid = this.solids.get(id);
		if (solid) return edgeHighlight(topologyEdges(solid.topology), HOVER_COLOR);
		const object = this.objects.get(id);
		if (!object) return null;
		const box = new Box3().setFromObject(object);
		return box.isEmpty() ? null : new Box3Helper(box, HOVER_COLOR);
	}

	private isObjectSelected(id: string): boolean {
		return this.elementMode() === 'object' && (this.payload?.selectedIds.includes(id) ?? false);
	}

	private sectorTint(planes: readonly BrushPlane[]): string | null {
		return this.payload ? solidSectorTint(planes, this.payload) : null;
	}

	private syncGizmo(): void {
		const tool = getDebugTool();
		this.gizmo.place(this.isEditing && isTransformTool(tool) ? tool : null, this.gizmoPivot);
		if (!this.gizmo.visible) return;
		const camera = this.host.camera();
		if (camera) this.gizmo.update(camera);
	}

	/** The camera's facing and its screen up, for measures read on screen. */
	private viewBasis(): ViewBasis {
		const direction = this.host.viewDirection();
		const camera = this.host.camera();
		if (camera) {
			camera.updateMatrixWorld();
			const up = new Vector3().setFromMatrixColumn(camera.matrixWorld, 1).normalize();
			return { direction, up: { x: up.x, y: up.y, z: up.z } };
		}
		const flat = { x: -direction.x * direction.y, y: 1 - direction.y * direction.y, z: -direction.z * direction.y };
		const up = Math.hypot(flat.x, flat.y, flat.z) > 1e-6 ? unit(flat) : { x: 0, y: 0, z: -1 };
		return { direction, up };
	}

	private rebuild(): void {
		const generation = ++this.generation;
		this.teardownOwned();
		const payload = this.payload;
		if (!payload || !this.ensureRoot()) return;
		this.buildVisuals();
		this.root.updateMatrixWorld(true);
		this.gizmoPivot = this.isEditing ? selectionPivot(payload, this.solids, this.objects) : null;
		this.refreshTools();
		if (this.mode !== 'play') return;

		this.spawnSectors(payload.document);
		void this.spawnZones(payload.document, generation).catch((error: unknown) => {
			console.error('Level triggers failed to spawn', error);
		});
	}

	/** Redraw the tool overlays over a fresh document. A drag's preview survives; a finished one is done. */
	private refreshTools(): void {
		if (!this.isEditing) {
			this.clearTools();
			return;
		}
		if (!this.held && !this.gizmo.isDragging) this.preview.forget();
		else this.preview.apply();
		this.ghostSlot.clear();
		this.setHover(null);
		if (this.drawTool.phase !== 'idle') this.showDraw();
		else if (this.clipTool.active) this.showClip(this.clipCursor);
		else if (this.hoverRay && !this.held) this.pointerHover(this.hoverRay);
		this.syncGizmo();
	}

	private spawnSectors(document: LevelDocument): void {
		for (const sector of buildPlaySectors(document.solids, sectorSizeOf(document))) {
			const mesh = new Mesh(sector.geometry, brushMaterial(false));
			mesh.name = `level-sector:${sector.key}`;
			this.root.add(mesh);
			if (sector.hulls.length === 0) continue;
			const body = this.host.spawnHulls(sector.hulls);
			if (body !== null) this.bodyHandles.push(body);
		}
	}

	private buildVisuals(): void {
		const payload = this.payload;
		if (!payload) return;
		const editing = this.mode === 'edit';
		const hidden = new Set(editing ? payload.hiddenLayers : []);
		const elementMode = editing ? this.elementMode() : 'object';

		if (editing && !hidden.has('solid')) {
			for (const solid of payload.document.solids) {
				if (solidSectorHidden(solid.planes, payload)) continue;
				const topology = brushTopology(solid.planes);
				if (!topology) continue;
				const isSelected = this.isObjectSelected(solid.id);
				const mesh = new Mesh(
					brushGeometry(topology),
					brushMaterial(isSelected, solidSectorTint(solid.planes, payload)),
				);
				mesh.userData.levelId = solid.id;
				this.root.add(mesh);
				const center = isSelected ? brushCenter(solid.planes) : null;
				const guides = center ? axisGuides(center) : null;
				if (guides) this.root.add(guides);
				this.solids.set(solid.id, { planes: solid.planes, topology, mesh, guides });
			}
		}

		if (editing) {
			const overlay = buildSectorOverlay(payload);
			if (overlay) this.root.add(overlay);
		}

		if (editing && elementMode !== 'object') {
			const topologies = [...this.solids.values()].map((view) => view.topology);
			const wire = elementWire(topologies, elementMode === 'vertex');
			if (wire) this.root.add(wire);
			this.selectionView = elementSelection(payload.elements ?? [], (id) => this.solids.get(id)?.planes);
			if (this.selectionView) this.root.add(this.selectionView);
		}

		if (!hidden.has('doodad')) {
			for (const doodad of payload.document.doodads) {
				const visual = visualForType(doodad.typeId, doodad.props);
				applyPose(visual, doodad.pose);
				visual.userData.levelId = doodad.id;
				this.root.add(visual);
				this.objects.set(doodad.id, visual);
			}
		}

		if (!hidden.has('entity')) {
			for (const entity of payload.document.entities) {
				const marker = entity.typeId === 'zone'
					? this.triggerOutline(entity.props)
					: new Mesh(
						new OctahedronGeometry(0.3),
						new MeshStandardMaterial({ color: 0xe36ad4 }),
					);
				applyPose(marker, entity.pose);
				marker.userData.levelId = entity.id;
				this.root.add(marker);
				this.objects.set(entity.id, marker);
			}
		}
	}

	private triggerOutline(props: Record<string, unknown>): Object3D {
		const size = sizeOf(props, { x: 2, y: 2, z: 2 });
		return new LineSegments(
			new EdgesGeometry(new BoxGeometry(size.x, size.y, size.z)),
			new LineBasicMaterial({ color: 0x3ddc97 }),
		);
	}

	private async spawnZones(document: LevelDocument, generation: number): Promise<void> {
		for (const entity of document.entities) {
			if (entity.typeId !== 'zone') continue;
			if (generation !== this.generation) return;
			const uuid = await this.host.spawnZone({
				name: entity.name,
				position: entity.pose.position ?? { x: 0, y: 0, z: 0 },
				size: sizeOf(entity.props, { x: 2, y: 2, z: 2 }),
			});
			if (generation !== this.generation) {
				if (uuid) this.host.detach(uuid);
				return;
			}
			if (uuid) this.zoneIds.push(uuid);
		}
	}

	private placeArmed(ray: GizmoRay): void {
		const placement = this.payload?.placement;
		if (!placement) return;
		const landed = computePlacementPose(ray, this.host.physicsHit(ray), {
			enabled: true,
			translate: this.gridStep(),
		});
		if (!landed) return;
		const pose = {
			position: { x: landed.position.x, y: landed.position.y, z: landed.position.z },
		};
		if (placement.kind === 'doodad') {
			this.host.publishGesture({
				kind: 'doodad',
				typeId: placement.typeId,
				pose,
				...(placement.props ? { props: placement.props } : {}),
			});
			return;
		}
		if (placement.kind === 'spawn') {
			this.host.publishGesture({ kind: 'spawn', pose });
			return;
		}
		this.host.publishGesture({ kind: 'trigger', pose, size: placement.size });
	}

	/** Drop the press in progress, and its preview. */
	private cancelHeld(): void {
		const held = this.held;
		this.held = null;
		if (this.gizmo.isDragging) this.gizmo.cancel();
		if (held?.kind === 'drag' || held?.kind === 'gizmo') this.preview.show(null);
		if (held?.kind === 'draw') {
			this.drawTool.cancel();
			this.ghostSlot.clear();
		}
	}

	/** Placement keeps a grid even with snapping off. */
	private gridStep(): number {
		const step = getSnapSettings().translate;
		return step > 0 ? step : 1;
	}

	/** The tools' grid step, or 0 while snapping is off. */
	private snapStep(): number {
		const snap = getSnapSettings();
		return snap.enabled && snap.translate > 0 ? snap.translate : 0;
	}

	private ensureRoot(): boolean {
		const scene = this.host.getScene();
		if (!scene) return false;
		if (this.tools.parent !== this.root) this.root.add(this.tools);
		if (!this.mounted) {
			scene.add(this.root);
			this.mounted = true;
		}
		return true;
	}

	private clearTools(): void {
		this.setHover(null);
		this.ghostSlot.clear();
		this.guideSlot.clear();
		this.preview.forget();
		this.gizmo.place(null, null);
	}

	private teardownOwned(): void {
		for (const uuid of this.zoneIds) this.host.detach(uuid);
		this.zoneIds = [];
		for (const handle of this.bodyHandles) this.host.despawnHulls(handle);
		this.bodyHandles = [];
		this.solids.clear();
		this.objects.clear();
		this.selectionView = null;
		for (const child of [...this.root.children]) {
			if (child === this.tools) continue;
			this.root.remove(child);
			disposeObject(child);
		}
	}

	private unmount(): void {
		if (!this.mounted) return;
		this.host.getScene()?.remove(this.root);
		this.mounted = false;
	}
}
