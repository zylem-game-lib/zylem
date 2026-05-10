import {
	Color,
	Material,
	Mesh,
	MeshBasicMaterial,
	type Object3D,
	TorusGeometry,
} from 'three';
import { createSphere } from '@zylem/game-lib/entity';
import { type UpdateContext } from '@zylem/game-lib/core';

/**
 * Visual treatment for the placeholder ring shown while a character actor
 * is loading. Tuned to read as a soft "preparing" pulse rather than a
 * gameplay HUD element — saturation is kept moderate, the arc is a partial
 * torus so the rotation is visible (a full ring is rotation-invariant), and
 * the spin speed sits comfortably between "obviously alive" and "frantic".
 */
const RING_COLOR = new Color(0x6cf0ff);
const RING_RADIUS = 0.55;
const RING_TUBE = 0.06;
const RING_BASE_OPACITY = 0.85;
const RING_ARC = Math.PI * 1.4;
const RING_HEIGHT_OFFSET = 0.02;
const SPIN_SPEED = 5.0;
const FADE_DURATION_S = 0.35;

type FadeMaterial = Material & {
	transparent: boolean;
	opacity: number;
	needsUpdate: boolean;
	depthWrite?: boolean;
};

export type LoadingIndicatorEntity = ReturnType<typeof createSphere>;

/**
 * Public surface for a loading indicator: the underlying entity (so the
 * caller can `stage.add(indicator.entity)` and remove it by uuid later)
 * and a `startFadeOut()` trigger. The fade-out itself is driven by the
 * entity's own per-frame update, so once `startFadeOut()` is called the
 * indicator self-disposes its visible mesh on completion.
 */
export interface LoadingIndicator {
	entity: LoadingIndicatorEntity;
	startFadeOut(): void;
}

/**
 * Build a self-contained "loading" indicator at `position`: a flat,
 * partially-transparent ring that spins around the world Y axis. The
 * ring is built on top of a {@link createSphere} entity (with a
 * placeholder near-zero radius) so it inherits the existing entity
 * lifecycle — group attachment, position transform, cleanup on stage
 * teardown — without needing a bespoke entity class.
 *
 * Physics is opted out via `runtime.simulation = 'runtime'` so the
 * indicator never spawns a Rapier body or collider; it is purely a
 * visual marker.
 */
export function createLoadingIndicator(
	position: { x: number; y: number; z: number },
): LoadingIndicator {
	// `createSphere` always wires up a Rapier collider; flagging the
	// indicator as static + sensor keeps it pinned in place under arena
	// gravity (the indicator is purely decorative) and prevents it from
	// blocking the player or damaging anything that brushes past while
	// the character is loading.
	const entity = createSphere({
		position,
		radius: 0.001,
		material: { color: RING_COLOR },
		collision: { static: true, sensor: true },
	});

	(entity.options as { runtime?: { simulation: string } }).runtime = {
		simulation: 'runtime',
	};

	let ringMesh: Mesh | null = null;
	let ringMaterial: MeshBasicMaterial | null = null;
	let fadeOut = false;
	let fadeElapsed = 0;
	let disposed = false;

	entity.onSetup(({ me }: any) => {
		const sphere = me.mesh as Mesh | undefined;
		if (!sphere) return;

		sphere.geometry?.dispose?.();
		sphere.geometry = new TorusGeometry(RING_RADIUS, RING_TUBE, 16, 64, RING_ARC);

		const previousMaterial = sphere.material;
		if (Array.isArray(previousMaterial)) {
			previousMaterial.forEach((m) => (m as Material)?.dispose?.());
		} else {
			(previousMaterial as Material | undefined)?.dispose?.();
		}

		ringMaterial = new MeshBasicMaterial({
			color: RING_COLOR,
			transparent: true,
			opacity: RING_BASE_OPACITY,
			depthWrite: false,
		});
		sphere.material = ringMaterial;
		sphere.castShadow = false;
		sphere.receiveShadow = false;
		// Lay the torus flat so it reads as a ring on the ground. After this
		// rotation, spinning the mesh around its local Z axis becomes a yaw
		// spin in world space.
		// sphere.rotation.x = -Math.PI / 2;
		sphere.position.y += RING_HEIGHT_OFFSET;
		ringMesh = sphere;
	});

	entity.onUpdate(({ delta, me }: UpdateContext<any>) => {
		if (!ringMesh) return;
		me.rotateZ(-SPIN_SPEED * delta);

		if (!ringMesh || !ringMaterial) return;

		if (!fadeOut || disposed) return;

		fadeElapsed += delta;
		const t = Math.min(1, fadeElapsed / FADE_DURATION_S);
		ringMaterial.opacity = RING_BASE_OPACITY * (1 - t);
		if (t < 1) return;

		disposed = true;
		ringMesh.removeFromParent();
		ringMesh.geometry?.dispose?.();
		ringMaterial.dispose();
		ringMesh = null;
		ringMaterial = null;
	});

	return {
		entity,
		startFadeOut() {
			if (fadeOut) return;
			fadeOut = true;
			fadeElapsed = 0;
		},
	};
}

/**
 * Set every material under `root` to opacity 0 / transparent so the
 * actor is invisible until {@link runActorFadeIn} drives it back up to 1.
 *
 * Materials that don't support transparency (none of our PBR / standard
 * stack falls into this, but defensive code anyway) are left alone.
 */
function collectFadeableMaterials(root: Object3D | null | undefined): FadeMaterial[] {
	if (!root) return [];
	const out: FadeMaterial[] = [];
	root.traverse((child) => {
		if (!(child as { isMesh?: boolean }).isMesh) return;
		const mesh = child as Mesh;
		const apply = (m: Material) => {
			if (!('opacity' in m) || !('transparent' in m)) return;
			out.push(m as FadeMaterial);
		};
		if (Array.isArray(mesh.material)) {
			mesh.material.forEach(apply);
		} else if (mesh.material) {
			apply(mesh.material);
		}
	});
	return out;
}

/**
 * Animate every mesh under `actor.group` from opacity 0 → 1 over
 * {@link FADE_DURATION_S} seconds the next time the actor is updated.
 *
 * Call this once the loaded model is fully presentable (i.e. its PBR
 * textures have been swapped in) so the player doesn't see the bare-FBX
 * material flash before the textured pose appears.
 *
 * Restoring `transparent = false` once the fade completes keeps the
 * character in the renderer's opaque pass and avoids the depth-sorting
 * artefacts that semi-transparent characters can pick up against the
 * arena scenery.
 */
export function fadeInActor(actor: any): void {
	const materials = collectFadeableMaterials(actor.group);
	if (materials.length === 0) return;

	for (const material of materials) {
		material.transparent = true;
		material.opacity = 0;
		material.needsUpdate = true;
	}
	// `bindPbrTextures` hides the group while the textures resolve so we
	// don't flash bare FBX materials. Now that PBR is applied and the
	// fade is wired up, restore visibility — the meshes are still at
	// opacity 0 so the next frame can drive them up cleanly.
	if (actor.group) {
		actor.group.visible = true;
	}

	let elapsed = 0;
	let done = false;
	actor.onUpdate(({ delta }: UpdateContext<any>) => {
		if (done) return;
		elapsed += delta;
		const t = Math.min(1, elapsed / FADE_DURATION_S);
		for (const material of materials) {
			material.opacity = t;
		}
		if (t < 1) return;

		done = true;
		for (const material of materials) {
			material.transparent = false;
			material.needsUpdate = true;
		}
	});
}
