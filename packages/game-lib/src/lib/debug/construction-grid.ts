/**
 * The construction plane, drawn so the snap lattice is legible. It lies on
 * y=0 unless a level draw lays it on the draw plane.
 *
 * Two overlaid grids: fine lines at the translation snap increment, and heavier
 * lines every metre. Without the coarse pass a 0.25 grid over any useful area
 * reads as flat grey noise.
 */

import { GridHelper, Group, Matrix4, Vector3, type Scene } from 'three';

const FINE_COLOR = 0x2f3947;
const COARSE_COLOR = 0x4a5568;

/** Half-width of the drawn area, in world units. */
const EXTENT = 20;

/** How far a plane grid sits off its plane, so it does not fight the face it lies on. */
const PLANE_LIFT = 2e-3;

interface GridPoint {
	x: number;
	y: number;
	z: number;
}

/** A plane as a draw frame names it: a point on it, its in-plane `u`, and its normal. */
export interface GridPlane {
	origin: GridPoint;
	u: GridPoint;
	normal: GridPoint;
}

const _u = new Vector3();
const _normal = new Vector3();
const _w = new Vector3();
const _offset = new Vector3();
const _basis = new Matrix4();

export class ConstructionGrid {
	private group = new Group();
	private scene: Scene | null = null;
	private fine: GridHelper | null = null;
	private coarse: GridHelper | null = null;
	private increment = 0;

	constructor() {
		this.group.name = '__zylem_construction_grid__';
		// Behind the gizmo but still unlit and untouched by tone mapping.
		this.group.renderOrder = -1;
		this.group.visible = false;
	}

	addTo(scene: Scene): void {
		if (this.scene === scene) return;
		this.scene = scene;
		scene.add(this.group);
	}

	/** Rebuild only when the increment actually changed; this allocates. */
	setIncrement(increment: number): void {
		if (increment <= 0 || increment === this.increment) return;
		this.increment = increment;
		this.rebuild();
	}

	setVisible(visible: boolean): void {
		this.group.visible = visible;
	}

	get visible(): boolean {
		return this.group.visible;
	}

	/**
	 * Lay the grid on a plane, or back on y=0 with `null`.
	 *
	 * The plane's `u` runs along the grid's X. The grid centres on the lines
	 * nearest `focus`, shifted by whole cells, so it stays on the world lattice.
	 */
	setPlane(plane: GridPlane | null, focus?: GridPoint): void {
		if (!plane) {
			this.group.position.set(0, 0, 0);
			this.group.quaternion.identity();
			return;
		}
		_u.set(plane.u.x, plane.u.y, plane.u.z).normalize();
		_normal.set(plane.normal.x, plane.normal.y, plane.normal.z).normalize();
		_w.crossVectors(_u, _normal);
		this.group.quaternion.setFromRotationMatrix(_basis.makeBasis(_u, _normal, _w));
		this.group.position.set(plane.origin.x, plane.origin.y, plane.origin.z);
		if (focus) {
			const cell = this.wholeCell();
			_offset.set(focus.x, focus.y, focus.z).sub(this.group.position);
			this.group.position
				.addScaledVector(_u, Math.round(_offset.dot(_u) / cell) * cell)
				.addScaledVector(_w, Math.round(_offset.dot(_w) / cell) * cell);
		}
		this.group.position.addScaledVector(_normal, PLANE_LIFT);
	}

	dispose(): void {
		this.clearHelpers();
		this.scene?.remove(this.group);
		this.scene = null;
	}

	private rebuild(): void {
		this.clearHelpers();

		const size = EXTENT * 2;
		const fineDivisions = Math.round(size / this.increment);
		// A 0.25 grid across 40 units is 160 divisions; anything finer than this
		// is more geometry than it is guidance.
		if (fineDivisions > 0 && fineDivisions <= 400) {
			this.fine = new GridHelper(size, fineDivisions, FINE_COLOR, FINE_COLOR);
			this.fine.material.transparent = true;
			this.fine.material.opacity = 0.35;
			this.fine.material.depthWrite = false;
			this.group.add(this.fine);
		}

		this.coarse = new GridHelper(size, size, COARSE_COLOR, COARSE_COLOR);
		this.coarse.material.transparent = true;
		this.coarse.material.opacity = 0.6;
		this.coarse.material.depthWrite = false;
		this.group.add(this.coarse);
	}

	/** The shortest shift that is whole fine steps and whole metres, so neither set of lines moves. */
	private wholeCell(): number {
		const step = this.increment > 0 ? this.increment : 1;
		for (let count = 1; count <= 64; count += 1) {
			const cell = step * count;
			if (cell >= 1 - 1e-6 && Math.abs(cell - Math.round(cell)) < 1e-6) return cell;
		}
		return Math.max(1, step);
	}

	private clearHelpers(): void {
		for (const helper of [this.fine, this.coarse]) {
			if (!helper) continue;
			this.group.remove(helper);
			helper.geometry.dispose();
			helper.material.dispose();
		}
		this.fine = null;
		this.coarse = null;
	}
}
