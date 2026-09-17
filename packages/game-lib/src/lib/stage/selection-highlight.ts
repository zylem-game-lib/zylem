/**
 * Outlines every selected entity.
 *
 * The hover cursor shows one box under the pointer; once several entities can
 * be selected, the selection needs its own persistent marks or a marquee's
 * result is invisible until a gizmo tool is armed. One wireframe box per
 * selected entity, pooled and re-fitted each frame so entities that move
 * (or a paused scene being edited) stay outlined.
 *
 * Fed world-space boxes rather than objects, so the caller decides what an
 * entity's selection view is (see `debug/selection-bounds.ts`) and this
 * class only draws.
 *
 * All boxes share a unit edges geometry and one material; each is placed by
 * scaling and positioning its own `LineSegments`, so a frame costs no
 * geometry allocation regardless of how many entities are selected.
 */
import {
	type Box3,
	BoxGeometry,
	Color,
	EdgesGeometry,
	Group,
	LineBasicMaterial,
	LineSegments,
	type Scene,
	Vector3,
} from 'three';

const _size = new Vector3();
const _center = new Vector3();

export class SelectionHighlight {
	private readonly scene: Scene;
	private readonly container = new Group();
	private readonly edges: EdgesGeometry;
	private readonly material: LineBasicMaterial;
	private readonly pool: LineSegments[] = [];

	constructor(scene: Scene, color: Color | number = 0xffd23f) {
		this.scene = scene;
		const unit = new BoxGeometry(1, 1, 1);
		this.edges = new EdgesGeometry(unit);
		unit.dispose();
		this.material = new LineBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.9 });
		this.container.name = 'SelectionHighlight';
		this.container.renderOrder = 999;
		this.scene.add(this.container);
	}

	setColor(color: Color | number): void {
		this.material.color.set(color as Color);
	}

	/**
	 * Fit one outline to each world-space box, hiding surplus pooled boxes.
	 * Empty or non-finite boxes get no outline rather than a degenerate one.
	 */
	update(boxes: Iterable<Box3>): void {
		let used = 0;
		for (const box of boxes) {
			if (box.isEmpty() || !Number.isFinite(box.min.x) || !Number.isFinite(box.max.x)) {
				continue;
			}
			box.getSize(_size);
			box.getCenter(_center);

			const lines = this.acquire(used);
			used += 1;
			lines.position.copy(_center);
			lines.scale.set(
				Math.max(_size.x, 1e-6),
				Math.max(_size.y, 1e-6),
				Math.max(_size.z, 1e-6),
			);
			lines.visible = true;
		}
		for (let index = used; index < this.pool.length; index += 1) {
			this.pool[index]!.visible = false;
		}
	}

	hide(): void {
		for (const lines of this.pool) lines.visible = false;
	}

	dispose(): void {
		this.scene.remove(this.container);
		this.edges.dispose();
		this.material.dispose();
		this.pool.length = 0;
	}

	private acquire(index: number): LineSegments {
		const existing = this.pool[index];
		if (existing) return existing;
		const lines = new LineSegments(this.edges, this.material);
		lines.frustumCulled = false;
		this.container.add(lines);
		this.pool.push(lines);
		return lines;
	}
}
