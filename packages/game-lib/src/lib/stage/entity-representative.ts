/**
 * The object drawn under the cursor while a placement is armed.
 *
 * It is not spawned. Spawning it would put a ghost in `childrenMap`, the
 * entity list, and the physics world, and the pointer ray would hit the thing
 * it is trying to place. The render object is cloned (geometry and materials
 * included, so disposing the throwaway source cannot blank the preview) and
 * parented to a scene group, the same idea as the editor's PlacementGhost.
 * Materials are kept, not replaced with a flat color, so a sprite still looks
 * like the sprite. Opacity is animated here; `onFrame` can drive the rest.
 */

import {
	Box3,
	BoxGeometry,
	Color,
	Group,
	Mesh,
	MeshBasicMaterial,
	Object3D,
	Scene,
	Vector3,
	type BufferGeometry,
	type ColorRepresentation,
	type Material,
} from 'three';
import { GameEntity } from '../entities/entity';
import { normalizeVec3, type Vec3Components, type Vec3Input } from '../core/vector';

export const DEFAULT_REPRESENTATIVE_OPACITY = 0.45;
export const DEFAULT_REPRESENTATIVE_FADE_IN = 0.12;
export const DEFAULT_REPRESENTATIVE_FADE_OUT = 0.1;

export interface RepresentativeLook {
	opacity?: number;
	color?: number | string;
}

export interface RepresentativeFrame {
	delta: number;
	opacity: number;
	setOpacity: (opacity: number) => void;
	valid: boolean;
	position: Vec3Components;
}

export interface EntityRepresentativeOptions {
	/** Resting opacity when a look doesn't override it. Defaults to 0.45. */
	opacity?: number;
	/** Seconds to fade in, and to fade between valid and invalid. */
	fadeIn?: number;
	/** Seconds to fade out when the session ends. */
	fadeOut?: number;
	valid?: RepresentativeLook;
	invalid?: RepresentativeLook;
	/** Added to the preview only. The spawned entity does not inherit it. */
	offset?: Vec3Input;
	onFrame?: (state: RepresentativeFrame) => void;
}

export type RepresentativeSource =
	| GameEntity<any>
	| (() => GameEntity<any>);

export interface EntityRepresentative {
	source: RepresentativeSource;
	options: EntityRepresentativeOptions;
}

/** What follows the cursor. The stage builds the preview when the session arms. */
export function entityRepresentative(
	source: RepresentativeSource,
	options?: EntityRepresentativeOptions,
): EntityRepresentative {
	return { source, options: options ?? {} };
}

type TintableMaterial = Material & {
	color?: Color;
	opacity: number;
	transparent: boolean;
	depthWrite: boolean;
};

interface BuiltPreview {
	object: Object3D;
	materials: TintableMaterial[];
	extent: Vector3 | null;
}

/**
 * Scene overlay for one armed representative.
 *
 * Opacity eases from its current value to the next target over `fadeIn` /
 * `fadeOut`. The clock restarts only when that target changes, so a steady
 * valid look does not flicker back to transparent every frame.
 */
export class EntityRepresentativeView {
	readonly container: Group;
	readonly fadeOutDuration: number;
	private readonly materials: TintableMaterial[] = [];
	private readonly offset: Vector3;
	private readonly onFrame: EntityRepresentativeOptions['onFrame'];
	private extent: Vector3 | null = null;
	private display = 0;
	private from = 0;
	private to = 0;
	private elapsed = 0;
	private duration = 0;
	private targetOpacity = Number.NaN;
	private colorKey = '\0';
	private tint: Color | null = null;

	constructor(scene: Scene, representative: EntityRepresentative) {
		const options = representative.options;
		this.fadeOutDuration = options.fadeOut ?? DEFAULT_REPRESENTATIVE_FADE_OUT;
		this.onFrame = options.onFrame;
		const offset = normalizeVec3(options.offset, { x: 0, y: 0, z: 0 });
		this.offset = new Vector3(offset.x, offset.y, offset.z);

		this.container = new Group();
		this.container.name = 'EntityRepresentative';
		this.container.visible = false;
		scene.add(this.container);

		const built = buildPreview(representative);
		this.materials = built.materials;
		this.extent = built.extent;
		this.container.add(built.object);
		this.applyVisual();
	}

	get opacity(): number {
		return this.display;
	}

	get fadeCompleted(): boolean {
		return this.duration <= 0 || this.elapsed >= this.duration - 1e-8;
	}

	/** World-space size of the silhouette, for resting it on a surface. */
	measure(): Vector3 | null {
		return this.extent ? this.extent.clone() : null;
	}

	/**
	 * Ease toward the look for the current cursor. No-ops when the opacity and
	 * tint are already the ones in flight, so the fade is not restarted.
	 */
	setLook(
		look: RepresentativeLook | undefined,
		duration: number,
		fallbackOpacity: number,
	): void {
		const opacity = look?.opacity ?? fallbackOpacity;
		const colorKey = look?.color == null ? '' : String(look.color);
		if (opacity === this.targetOpacity && colorKey === this.colorKey) return;
		this.colorKey = colorKey;
		this.tint = colorFrom(look?.color);
		this.fadeTo(opacity, duration);
	}

	fadeTo(opacity: number, duration: number): void {
		this.targetOpacity = opacity;
		this.from = this.display;
		this.to = opacity;
		this.elapsed = 0;
		this.duration = Math.max(0, duration);
		if (this.duration <= 0) {
			this.display = this.to;
			this.applyVisual();
		}
	}

	showAt(position: Vector3): void {
		this.container.position.copy(position);
		if (this.offset.lengthSq() > 0) this.container.position.add(this.offset);
		this.container.visible = true;
	}

	hide(): void {
		this.container.visible = false;
	}

	advance(delta: number, frame: { valid: boolean; position: Vec3Components }): void {
		if (this.duration <= 0) {
			this.display = this.to;
		} else {
			this.elapsed += Math.max(0, delta);
			const t = Math.min(1, this.elapsed / this.duration);
			this.display = this.from + (this.to - this.from) * t;
		}

		let opacity = this.display;
		this.onFrame?.({
			delta,
			opacity,
			setOpacity: (value) => {
				opacity = value;
			},
			valid: frame.valid,
			position: frame.position,
		});
		this.display = opacity;
		this.applyVisual();
	}

	dispose(): void {
		this.container.removeFromParent();
		disposeOwned(this.container);
		this.materials.length = 0;
	}

	private applyVisual(): void {
		for (const material of this.materials) {
			material.opacity = this.display;
			material.transparent = true;
			material.depthWrite = false;
			const base = material.userData.representativeBaseColor as Color | undefined;
			if (!material.color) continue;
			if (this.tint) material.color.copy(this.tint);
			else if (base) material.color.copy(base);
		}
	}
}

function colorFrom(color: number | string | undefined): Color | null {
	if (color == null) return null;
	try {
		return new Color(color as ColorRepresentation);
	} catch {
		return null;
	}
}

function buildPreview(representative: EntityRepresentative): BuiltPreview {
	const produced = produceSource(representative.source);
	const owned = typeof representative.source === 'function';
	const size = sizeOf(produced);
	let object = produced ? cloneRenderRoot(produced) : null;
	if (owned && produced) disposeUnspawned(produced, object);

	if (!object) {
		object = new Mesh(
			new BoxGeometry(size.x, size.y, size.z),
			ghostMaterial(new MeshBasicMaterial({ color: 0xffffff })),
		);
	}

	object.position.set(0, 0, 0);
	const materials: TintableMaterial[] = [];
	object.traverse((node) => {
		const mesh = node as Mesh;
		const material = mesh.material as Material | Material[] | undefined;
		if (!material) return;
		const list = Array.isArray(material) ? material : [material];
		for (const entry of list) materials.push(entry as TintableMaterial);
	});

	const bounds = new Box3().setFromObject(object);
	const extent = bounds.isEmpty() ? size : bounds.getSize(new Vector3());
	return { object, materials, extent };
}

function produceSource(source: RepresentativeSource): GameEntity<any> | null {
	try {
		const entity = typeof source === 'function' ? source() : source;
		if (!entity || typeof (entity as { then?: unknown }).then === 'function') {
			return null;
		}
		if (!entity.group && !entity.mesh && typeof entity.create === 'function') {
			const created = entity.create();
			if (created && typeof (created as { then?: unknown }).then === 'function') {
				return null;
			}
		}
		return entity;
	} catch (error) {
		console.warn('[zylem] entity representative: the source failed, using a box', error);
		return null;
	}
}

function sizeOf(entity: GameEntity<any> | null): Vector3 {
	const size = normalizeVec3(entity?.options?.size, { x: 1, y: 1, z: 1 });
	return new Vector3(
		size.x > 0 ? size.x : 1,
		size.y > 0 ? size.y : 1,
		size.z > 0 ? size.z : 1,
	);
}

function cloneRenderRoot(entity: GameEntity<any>): Object3D | null {
	const root = entity.group ?? entity.mesh;
	if (!root) return null;
	const clone = root.clone(true);
	const sourceNodes: Object3D[] = [];
	const cloneNodes: Object3D[] = [];
	root.traverse((node) => sourceNodes.push(node));
	clone.traverse((node) => cloneNodes.push(node));

	for (let i = 0; i < sourceNodes.length; i++) {
		const original = sourceNodes[i] as Mesh;
		const copied = cloneNodes[i] as Mesh;
		if (original.geometry) copied.geometry = original.geometry.clone();
		if (original.material) {
			copied.material = Array.isArray(original.material)
				? original.material.map((material) => ghostMaterial(material))
				: ghostMaterial(original.material);
		}
		copied.castShadow = false;
		copied.receiveShadow = false;
	}
	return clone;
}

function ghostMaterial(source: Material): Material {
	const material = source.clone() as TintableMaterial;
	material.transparent = true;
	material.depthWrite = false;
	if (material.color?.clone) {
		material.userData.representativeBaseColor = material.color.clone();
	}
	return material;
}

/** Drop the throwaway source without freeing geometry the preview now owns. */
function disposeUnspawned(entity: GameEntity<any>, preview: Object3D | null): void {
	const keep = new Set<BufferGeometry | Material>();
	preview?.traverse((node) => {
		const mesh = node as Mesh;
		if (mesh.geometry) keep.add(mesh.geometry);
		const material = mesh.material as Material | Material[] | undefined;
		if (!material) return;
		for (const entry of Array.isArray(material) ? material : [material]) keep.add(entry);
	});
	const root = entity.group ?? entity.mesh;
	if (!root) return;
	disposeOwned(root, keep);
}

function disposeOwned(root: Object3D, keep?: Set<BufferGeometry | Material>): void {
	root.traverse((node) => {
		const mesh = node as Mesh;
		if (mesh.geometry && !keep?.has(mesh.geometry)) mesh.geometry.dispose();
		const material = mesh.material as Material | Material[] | undefined;
		if (!material) return;
		for (const entry of Array.isArray(material) ? material : [material]) {
			if (!keep?.has(entry)) entry.dispose();
		}
	});
}
