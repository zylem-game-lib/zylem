/**
 * Static scenery doodads for the arena main stage.
 *
 * Pre-placed GLB "rock" props scattered across the arena floor. Each
 * doodad is registered as a static AABB with the wasm KCC up-front so
 * the local player is blocked from walking through them. Doodads are
 * authored by world-space `(x, z)` only — spawn `y` is sampled from
 * the ground heightfield and offset by a small {@link EMBED_DEPTH}
 * so the visible mesh sits slightly below the bowl surface for a
 * natural "half-buried" look.
 *
 * Wiring contract (see `main-stage.ts` for the call sites):
 *   1. `createDoodads({ sampleGroundHeight })` is called BEFORE the
 *      `Platformer3DRuntimeAdapter`. The handle's `entities` go into
 *      `stage.add(...)` and the handle's `staticColliders` get folded
 *      into the adapter's initial `staticColliders` list so the KCC
 *      blocks the player at every doodad's footprint from frame 0.
 *
 * These doodads are intentionally indestructible: no HP, no fracture
 * behavior, no particle bursts. The earlier destructible path has
 * been removed because the arena's combat resolves hits only against
 * enemies now.
 */

import { Box3, Object3D } from 'three';
import { createActor } from '@zylem/game-lib';
import type { ZylemRuntimeStaticBoxCollider } from '@zylem/game-lib/runtime';

import { demoAsset } from '../../../assets/manifest';

const rockBlueGlb = demoAsset('arena/models/doodads/rock-blue.glb');
const rockBlueSlantedGlb = demoAsset('arena/models/doodads/rock-blue-slanted.glb');
const rockStructureGlb = demoAsset('arena/models/doodads/rock-structure.glb');
const rockStructureMediumGlb = demoAsset('arena/models/doodads/rock-structure-medium.glb');
const rockStructureSmallGlb = demoAsset('arena/models/doodads/rock-structure-small.glb');
const spikeRedGlb = demoAsset('arena/models/doodads/spike-red.glb');

/** Identifier used by the GLB catalogue to keep places-vs-models loose. */
type DoodadKindId =
	| 'rock-structure'
	| 'rock-structure-medium'
	| 'rock-structure-small'
	| 'rock-blue'
	| 'rock-blue-slanted'
	| 'spike-red';

/**
 * Per-kind metadata: the visual model + axis-aligned half-extents
 * that are shared by both the wasm KCC static-box collider and the
 * TS Rapier static body (via `collisionShape: 'bounds'`). `halfExtents.y`
 * is authored per-kind so the KCC AABB is a solid 3D box instead of a
 * zero-height plate — this is what actually blocks the player on the
 * horizontal sweep.
 */
interface DoodadKind {
	id: DoodadKindId;
	model: string;
	scale: number;
	halfExtents: { x: number; y: number; z: number };
}

const multiplier = 5.0;

const DOODAD_KINDS: Record<DoodadKindId, DoodadKind> = {
	'rock-structure': {
		id: 'rock-structure',
		model: rockStructureGlb,
		scale: 1.5 * multiplier,
		halfExtents: { x: 1.8, y: 1.8, z: 1.8 },
	},
	'rock-structure-medium': {
		id: 'rock-structure-medium',
		model: rockStructureMediumGlb,
		scale: 1.2 * multiplier,
		halfExtents: { x: 1.4, y: 1.4, z: 1.4 },
	},
	'rock-structure-small': {
		id: 'rock-structure-small',
		model: rockStructureSmallGlb,
		scale: 1.0 * multiplier,
		halfExtents: { x: 1.0, y: 1.0, z: 1.0 },
	},
	'rock-blue': {
		id: 'rock-blue',
		model: rockBlueGlb,
		scale: 1.0 * multiplier,
		halfExtents: { x: 0.9, y: 0.8, z: 0.9 },
	},
	'rock-blue-slanted': {
		id: 'rock-blue-slanted',
		model: rockBlueSlantedGlb,
		scale: 1.0 * multiplier,
		halfExtents: { x: 0.9, y: 0.8, z: 0.9 },
	},
	'spike-red': {
		id: 'spike-red',
		model: spikeRedGlb,
		scale: 1.0 * multiplier,
		halfExtents: { x: 0.6, y: 1.0, z: 0.6 },
	},
};

interface DoodadSpec {
	kind: DoodadKindId;
	position: { x: number; y: number; z: number };
}

/**
 * Hand-placed doodad layout. ~18 positions scattered across the
 * ~100x100 arena, keeping an ~8-unit radius around origin clear for
 * the player spawn and staying within roughly `±38` so doodads don't
 * land on the steepest edge hills. Only `x` and `z` are honoured —
 * spawn `y` is overridden from the ground heightfield sampler — so
 * authored `y` is purely informational.
 *
 * The mix is intentionally uneven across the four quadrants so the
 * field reads as natural rubble rather than a uniform ring.
 */
function doodadSpecs(): DoodadSpec[] {
	return [
		// Inner play area (outside the spawn radius)
		{ kind: 'rock-blue', position: { x: 10, y: 0, z: 12 } },
		{ kind: 'rock-structure-small', position: { x: -13, y: 0, z: 9 } },
		{ kind: 'spike-red', position: { x: 14, y: 0, z: -10 } },
		{ kind: 'rock-blue-slanted', position: { x: -11, y: 0, z: -14 } },

		// Mid-field
		{ kind: 'rock-structure', position: { x: 22, y: 0, z: 14 } },
		{ kind: 'rock-structure-medium', position: { x: -18, y: 0, z: 28 } },
		{ kind: 'rock-structure-small', position: { x: 34, y: 0, z: -8 } },
		{ kind: 'rock-blue', position: { x: -30, y: 0, z: -20 } },
		{ kind: 'rock-blue-slanted', position: { x: 12, y: 0, z: -32 } },
		{ kind: 'spike-red', position: { x: -8, y: 0, z: 36 } },

		// Outer ring / bowl slopes
		{ kind: 'rock-structure', position: { x: -36, y: 0, z: 10 } },
		{ kind: 'rock-structure-medium', position: { x: 30, y: 0, z: 30 } },
		{ kind: 'rock-structure-small', position: { x: -26, y: 0, z: 36 } },
		{ kind: 'rock-blue', position: { x: 38, y: 0, z: -26 } },
		{ kind: 'rock-blue-slanted', position: { x: -22, y: 0, z: -34 } },
		{ kind: 'spike-red', position: { x: 26, y: 0, z: -36 } },
		{ kind: 'rock-structure-medium', position: { x: -38, y: 0, z: -6 } },
		{ kind: 'rock-structure-small', position: { x: 4, y: 0, z: 30 } },
	];
}

/**
 * Depth (world units) the doodad's *visible base* sits below the
 * sampled ground height at its `(x, z)`. Combined with the
 * {@link plantModelOnEntityFloor} shift below — which lines the
 * loaded GLB's lowest point up with the entity body origin — this
 * becomes the actual bury distance the player sees. Kept small so
 * the doodad reads as sitting naturally on the floor rather than
 * half-submerged.
 */
const EMBED_DEPTH = 0.1;

/**
 * Friction value used for each doodad's static AABB in the wasm KCC
 * mirror. Chosen to roughly match the arena's bowl heightfield
 * friction so a player sliding against a rock doesn't behave in
 * surprising ways.
 */
const DOODAD_COLLIDER_FRICTION = 0.95;

/** Identified collider used by the wasm KCC mirror. */
export type IdentifiedStaticBoxCollider =
	ZylemRuntimeStaticBoxCollider & { id: string };

export interface CreateDoodadsOptions {
	/**
	 * World-space ground-height sampler. Each doodad is placed at
	 * `sampleGroundHeight(x, z) - EMBED_DEPTH` so its body sits
	 * slightly embedded in the heightfield. Required — without it
	 * doodads would float on a flat `y = 0` plane above the bowl.
	 */
	sampleGroundHeight: (x: number, z: number) => number;
}

export interface DoodadsHandle {
	/** All doodad actor entities; pass straight into `stage.add(...)`. */
	readonly entities: ReadonlyArray<ReturnType<typeof createActor>>;
	/**
	 * Static AABBs for the wasm KCC, one per doodad. Fold these into
	 * the `Platformer3DRuntimeAdapter`'s initial `staticColliders`
	 * list so the local player is blocked from walking through each
	 * doodad's footprint from frame 0.
	 */
	readonly staticColliders: ReadonlyArray<IdentifiedStaticBoxCollider>;
}

/**
 * Compute the loaded model's bounding box in its own local frame,
 * detaching it from the entity group during the calculation so the
 * group's authored scale does not leak into the result. The box is
 * then re-attached unchanged. Returns `null` if no geometry was
 * found in the subtree (e.g. the GLB is still mid-load).
 *
 * The detach/restore dance is a one-frame stage edit; it runs once
 * per doodad on model load, before the entity is rendered, so users
 * never see the temporarily-detached state.
 */
function getLoadedModelLocalBounds(obj: Object3D): Box3 | null {
	const parent = obj.parent;
	const savedPos = obj.position.clone();
	const savedQuat = obj.quaternion.clone();
	const savedScale = obj.scale.clone();

	if (parent) parent.remove(obj);
	obj.position.set(0, 0, 0);
	obj.quaternion.set(0, 0, 0, 1);
	obj.scale.set(1, 1, 1);
	obj.updateMatrixWorld(true);

	const bbox = new Box3().setFromObject(obj);

	obj.position.copy(savedPos);
	obj.quaternion.copy(savedQuat);
	obj.scale.copy(savedScale);
	if (parent) parent.add(obj);
	obj.updateMatrixWorld(true);

	if (!isFinite(bbox.min.y)) return null;
	return bbox;
}

/**
 * Plant a doodad's loaded GLB so its geometry's lowest point lines
 * up with the entity's body translation.
 *
 * GLBs in this catalogue are authored with their origin at the
 * model's centroid, so without an offset the visible mesh extends
 * roughly half above and half below the body — the rocks read as
 * "half-buried" on the heightfield. Shifting the loaded object's
 * local Y up by `-bbox.min.y` (in the object's pre-scale frame)
 * raises the model so its base sits at the entity's body origin;
 * combined with the static AABB centred on that same origin, the
 * doodad reads as sitting naturally on the bowl floor with only
 * {@link EMBED_DEPTH} of the base buried.
 *
 * Returns `true` once the model has been planted so the caller can
 * skip subsequent invocations from re-bind events.
 */
function plantModelOnEntityFloor(
	entity: ReturnType<typeof createActor>,
): boolean {
	const obj = (entity as unknown as { object: Object3D | null }).object;
	if (!obj) return false;
	const bounds = getLoadedModelLocalBounds(obj);
	if (!bounds) return false;
	obj.position.y -= bounds.min.y;
	obj.updateMatrixWorld(true);
	return true;
}

/**
 * Build the arena's static doodad set. Every spec is anchored to the
 * supplied ground-height sampler, offset downward by {@link EMBED_DEPTH}
 * so the visible GLB reads as barely buried, and registered as a
 * static AABB for the KCC mirror. The Rapier side is `static: true`
 * too so nothing about these entities can move at runtime.
 */
export function createDoodads(
	options: CreateDoodadsOptions,
): DoodadsHandle {
	const { sampleGroundHeight } = options;

	const entities: Array<ReturnType<typeof createActor>> = [];
	const staticColliders: IdentifiedStaticBoxCollider[] = [];

	const specs = doodadSpecs();
	specs.forEach((spec, index) => {
		const kind = DOODAD_KINDS[spec.kind];
		const id = `doodad-${index}`;

		const groundY = sampleGroundHeight(spec.position.x, spec.position.z);
		const centerY = groundY - EMBED_DEPTH;

		const entity = createActor({
			name: `arena-doodad-${id}`,
			models: [kind.model],
			scale: { x: kind.scale, y: kind.scale, z: kind.scale },
			position: { x: spec.position.x, y: centerY, z: spec.position.z },
			collisionShape: 'bounds',
			collision: {
				size: {
					x: kind.halfExtents.x,
					y: kind.halfExtents.y,
					z: kind.halfExtents.z,
				},
				static: true,
			},
		});

		// Lift the GLB so its lowest vertex sits on the entity's body
		// origin; otherwise the centroid-origin models read as
		// "half-buried" on the heightfield. `planted` guards against
		// double-shifting when both `onSetup` and the model-loaded
		// event try to plant after the GLB resolves.
		let planted = false;
		const tryPlant = () => {
			if (planted) return;
			if (plantModelOnEntityFloor(entity)) planted = true;
		};
		entity.onSetup(tryPlant);
		entity.listen('entity:model:loaded', tryPlant);

		entities.push(entity);
		staticColliders.push({
			id,
			center: [spec.position.x, centerY, spec.position.z],
			halfExtents: [
				kind.halfExtents.x,
				kind.halfExtents.y,
				kind.halfExtents.z,
			],
			friction: DOODAD_COLLIDER_FRICTION,
		});
	});

	return {
		entities,
		staticColliders,
	};
}
