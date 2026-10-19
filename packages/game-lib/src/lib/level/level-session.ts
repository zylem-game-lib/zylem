/**
 * The stage's picture of the level document.
 *
 * The editor owns the file. This session draws it, reports finished gestures,
 * and on play swaps the brush faces for one static body of convex hulls.
 * Nothing it creates is a normal stage entity except play-mode trigger zones,
 * and those are marked editor-owned so they are not published back.
 */

import {
	BoxGeometry,
	BufferGeometry,
	DoubleSide,
	EdgesGeometry,
	Float32BufferAttribute,
	Group,
	Line,
	LineBasicMaterial,
	LineSegments,
	Mesh,
	MeshBasicMaterial,
	MeshStandardMaterial,
	Object3D,
	OctahedronGeometry,
	Raycaster,
	SphereGeometry,
	type Material,
} from 'three';
import { compileBrush, type BrushVec3, type CompiledBrush } from './brush';
import type { LevelDocument, LevelGesture, LevelLayerId, LevelSyncPayload } from './level-types';
import { getDebugTool, getSnapSettings } from '../debug/debug-state';
import { getEntityType } from '../entities/entity-registry';
import type { GizmoRay } from '../debug/transform-gizmo';
import { computePlacementPose, type PlacementHit } from '../stage/placement-geometry';
import { levelCollisionHulls } from './level-collision';
import {
	boxFromDrag,
	clipPlaneFromPoints,
	drawPlaneAxis,
	drawViewForCamera,
	drawViewForDirection,
	rayHitAxisPlane,
	snapPoint,
	type DrawRay,
	type DrawView,
} from './level-draw';

export interface LevelZoneSpawn {
	name: string;
	position: BrushVec3;
	size: BrushVec3;
}

export interface LevelSessionHost {
	getScene(): { add(object: Object3D): void; remove(object: Object3D): void } | null;
	cameraId(): string | null;
	/** World direction the rendering camera looks, for cameras other than Top and Side. */
	viewDirection(): BrushVec3;
	/** Physics hit under the pointer, for doodad and entity placement. */
	physicsHit(ray: GizmoRay): PlacementHit | null;
	spawnZone(zone: LevelZoneSpawn): Promise<string | null>;
	detach(uuid: string): void;
	/** One static body, one convex hull per buffer. Null when physics is unavailable. */
	spawnHulls(hulls: Float32Array[]): unknown | null;
	despawnHulls(handle: unknown): void;
	publishGesture(gesture: LevelGesture): void;
	publishSelect(id: string | null): void;
	publishNotice(message: string): void;
}

/** Neutral stand-in. A solid stores no material, so nothing replaces this yet. */
const DEFAULT_BRUSH_COLOR = 0xc8c2b4;
/** Lighter than the default so a selected solid still reads as chosen. */
const SELECTED_BRUSH_COLOR = 0xe4ddd0;

/** Half-length of each guide, long enough to cross an editor view. */
const AXIS_GUIDE_SPAN = 250;
const AXIS_GUIDES: Array<{ color: number; axis: 'x' | 'y' | 'z' }> = [
	{ color: 0xff3333, axis: 'x' },
	{ color: 0x33cc66, axis: 'y' },
	{ color: 0x3388ff, axis: 'z' },
];

let activeDocument: LevelDocument | null = null;

/** The document currently previewed or playing, for hosts that spawn from markers. */
export function getActiveLevelDocument(): LevelDocument | null {
	return activeDocument;
}

function setActiveDocument(document: LevelDocument | null): void {
	activeDocument = document;
}

type Drag =
	| { kind: 'brush'; view: DrawView; start: BrushVec3 }
	| { kind: 'vertex'; brushId: string; vertexIndex: number; view: DrawView; plane: number }
	| { kind: 'translate'; id: string; layer: LevelLayerId; view: DrawView; start: BrushVec3 };

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

function layerOf(document: LevelDocument, id: string): LevelLayerId | null {
	if (document.solids.some((solid) => solid.id === id)) return 'solid';
	if (document.doodads.some((doodad) => doodad.id === id)) return 'doodad';
	if (document.entities.some((entity) => entity.id === id)) return 'entity';
	return null;
}

function disposeMaterial(material: Material | Material[]): void {
	if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
	else material.dispose();
}

function disposeObject(object: Object3D): void {
	object.traverse((child) => {
		const mesh = child as Mesh;
		mesh.geometry?.dispose();
		if (mesh.material) disposeMaterial(mesh.material);
	});
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

function applyPose(object: Object3D, pose: { position?: BrushVec3; rotation?: BrushVec3; quaternion?: { x: number; y: number; z: number; w: number }; scale?: BrushVec3 }): void {
	const position = pose.position ?? { x: 0, y: 0, z: 0 };
	object.position.set(position.x, position.y, position.z);
	if (pose.quaternion) {
		object.quaternion.set(pose.quaternion.x, pose.quaternion.y, pose.quaternion.z, pose.quaternion.w);
	} else if (pose.rotation) {
		object.rotation.set(pose.rotation.x, pose.rotation.y, pose.rotation.z);
	}
	if (pose.scale) object.scale.set(pose.scale.x, pose.scale.y, pose.scale.z);
}

function brushMaterial(selected: boolean): MeshStandardMaterial {
	return new MeshStandardMaterial({
		color: selected ? SELECTED_BRUSH_COLOR : DEFAULT_BRUSH_COLOR,
		side: DoubleSide,
	});
}

/** World axes through a point. Depth is ignored so the lines stay visible while editing. */
function axisGuides(center: BrushVec3): Group {
	const group = new Group();
	for (const guide of AXIS_GUIDES) {
		const start = { x: center.x, y: center.y, z: center.z };
		const end = { x: center.x, y: center.y, z: center.z };
		start[guide.axis] -= AXIS_GUIDE_SPAN;
		end[guide.axis] += AXIS_GUIDE_SPAN;
		const geometry = new BufferGeometry();
		geometry.setAttribute(
			'position',
			new Float32BufferAttribute([start.x, start.y, start.z, end.x, end.y, end.z], 3),
		);
		const line = new Line(
			geometry,
			new LineBasicMaterial({ color: guide.color, depthTest: false }),
		);
		line.frustumCulled = false;
		line.renderOrder = 20;
		group.add(line);
	}
	return group;
}

function brushCenter(compiled: CompiledBrush): BrushVec3 {
	const sum = compiled.vertices.reduce(
		(acc, vertex) => ({ x: acc.x + vertex.x, y: acc.y + vertex.y, z: acc.z + vertex.z }),
		{ x: 0, y: 0, z: 0 },
	);
	const count = compiled.vertices.length;
	return { x: sum.x / count, y: sum.y / count, z: sum.z / count };
}

function brushGeometry(compiled: CompiledBrush): BufferGeometry {
	const positions: number[] = [];
	const indices: number[] = [];
	for (const face of compiled.faces) {
		const base = positions.length / 3;
		for (const index of face.indices) {
			const vertex = compiled.vertices[index]!;
			positions.push(vertex.x, vertex.y, vertex.z);
		}
		for (let i = 1; i < face.indices.length - 1; i += 1) {
			indices.push(base, base + i, base + i + 1);
		}
	}
	const geometry = new BufferGeometry();
	geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
	geometry.setIndex(indices);
	geometry.computeVertexNormals();
	return geometry;
}

export class LevelSession {
	private root = new Group();
	private raycaster = new Raycaster();
	private mounted = false;
	private generation = 0;
	private mode: 'edit' | 'play' = 'edit';
	private payload: LevelSyncPayload | null = null;
	private drag: Drag | null = null;
	private clipAnchor: BrushVec3 | null = null;
	private ghost: Object3D | null = null;
	/** Axis guides under the cursor while a solid tool is armed and not dragging. */
	private hoverGuides: Object3D | null = null;
	private bodyHandle: unknown = null;
	private zoneIds: string[] = [];

	constructor(private host: LevelSessionHost) {
		this.root.name = 'level-preview';
	}

	get isActive(): boolean {
		return this.payload !== null;
	}

	/** Edit preview, not play. The construction grid stays up for this stretch. */
	get isEditing(): boolean {
		return this.payload !== null && this.mode === 'edit';
	}

	/** Attach the preview if a sync arrived before the scene existed. */
	tick(): void {
		if (!this.payload || this.mounted || !this.host.getScene()) return;
		this.rebuild();
	}

	sync(payload: LevelSyncPayload): void {
		this.mode = 'edit';
		this.payload = payload;
		setActiveDocument(payload.document);
		this.rebuild();
	}

	play(document: LevelDocument): void {
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
		this.payload = null;
		this.drag = null;
		this.clipAnchor = null;
		setActiveDocument(null);
		this.teardownOwned();
		this.unmount();
	}

	dispose(): void {
		this.close();
	}

	/**
	 * Take the press when level mode is showing.
	 *
	 * @returns Whether the rest of the pointer pipeline should leave this press alone.
	 */
	pointerDown(ray: GizmoRay): boolean {
		if (!this.payload) return false;
		const tool = getDebugTool();

		if (tool === 'select') {
			this.host.publishSelect(this.pickId(ray));
			return true;
		}
		if (tool === 'delete') {
			const id = this.pickId(ray);
			if (id) this.host.publishGesture({ kind: 'delete', id });
			return true;
		}
		if (tool === 'add') {
			this.placeArmed(ray);
			return true;
		}
		if (tool === 'brush' || tool === 'clip' || tool === 'vertex') {
			this.beginSolidGesture(tool, ray);
			return true;
		}
		if (tool === 'translate') return this.beginTranslate(ray);
		return false;
	}

	pointerMove(ray: GizmoRay): void {
		if (!this.drag || this.drag.kind !== 'brush') return;
		const end = this.viewPoint(this.drag.view, ray);
		if (!end) return;
		this.showBrushGhost(boxFromDrag(this.drag.view, this.drag.start, end, this.gridStep()));
	}

	/**
	 * Follow the cursor with axis guides while Draw, Clip, or Vertex is armed.
	 * A brush drag replaces them with the live box. Clip keeps them on the
	 * anchor, and Vertex keeps them on the selected brush.
	 */
	pointerHover(ray: GizmoRay): void {
		if (!this.payload || this.drag) return;
		const tool = getDebugTool();
		if (tool !== 'brush' && tool !== 'clip' && tool !== 'vertex') {
			this.clearHoverGuides();
			return;
		}
		if (tool === 'clip' && this.clipAnchor) {
			// The clip marker already carries guides at the anchor.
			this.clearHoverGuides();
			return;
		}
		if (tool === 'vertex' && this.selectedSolidCenter()) {
			// A selected solid already draws its own guides.
			this.clearHoverGuides();
			return;
		}
		const point = this.viewPoint(this.currentDrawView(), ray);
		if (!point) {
			this.clearHoverGuides();
			return;
		}
		this.showHoverGuides(point);
	}

	pointerUp(ray: GizmoRay): void {
		const drag = this.drag;
		this.drag = null;
		this.clearGhost();
		if (!drag) return;

		if (drag.kind === 'brush') {
			const end = this.viewPoint(drag.view, ray) ?? drag.start;
			const box = boxFromDrag(drag.view, drag.start, end, this.gridStep());
			this.host.publishGesture({ kind: 'brush', min: box.min, max: box.max });
			return;
		}

		if (drag.kind === 'vertex') {
			const end = this.viewPoint(drag.view, ray, drag.plane);
			if (!end) return;
			this.host.publishGesture({
				kind: 'vertex',
				brushId: drag.brushId,
				vertexIndex: drag.vertexIndex,
				position: snapPoint(end, this.gridStep()),
			});
			return;
		}

		const end = this.translatePoint(drag, ray);
		if (!end) return;
		const snapped = snapPoint(end, this.gridStep());
		const delta = {
			x: snapped.x - drag.start.x,
			y: snapped.y - drag.start.y,
			z: snapped.z - drag.start.z,
		};
		if (drag.view === 'top') delta.y = 0;
		if (drag.view === 'side') delta.x = 0;
		if (drag.view === 'front') delta.z = 0;
		if (delta.x === 0 && delta.y === 0 && delta.z === 0) return;
		this.host.publishGesture({ kind: 'translate', id: drag.id, layer: drag.layer, delta });
	}

	private rebuild(): void {
		const generation = ++this.generation;
		this.teardownOwned();
		const payload = this.payload;
		if (!payload || !this.ensureRoot()) return;
		this.buildVisuals();
		if (this.mode !== 'play') return;

		const hulls = levelCollisionHulls(payload.document.solids);
		this.bodyHandle = hulls.length > 0 ? this.host.spawnHulls(hulls) : null;
		void this.spawnZones(payload.document, generation).catch((error: unknown) => {
			console.error('Level triggers failed to spawn', error);
		});
	}

	private buildVisuals(): void {
		const payload = this.payload;
		if (!payload) return;
		const hidden = new Set(this.mode === 'play' ? [] : payload.hiddenLayers);
		const selected = new Set(payload.selectedIds);
		const showFaces = this.mode === 'edit';

		if (showFaces && !hidden.has('solid')) {
			for (const solid of payload.document.solids) {
				const compiled = compileBrush(solid.planes);
				if (!compiled) continue;
				const isSelected = selected.has(solid.id);
				const mesh = new Mesh(brushGeometry(compiled), brushMaterial(isSelected));
				mesh.userData.levelId = solid.id;
				this.root.add(mesh);
				if (isSelected) this.root.add(axisGuides(brushCenter(compiled)));
				if (selected.has(solid.id) && getDebugTool() === 'vertex') {
					this.addVertexHandles(solid.id, compiled);
				}
			}
		}

		if (!hidden.has('doodad')) {
			for (const doodad of payload.document.doodads) {
				const visual = visualForType(doodad.typeId, doodad.props);
				applyPose(visual, doodad.pose);
				visual.userData.levelId = doodad.id;
				this.root.add(visual);
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
			}
		}
	}

	private addVertexHandles(brushId: string, compiled: CompiledBrush): void {
		const radius = Math.max(this.gridStep() * 0.28, 0.08);
		compiled.vertices.forEach((vertex, index) => {
			const handle = new Mesh(
				new SphereGeometry(radius, 8, 6),
				new MeshBasicMaterial({ color: 0xffee88, depthTest: false }),
			);
			handle.position.set(vertex.x, vertex.y, vertex.z);
			handle.userData.levelId = brushId;
			handle.userData.vertexIndex = index;
			handle.renderOrder = 10;
			this.root.add(handle);
		});
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

	private beginSolidGesture(tool: 'brush' | 'clip' | 'vertex', ray: GizmoRay): void {
		const view = this.currentDrawView();
		const point = this.viewPoint(view, ray);
		if (!point) return;

		if (tool === 'brush') {
			this.clearHoverGuides();
			this.drag = { kind: 'brush', view, start: point };
			this.showBrushGhost(boxFromDrag(view, point, point, this.gridStep()));
			return;
		}
		if (tool === 'clip') {
			if (!this.clipAnchor) {
				this.clipAnchor = point;
				this.showClipMarker(point);
				return;
			}
			const plane = clipPlaneFromPoints(view, this.clipAnchor, point);
			this.clipAnchor = null;
			this.clearGhost();
			const brushId = this.selectedSolidId();
			if (plane && brushId) this.host.publishGesture({ kind: 'clip', brushId, plane });
			return;
		}

		const picked = this.pick(ray);
		if (picked && typeof picked.vertexIndex === 'number') {
			const vertex = this.vertexAt(picked.id, picked.vertexIndex);
			this.drag = {
				kind: 'vertex',
				brushId: picked.id,
				vertexIndex: picked.vertexIndex,
				view,
				plane: vertex?.[drawPlaneAxis(view)] ?? 0,
			};
			return;
		}
		this.host.publishSelect(picked?.id ?? null);
	}

	private vertexAt(brushId: string, index: number): BrushVec3 | null {
		const solid = this.payload?.document.solids.find((entry) => entry.id === brushId);
		if (!solid) return null;
		return compileBrush(solid.planes)?.vertices[index] ?? null;
	}

	private beginTranslate(ray: GizmoRay): boolean {
		const payload = this.payload;
		const id = payload?.selectedIds[0];
		if (!payload || !id) return false;
		const layer = layerOf(payload.document, id);
		if (!layer) return false;
		const view = this.currentDrawView();
		const start = this.translatePoint({ kind: 'translate', id, layer, view, start: { x: 0, y: 0, z: 0 } }, ray);
		if (!start) return true;
		this.drag = { kind: 'translate', id, layer, view, start: snapPoint(start, this.gridStep()) };
		return true;
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

	/** Top and Side cameras stay on their planes. Every other camera uses its facing. */
	private currentDrawView(): DrawView {
		return drawViewForCamera(this.host.cameraId()) ?? drawViewForDirection(this.host.viewDirection());
	}

	private viewPoint(view: DrawView, ray: GizmoRay, plane = 0): BrushVec3 | null {
		return rayHitAxisPlane(toDrawRay(ray), drawPlaneAxis(view), plane);
	}

	private translatePoint(drag: Extract<Drag, { kind: 'translate' }>, ray: GizmoRay): BrushVec3 | null {
		const anchor = this.anchorOf(drag.id);
		return rayHitAxisPlane(toDrawRay(ray), drawPlaneAxis(drag.view), anchor[drawPlaneAxis(drag.view)]);
	}

	private anchorOf(id: string): BrushVec3 {
		const document = this.payload?.document;
		const solid = document?.solids.find((entry) => entry.id === id);
		if (solid) {
			const compiled = compileBrush(solid.planes);
			if (compiled && compiled.vertices.length > 0) {
				const sum = compiled.vertices.reduce(
					(acc, vertex) => ({ x: acc.x + vertex.x, y: acc.y + vertex.y, z: acc.z + vertex.z }),
					{ x: 0, y: 0, z: 0 },
				);
				const count = compiled.vertices.length;
				return { x: sum.x / count, y: sum.y / count, z: sum.z / count };
			}
		}
		const doodad = document?.doodads.find((entry) => entry.id === id);
		if (doodad?.pose.position) return doodad.pose.position;
		const entity = document?.entities.find((entry) => entry.id === id);
		return entity?.pose.position ?? { x: 0, y: 0, z: 0 };
	}

	private selectedSolidId(): string | null {
		const payload = this.payload;
		if (!payload) return null;
		return payload.selectedIds.find((id) => payload.document.solids.some((solid) => solid.id === id)) ?? null;
	}

	private pickId(ray: GizmoRay): string | null {
		return this.pick(ray)?.id ?? null;
	}

	private pick(ray: GizmoRay): { id: string; vertexIndex?: number } | null {
		if (!this.mounted) return null;
		this.raycaster.set(ray.origin, ray.direction);
		const hits = this.raycaster.intersectObjects(this.root.children, true);
		for (const hit of hits) {
			let object: Object3D | null = hit.object;
			while (object) {
				const vertexIndex = object.userData.vertexIndex;
				const id = object.userData.levelId;
				if (typeof id === 'string') {
					return typeof vertexIndex === 'number' ? { id, vertexIndex } : { id };
				}
				object = object.parent;
			}
		}
		return null;
	}

	private showBrushGhost(box: { min: BrushVec3; max: BrushVec3 }): void {
		this.clearGhost();
		const size = {
			x: box.max.x - box.min.x,
			y: box.max.y - box.min.y,
			z: box.max.z - box.min.z,
		};
		const center = {
			x: (box.min.x + box.max.x) / 2,
			y: (box.min.y + box.max.y) / 2,
			z: (box.min.z + box.max.z) / 2,
		};
		const mesh = new Mesh(
			new BoxGeometry(size.x, size.y, size.z),
			new MeshStandardMaterial({
				color: DEFAULT_BRUSH_COLOR,
				transparent: true,
				opacity: 0.35,
				depthWrite: false,
				side: DoubleSide,
			}),
		);
		mesh.position.set(center.x, center.y, center.z);
		const group = new Group();
		group.add(mesh);
		group.add(axisGuides(center));
		this.ghost = group;
		this.root.add(group);
	}

	private showClipMarker(point: BrushVec3): void {
		this.clearGhost();
		const marker = new Mesh(
			new SphereGeometry(Math.max(this.gridStep() * 0.2, 0.06), 8, 6),
			new MeshBasicMaterial({ color: 0xffee88, depthTest: false }),
		);
		marker.position.set(point.x, point.y, point.z);
		const group = new Group();
		group.add(marker);
		group.add(axisGuides(point));
		this.ghost = group;
		this.root.add(group);
	}

	private showHoverGuides(point: BrushVec3): void {
		this.clearHoverGuides();
		if (!this.ensureRoot()) return;
		const guides = axisGuides(point);
		this.hoverGuides = guides;
		this.root.add(guides);
	}

	private clearHoverGuides(): void {
		if (!this.hoverGuides) return;
		this.root.remove(this.hoverGuides);
		disposeObject(this.hoverGuides);
		this.hoverGuides = null;
	}

	private selectedSolidCenter(): BrushVec3 | null {
		const id = this.selectedSolidId();
		if (!id) return null;
		const solid = this.payload?.document.solids.find((entry) => entry.id === id);
		if (!solid) return null;
		const compiled = compileBrush(solid.planes);
		return compiled ? brushCenter(compiled) : null;
	}

	private clearGhost(): void {
		if (!this.ghost) return;
		this.root.remove(this.ghost);
		disposeObject(this.ghost);
		this.ghost = null;
	}

	private gridStep(): number {
		const step = getSnapSettings().translate;
		return step > 0 ? step : 1;
	}

	private ensureRoot(): boolean {
		const scene = this.host.getScene();
		if (!scene) return false;
		if (!this.mounted) {
			scene.add(this.root);
			this.mounted = true;
		}
		return true;
	}

	private teardownOwned(): void {
		for (const uuid of this.zoneIds) this.host.detach(uuid);
		this.zoneIds = [];
		if (this.bodyHandle !== null) {
			this.host.despawnHulls(this.bodyHandle);
			this.bodyHandle = null;
		}
		this.clearGhost();
		this.clearHoverGuides();
		for (const child of [...this.root.children]) {
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
