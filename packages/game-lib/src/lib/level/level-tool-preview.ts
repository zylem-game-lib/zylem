/**
 * What a gesture in progress would do, drawn over the edit preview: solids
 * redrawn from new planes with the originals hidden, solids a gesture would
 * add, the halves of a clip, and new doodad and entity poses.
 */

import { Group, Mesh, type Material, type Object3D } from 'three';
import { compileBrush, type BrushPlane } from '@zylem/bridge';
import { brushGeometry } from './level-geometry';
import type { PreviewPose } from './level-gizmo';
import { OverlaySlot, ghostBrushes } from './level-highlight';

export interface ToolPreview {
	/** Solids drawn from these planes in place of the document's. */
	solids: Map<string, BrushPlane[]>;
	/** Solids the gesture would add. */
	added: BrushPlane[][];
	/** Doodad and entity poses. */
	poses: Map<string, PreviewPose>;
	/** Solids a clip would split, as their halves. */
	split: Map<string, BrushPlane[][]>;
}

/** The edit preview a tool preview draws over. */
export interface PreviewScene {
	solids: ReadonlyMap<string, { planes: BrushPlane[]; mesh: Object3D; guides: Object3D | null }>;
	objects: ReadonlyMap<string, Object3D>;
	/** The element selection, hidden while parts move. */
	selection(): Object3D | null;
	/** How the solid `id` is drawn. */
	material(id: string, planes: readonly BrushPlane[]): Material;
	/** How one half of a clip is drawn. */
	half(index: number): Material;
	/** Put an object back on its document pose. */
	restore(id: string, object: Object3D): void;
}

export class LevelToolPreview {
	private current: ToolPreview | null = null;
	/** Objects this preview has posed, to put back. */
	private posed = new Set<string>();
	private readonly slot: OverlaySlot;

	constructor(
		parent: Object3D,
		private readonly scene: PreviewScene
	) {
		this.slot = new OverlaySlot(parent);
	}

	get value(): ToolPreview | null {
		return this.current;
	}

	show(preview: Partial<ToolPreview> | null): void {
		this.current = preview
			? {
					solids: preview.solids ?? new Map(),
					added: preview.added ?? [],
					poses: preview.poses ?? new Map(),
					split: preview.split ?? new Map(),
				}
			: null;
		this.apply();
	}

	/** Draw the preview over the edit preview as it is now, after a rebuild too. */
	apply(): void {
		const preview = this.current;
		for (const [id, solid] of this.scene.solids) {
			const replaced = preview !== null && (preview.solids.has(id) || preview.split.has(id));
			solid.mesh.visible = !replaced;
			if (solid.guides) solid.guides.visible = !replaced;
		}
		const selection = this.scene.selection();
		if (selection) {
			selection.visible = !preview || (preview.solids.size === 0 && preview.added.length === 0);
		}
		this.pose(preview?.poses ?? null);
		if (!preview) {
			this.slot.clear();
			return;
		}

		const group = new Group();
		for (const [id, planes] of preview.solids) {
			const compiled = compileBrush(planes);
			const original = this.scene.solids.get(id)?.planes ?? planes;
			if (compiled) group.add(new Mesh(brushGeometry(compiled), this.scene.material(id, original)));
		}
		for (const halves of preview.split.values()) {
			halves.forEach((planes, index) => {
				const compiled = compileBrush(planes);
				if (compiled) group.add(new Mesh(brushGeometry(compiled), this.scene.half(index)));
			});
		}
		const added = preview.added.length > 0 ? ghostBrushes(preview.added) : null;
		if (added) group.add(added);
		this.slot.set(group);
	}

	/** Drop the preview without touching the edit preview, which a rebuild has replaced. */
	forget(): void {
		this.current = null;
		this.posed.clear();
		this.slot.clear();
	}

	private pose(poses: Map<string, PreviewPose> | null): void {
		for (const id of this.posed) {
			const object = this.scene.objects.get(id);
			if (object && !poses?.has(id)) this.scene.restore(id, object);
		}
		this.posed.clear();
		if (!poses) return;
		for (const [id, pose] of poses) {
			const object = this.scene.objects.get(id);
			if (!object) continue;
			object.position.set(pose.position.x, pose.position.y, pose.position.z);
			object.quaternion.set(
				pose.quaternion.x,
				pose.quaternion.y,
				pose.quaternion.z,
				pose.quaternion.w
			);
			object.scale.set(pose.scale.x, pose.scale.y, pose.scale.z);
			this.posed.add(id);
		}
	}
}
