import type { Material, Object3D } from 'three';

import type { GameEntity } from '../entities/entity';
import { InstanceManager } from './instance-manager';
import { RenderBundleManager } from './render-bundle-manager';
import { resolveRenderCategory } from './render-category';
import { markEnvironmentCaptureRoot, usesEnvironmentMaterial } from './entity-environment';
import { syncRenderPoseFromBody } from '../entities/spawn-placement';

const batchOwners = new WeakMap<GameEntity<any>, RenderStrategyManager>();

/** A cube-map material owns its draw. Return any material still in use by the pack. */
export function releaseBatchForEnvironment(entity: GameEntity<any>, materials: Material[]): Material | undefined {
	const owner = batchOwners.get(entity);
	if (owner && usesEnvironmentMaterial(materials)) return owner.releaseToScene(entity);
}

/**
 * Routes entities to scene-direct (`none`), WebGPU bundles (`environment`), or
 * instanced meshes (`pack`) based on `options.category`.
 */
export class RenderStrategyManager {
	readonly bundles = new RenderBundleManager();
	readonly instances = new InstanceManager();
	private scene: Object3D | null = null;
	private readonly managed = new Set<GameEntity<any>>();

	setScene(scene: Object3D): void {
		this.scene = scene;
		this.bundles.setScene(scene);
		this.instances.setScene(scene);
	}

	/**
	 * Register an entity with the appropriate managed render path.
	 * @returns `true` when the entity was placed into bundle or instanced rendering.
	 */
	register(entity: GameEntity<any>): boolean {
		const category = resolveRenderCategory(entity.options);
		if (category === 'none') {
			return false;
		}
		if (entity.isInstanced || entity.isBundled) {
			return true;
		}
		if (!entity.mesh?.geometry || !entity.materials?.length) {
			return false;
		}
		// A runtime swap before spawn, or an individually authored mesh part,
		// can carry a capture independently of the entity's creation options.
		if (usesEnvironmentMaterial(entity.materials)
			|| entity.compoundMeshes.some(mesh => usesEnvironmentMaterial(mesh.material))) {
			return false;
		}

		const geometry = entity.mesh.geometry;
		const material = entity.materials[0];
		const key = InstanceManager.generateEntityPackKey(entity);

		if (category === 'pack') {
			const instanceId = this.instances.register(entity, geometry, material, key);
			if (instanceId < 0) {
				return false;
			}
			entity.packKey = key;
			entity.instanceId = instanceId;
			entity.isInstanced = true;
			if (entity.mesh) {
				entity.mesh.visible = false;
			}
		} else {
			const placed = this.bundles.register(entity, geometry, material, key);
			if (!placed) {
				return false;
			}
			if (entity.mesh) {
				entity.mesh.visible = true;
			}
		}

		batchOwners.set(entity, this);
		this.managed.add(entity);
		return true;
	}

	unregister(entity: GameEntity<any>): Material | undefined {
		let packMaterial: Material | undefined;
		if (entity.isInstanced) {
			packMaterial = this.instances.unregister(entity);
			entity.isInstanced = false;
			entity.instanceId = -1;
			entity.packKey = null;
		}
		if (entity.isBundled) {
			this.bundles.unregister(entity);
		}
		batchOwners.delete(entity);
		this.managed.delete(entity);
		return packMaterial;
	}

	/** Give a live cube-map surface its own draw. The pack still owns its material. */
	releaseToScene(entity: GameEntity<any>): Material | undefined {
		const wasInstanced = entity.isInstanced;
		const packMaterial = this.unregister(entity);
		const root = entity.group ?? entity.mesh;
		if (root && this.scene) {
			if (entity.group && entity.mesh && !entity.mesh.parent) entity.group.add(entity.mesh);
			if (wasInstanced && entity.mesh) {
				entity.mesh.visible = entity.options.visible !== false && !entity._spawnPlacementPending;
			}
			markEnvironmentCaptureRoot(root);
			this.scene.add(root);
			syncRenderPoseFromBody(entity);
		}
		return packMaterial;
	}

	update(interpolationAlpha = 0): void {
		this.instances.update(interpolationAlpha);
	}

	dispose(): void {
		// Drop the registrations in bulk, without compacting each instanced pack.
		for (const entity of this.managed) {
			batchOwners.delete(entity);
			entity.isInstanced = entity.isBundled = false;
			entity.packKey = entity.bundleKey = null;
			entity.instanceId = -1;
		}
		this.managed.clear();
		this.bundles.dispose();
		this.instances.dispose();
		this.scene = null;
	}
}
