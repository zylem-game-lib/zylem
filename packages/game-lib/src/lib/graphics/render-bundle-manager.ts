/**
 * `RenderBundleManager` — owns the Three.js (WebGPU) render side of the
 * WASM-owned-transforms pipeline.
 *
 * Each frame, {@link RenderBundleManager.sync} pulls every registered entity's
 * transform from the physics bridge (i.e. the wasm render buffer) and writes it
 * onto the entity's renderable. The manager never simulates anything — it only
 * draws what WASM reports.
 *
 * `BundleGroup`s are WebGPU render bundles: they record their draw commands once
 * and replay them, which is only valid for content that never moves. Because of
 * this, **bundles are used exclusively for static meshes** (an entity whose
 * `options.runtime.body === 'static'`). Everything that can move renders
 * directly in the scene.
 *
 * Three render strategies live behind one API:
 *  - **static object** — the entity's own `Object3D` is parented into a static
 *    `BundleGroup`. Its transform is written each frame, but since the body
 *    never moves the bundle simply records it once.
 *  - **dynamic object** — the entity's own `Object3D` is parented directly under
 *    the scene and its TRS is written each frame (no bundle).
 *  - **instanced** — high-count repeats sharing a geometry+material are drawn by
 *    a single scene-direct `InstancedMesh`, delegated to the proven
 *    {@link RuntimeInstanceManager} (which creates the mesh once at the exact
 *    batch count). Opt in via `options.batched`,
 *    `options.runtime.render === 'instanced'`, or a pre-flagged
 *    `entity.isInstanced`. Instanced meshes are never bundled.
 *
 * Entities that render themselves (e.g. particle systems) opt out entirely with
 * `options.runtime.render === 'none'`; {@link RenderBundleManager.register}
 * returns `null` for them so the caller can add them to the scene directly.
 */
import {
	InstancedMesh,
	Matrix4,
	Object3D,
	Quaternion,
	Raycaster,
	Vector3,
} from 'three';
import { BundleGroup } from 'three/webgpu';

import type { GameEntity } from '../entities/entity';
import { InstanceManager } from './instance-manager';
import { RuntimeInstanceManager } from './runtime-instance-manager';
import type { BridgeTransform } from '../runtime/stage-physics-bridge';

/** Callback that resolves an entity's interpolated transform by wasm handle. */
export type SlotTransformResolver = (
	handle: number,
	out: BridgeTransform,
) => BridgeTransform | null;

type Registration =
	| { kind: 'object'; entity: GameEntity<any>; object: Object3D; bundleKey: string; parent: Object3D }
	| { kind: 'instanced'; entity: GameEntity<any>; bundleKey: string };

/**
 * Groups static entity renderables into WebGPU render bundles, renders dynamic
 * and instanced renderables directly in the scene, and syncs every registered
 * entity's transform from the wasm physics bridge each frame.
 */
export class RenderBundleManager {
	private readonly scene: Object3D;

	/** Object-path bundle groups (static meshes only), keyed by render-group key. */
	private readonly bundles = new Map<string, BundleGroup>();
	private readonly registered = new Map<string, Registration>();

	/**
	 * Proven instanced renderer for high-count repeats. It owns one scene-direct
	 * `InstancedMesh` per batch key, created at the exact instance count — the
	 * pattern that renders correctly under the WebGPU/WebGL backend.
	 */
	private readonly runtimeInstances = new RuntimeInstanceManager();
	/** Instanced entities per batch key, in stable slot order (index === slot). */
	private readonly instancedEntities = new Map<string, GameEntity<any>[]>();
	/** Live `InstancedMesh` per batch key, created lazily once the count is known. */
	private readonly instancedMeshes = new Map<string, InstancedMesh>();
	/** Batch keys whose membership changed and whose mesh must be (re)built. */
	private readonly instancedDirty = new Set<string>();

	private readonly _pos = new Vector3();
	private readonly _quat = new Quaternion();
	private readonly _scale = new Vector3(1, 1, 1);
	private readonly _matrix = new Matrix4();
	private readonly _scratch: BridgeTransform = {
		position: [0, 0, 0],
		rotation: [0, 0, 0, 1],
		scale: 1,
		custom: [0, 0, 0, 0],
	};

	constructor(scene: Object3D) {
		this.scene = scene;
		this.runtimeInstances.setScene(scene);
	}

	/**
	 * Register an entity into the appropriate render path: a static `BundleGroup`
	 * for non-moving object meshes, a scene-direct `Object3D` for moving meshes,
	 * or a scene-direct `InstancedMesh` for high-count repeats.
	 *
	 * @returns The render-group key the entity was placed into, or `null` when the
	 *          entity opts out (`render: 'none'`) or has no renderable yet.
	 */
	register(entity: GameEntity<any>): string | null {
		if (this.registered.has(entity.uuid)) {
			return this.registered.get(entity.uuid)!.bundleKey;
		}
		const renderMode = entity.options?.runtime?.render;
		if (renderMode === 'none') {
			// Self-managed renderer (e.g. particle system) — not bundle-managed.
			return null;
		}

		const bundleKey = InstanceManager.generateEntityBatchKey(entity as any);

		if (this.shouldInstance(entity)) {
			const placed = this.registerInstanced(entity, bundleKey);
			if (placed) {
				return bundleKey;
			}
			// Fall back to the object path when geometry/material are unavailable.
		}

		const object = this.resolveRenderable(entity);
		if (!object) {
			return null;
		}

		// Bundles only wrap static meshes; anything that can move renders
		// directly in the scene so its per-frame transform is honored.
		const parent: Object3D = this.isStatic(entity)
			? this.getOrCreateBundle(bundleKey)
			: this.scene;

		object.matrixAutoUpdate = true;
		// Tag for reverse lookup during raycast picking (debug tooling).
		object.userData.zylemEntityUuid = entity.uuid;
		if (object.parent) {
			object.parent.remove(object);
		}
		parent.add(object);
		if (parent instanceof BundleGroup) {
			parent.needsUpdate = true;
		}

		this.registered.set(entity.uuid, { kind: 'object', entity, object, bundleKey, parent });
		return bundleKey;
	}

	/** Remove an entity from its bundle group / scene / instanced batch. */
	unregister(entity: GameEntity<any>): void {
		const entry = this.registered.get(entity.uuid);
		if (!entry) {
			return;
		}
		if (entry.kind === 'object') {
			entry.parent.remove(entry.object);
			if (entry.parent instanceof BundleGroup) {
				entry.parent.needsUpdate = true;
			}
		} else {
			const list = this.instancedEntities.get(entry.bundleKey);
			if (list) {
				const i = list.indexOf(entity);
				if (i >= 0) {
					list.splice(i, 1);
				}
				if (list.length === 0) {
					this.instancedEntities.delete(entry.bundleKey);
				}
				// Membership changed: the batch mesh must be rebuilt at the new count.
				this.instancedDirty.add(entry.bundleKey);
			}
			entity.isInstanced = false;
			entity.instanceId = -1;
		}
		this.registered.delete(entity.uuid);
	}

	/** Whether an entity is currently managed by this manager. */
	has(entity: GameEntity<any>): boolean {
		return this.registered.has(entity.uuid);
	}

	/**
	 * Write each registered entity's transform from the physics bridge onto its
	 * renderable (object TRS or instanced-mesh matrix). Call once per frame
	 * after `bridge.step(...)`.
	 */
	sync(resolve: SlotTransformResolver): void {
		// Build/rebuild instanced batches whose membership changed since last sync,
		// so each InstancedMesh is allocated once at its exact instance count.
		this.rebuildDirtyInstancedBatches();

		for (const entry of this.registered.values()) {
			if (entry.kind !== 'object') {
				continue;
			}
			const handle = entry.entity.runtimeHandle;
			if (handle < 0) {
				continue;
			}
			const t = resolve(handle, this._scratch);
			if (!t) {
				continue;
			}
			this._pos.set(t.position[0], t.position[1], t.position[2]);
			this._quat.set(t.rotation[0], t.rotation[1], t.rotation[2], t.rotation[3]);
			const s = t.scale === 0 ? 1 : t.scale;
			this._scale.set(s, s, s);
			entry.object.position.copy(this._pos);
			entry.object.quaternion.copy(this._quat);
			entry.object.scale.copy(this._scale);
		}

		for (const [key, list] of this.instancedEntities) {
			const mesh = this.instancedMeshes.get(key);
			if (!mesh) {
				continue;
			}
			let dirty = false;
			for (let i = 0; i < list.length; i++) {
				const handle = list[i]!.runtimeHandle;
				if (handle < 0) {
					continue;
				}
				const t = resolve(handle, this._scratch);
				if (!t) {
					continue;
				}
				this._pos.set(t.position[0], t.position[1], t.position[2]);
				this._quat.set(t.rotation[0], t.rotation[1], t.rotation[2], t.rotation[3]);
				const s = t.scale === 0 ? 1 : t.scale;
				this._scale.set(s, s, s);
				this._matrix.compose(this._pos, this._quat, this._scale);
				mesh.setMatrixAt(i, this._matrix);
				dirty = true;
			}
			if (dirty) {
				mesh.instanceMatrix.needsUpdate = true;
			}
		}
	}

	/**
	 * Raycast against the managed renderables (objects and instanced meshes) and
	 * return the nearest hit mapped back to its entity uuid. Replaces Rapier
	 * `world.castRay` for debug picking in the WASM-owned path.
	 *
	 * @param raycaster A `Raycaster` already configured (e.g. `setFromCamera`).
	 */
	raycast(raycaster: Raycaster): { uuid: string; distance: number; point: Vector3 } | null {
		const targets: Object3D[] = [];
		for (const entry of this.registered.values()) {
			if (entry.kind === 'object') {
				targets.push(entry.object);
			}
		}
		for (const mesh of this.instancedMeshes.values()) {
			targets.push(mesh);
		}
		if (targets.length === 0) {
			return null;
		}
		const hits = raycaster.intersectObjects(targets, true);
		if (hits.length === 0) {
			return null;
		}
		const hit = hits[0]!;

		// Instanced hit: map the instanceId back through the owning batch.
		if (hit.instanceId !== undefined && hit.object instanceof InstancedMesh) {
			const key = hit.object.userData?.zylemBatchKey as string | undefined;
			const list = key ? this.instancedEntities.get(key) : undefined;
			const owner = list?.[hit.instanceId];
			if (owner) {
				return { uuid: owner.uuid, distance: hit.distance, point: hit.point.clone() };
			}
		}

		// Object hit: walk up to the tagged registered root.
		let node: Object3D | null = hit.object;
		while (node) {
			const uuid = node.userData?.zylemEntityUuid as string | undefined;
			if (uuid) {
				return { uuid, distance: hit.distance, point: hit.point.clone() };
			}
			node = node.parent;
		}
		return null;
	}

	/** Diagnostics: bundle / instanced-bundle / entity counts. */
	getStats(): { bundleCount: number; instancedBundleCount: number; entityCount: number } {
		return {
			bundleCount: this.bundles.size,
			instancedBundleCount: this.instancedEntities.size,
			entityCount: this.registered.size,
		};
	}

	/** Tear down all bundle groups + instanced meshes and drop references. */
	dispose(): void {
		for (const group of this.bundles.values()) {
			if (group.parent) {
				group.parent.remove(group);
			}
		}
		this.runtimeInstances.dispose();
		this.bundles.clear();
		this.instancedEntities.clear();
		this.instancedMeshes.clear();
		this.instancedDirty.clear();
		this.registered.clear();
	}

	// ─── Static detection ──────────────────────────────────────────────────

	/** Whether the entity is a static (non-moving) body, hence bundle-eligible. */
	private isStatic(entity: GameEntity<any>): boolean {
		return (entity.options as { runtime?: { body?: string } } | undefined)?.runtime?.body === 'static';
	}

	// ─── Instanced path ────────────────────────────────────────────────────

	/** Whether the entity should be drawn via a shared `InstancedMesh`. */
	private shouldInstance(entity: GameEntity<any>): boolean {
		if (entity.isInstanced) return true;
		const options = entity.options as { batched?: boolean; runtime?: { render?: string } } | undefined;
		return options?.batched === true || options?.runtime?.render === 'instanced';
	}

	/**
	 * Record the entity as a member of its instanced batch. The actual
	 * `InstancedMesh` is created lazily in {@link rebuildDirtyInstancedBatches}
	 * once the batch's instance count is known.
	 *
	 * @returns `true` on success, `false` if geometry/material are unavailable
	 *          (caller falls back to the object path).
	 */
	private registerInstanced(entity: GameEntity<any>, bundleKey: string): boolean {
		const geometry = entity.mesh?.geometry;
		const material = entity.materials?.[0];
		if (!geometry || !material) {
			return false;
		}

		let list = this.instancedEntities.get(bundleKey);
		if (!list) {
			list = [];
			this.instancedEntities.set(bundleKey, list);
		}
		const index = list.length;
		list.push(entity);
		this.instancedDirty.add(bundleKey);

		// Hide the entity's own mesh; the InstancedMesh draws it now.
		if (entity.mesh) {
			entity.mesh.visible = false;
		}
		entity.isInstanced = true;
		entity.instanceId = index;
		entity.batchKey = bundleKey;

		this.registered.set(entity.uuid, { kind: 'instanced', entity, bundleKey });
		return true;
	}

	/**
	 * (Re)build the `InstancedMesh` for any batch whose membership changed,
	 * delegating to {@link RuntimeInstanceManager} so each mesh is allocated once
	 * at the exact instance count (the WebGPU/WebGL-correct pattern).
	 */
	private rebuildDirtyInstancedBatches(): void {
		if (this.instancedDirty.size === 0) {
			return;
		}
		for (const key of this.instancedDirty) {
			// A rebuild always recreates the mesh from scratch at the new count.
			if (this.instancedMeshes.has(key)) {
				this.runtimeInstances.removeBatch(key);
				this.instancedMeshes.delete(key);
			}
			const list = this.instancedEntities.get(key);
			if (!list || list.length === 0) {
				continue;
			}
			const first = list[0]!;
			const geometry = first.mesh?.geometry;
			const material = first.materials?.[0];
			if (!geometry || !material) {
				continue;
			}
			const mesh = this.runtimeInstances.registerBatch({
				key,
				geometry,
				material,
				count: list.length,
			});
			mesh.userData.zylemBatchKey = key;
			this.instancedMeshes.set(key, mesh);
			// Slot index === position in the list; keep entity.instanceId in sync.
			for (let i = 0; i < list.length; i++) {
				list[i]!.instanceId = i;
			}
		}
		this.instancedDirty.clear();
	}

	// ─── Object path ─────────────────────────────────────────────────────────

	/** Pick the entity's renderable: prefer its mesh, fall back to its group. */
	private resolveRenderable(entity: GameEntity<any>): Object3D | null {
		return entity.mesh ?? entity.group ?? null;
	}

	private getOrCreateBundle(key: string): BundleGroup {
		let group = this.bundles.get(key);
		if (group) {
			return group;
		}
		group = new BundleGroup();
		group.name = `bundle:${key}`;
		// Bundles only ever hold static meshes now, so record-once is always safe.
		// The typings omit `static`; it exists at runtime (see three BundleGroup).
		(group as unknown as { static: boolean }).static = true;
		this.bundles.set(key, group);
		this.scene.add(group);
		return group;
	}
}
