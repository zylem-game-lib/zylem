/**
 * The y=0 construction plane, drawn so the snap lattice is legible.
 *
 * Two overlaid grids: fine lines at the translation snap increment, and heavier
 * lines every metre. Without the coarse pass a 0.25 grid over any useful area
 * reads as flat grey noise.
 */

import { GridHelper, Group, type Scene } from 'three';

const FINE_COLOR = 0x2f3947;
const COARSE_COLOR = 0x4a5568;

/** Half-width of the drawn area, in world units. */
const EXTENT = 20;

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
