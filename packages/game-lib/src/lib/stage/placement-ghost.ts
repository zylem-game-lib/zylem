/**
 * Translucent preview of what the Add tool is about to place, following the
 * cursor.
 *
 * The silhouette comes from the armed type's own factory rather than a shape
 * hand-written per type, so a host that registers its own entities gets an
 * accurate preview with no extra code. The entity the factory returns is never
 * spawned — only its render object is borrowed and cloned — so the ghost never
 * reaches `childrenMap`, the editor's entity list, thumbnails, or the physics
 * world. It is added straight to the scene like `DebugEntityCursor`, for the
 * same reason.
 */

import {
	Box3,
	BoxGeometry,
	Group,
	Mesh,
	MeshBasicMaterial,
	Object3D,
	Scene,
	Vector3,
} from 'three';

import { getEntityType, type EntityTypeRegistration } from '../entities/entity-registry';

/** Built at the origin, because the container carries the placement position. */
const GHOST_ORIGIN = { x: 0, y: 0, z: 0 };

const GHOST_COLOR = 0x6cc4ff;
const GHOST_OPACITY = 0.35;

function ghostMaterial(): MeshBasicMaterial {
	return new MeshBasicMaterial({
		color: GHOST_COLOR,
		transparent: true,
		opacity: GHOST_OPACITY,
		// Occluded by solid geometry in front of it, but never occludes its own
		// far faces — the preview should read as see-through, not as a solid.
		depthWrite: false,
	});
}

function sizeFromProps(props: Record<string, unknown>): Vector3 {
	const size = props.size as { x?: number; y?: number; z?: number } | undefined;
	return new Vector3(size?.x ?? 1, size?.y ?? 1, size?.z ?? 1);
}

/**
 * The render object the type's own factory builds, or null when it cannot be
 * had synchronously.
 *
 * Types that build their visuals during spawn (lights, text) or load a model
 * asynchronously give nothing back here, and the caller falls back to a box.
 */
function borrowRenderObject(
	registration: EntityTypeRegistration,
	props: Record<string, unknown>,
): Object3D | null {
	try {
		const node = registration.create({ position: GHOST_ORIGIN, props });
		// A factory that resolves later is no use to a preview that has to be on
		// screen this frame.
		if (!node || typeof (node as Promise<unknown>).then === 'function') {
			return null;
		}
		const source = node as { group?: Object3D; mesh?: Object3D };
		const object = source.group ?? source.mesh ?? null;
		return object ? object.clone() : null;
	} catch (error) {
		console.warn(
			`[zylem] placement ghost: the "${registration.id}" factory failed, `
			+ 'falling back to a box',
			error,
		);
		return null;
	}
}

/** Swap in the ghost look, and stop the preview casting real shadows. */
function applyGhostMaterial(object: Object3D, material: MeshBasicMaterial): void {
	object.traverse((child) => {
		const mesh = child as Mesh;
		if (!mesh.isMesh) return;
		mesh.material = material;
		mesh.castShadow = false;
		mesh.receiveShadow = false;
	});
}

export class PlacementGhost {
	private scene: Scene;
	private container: Group;
	/** What the current silhouette was built for, so it rebuilds only on change. */
	private builtFor: string | null = null;
	private builtProps: Record<string, unknown> | null = null;
	private material: MeshBasicMaterial | null = null;
	/** Cached at build time: the silhouette's extent never changes as it moves. */
	private extent: Vector3 | null = null;
	private bounds = new Box3();

	constructor(scene: Scene) {
		this.scene = scene;
		this.container = new Group();
		this.container.name = 'PlacementGhost';
		this.container.visible = false;
		this.scene.add(this.container);
	}

	/**
	 * Point the ghost at an entity type. Called every frame while the tool is
	 * armed, so it rebuilds only when the type or its props actually change —
	 * running a factory and allocating geometry per frame would be wasted work
	 * for a mesh that only moves.
	 *
	 * Props are compared by identity rather than by value: a change replaces the
	 * whole object, and deep-comparing arbitrary host props every frame would
	 * cost more than the rebuild it saves.
	 */
	setType(typeId: string | null, props?: Record<string, unknown> | null): void {
		const nextProps = props ?? null;
		if (typeId === this.builtFor && nextProps === this.builtProps) return;
		this.builtFor = typeId;
		this.builtProps = nextProps;
		this.clearSilhouette();

		if (!typeId) {
			this.hide();
			return;
		}

		const registration = getEntityType(typeId);
		const merged = {
			...(registration?.defaultProps ?? {}),
			...(props ?? {}),
		} as Record<string, unknown>;

		const borrowed = registration
			? borrowRenderObject(registration, merged)
			: null;
		const object = borrowed
			?? new Mesh(
				new BoxGeometry(...sizeFromProps(merged).toArray()),
			);

		// The container owns the placement position, so any offset the factory
		// baked into the object itself would double up.
		object.position.set(0, 0, 0);

		this.material = ghostMaterial();
		applyGhostMaterial(object, this.material);
		this.container.add(object);

		this.bounds.setFromObject(object);
		this.extent = this.bounds.isEmpty()
			? null
			: this.bounds.getSize(new Vector3());
	}

	/**
	 * The silhouette's world-space size, for the surface rest offset — the ghost
	 * knows its own bounds, so the preview can show the true resting position
	 * rather than the un-lifted point.
	 */
	measure(): Vector3 | null {
		return this.extent;
	}

	showAt(position: Vector3): void {
		if (this.container.children.length === 0) {
			this.hide();
			return;
		}
		this.container.position.copy(position);
		this.container.visible = true;
	}

	hide(): void {
		this.container.visible = false;
	}

	dispose(): void {
		this.clearSilhouette();
		this.scene.remove(this.container);
		this.builtFor = null;
		this.builtProps = null;
	}

	/** Drop the current mesh and everything allocated for it. */
	private clearSilhouette(): void {
		for (const child of [...this.container.children]) {
			this.container.remove(child);
			child.traverse((node) => {
				const mesh = node as Mesh;
				if (mesh.isMesh) mesh.geometry?.dispose();
			});
		}
		this.material?.dispose();
		this.material = null;
		this.extent = null;
	}
}
