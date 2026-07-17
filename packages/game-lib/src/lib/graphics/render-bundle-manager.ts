import { BufferGeometry, Material, Object3D } from 'three';
import { BundleGroup } from 'three/webgpu';

import type { GameEntity } from '../entities/entity';

/**
 * Groups static environment meshes into WebGPU `BundleGroup`s for record-once
 * replay. Dynamic entities must use `pack` (instancing) or `none` (scene-direct).
 */
export class RenderBundleManager {
	private readonly bundles = new Map<string, BundleGroup>();
	private readonly entityToBundle = new Map<string, string>();
	private scene: Object3D | null = null;

	setScene(scene: Object3D): void {
		this.scene = scene;
	}

	/**
	 * Parent the entity's renderable into a static bundle group.
	 * @returns `true` when registration succeeded.
	 */
	register(
		entity: GameEntity<any>,
		_geometry: BufferGeometry,
		_material: Material,
		bundleKey: string,
	): boolean {
		if (entity.isBundled) {
			return true;
		}

		const object = entity.mesh ?? entity.group;
		if (!object) {
			return false;
		}

		const bundle = this.getOrCreateBundle(bundleKey);
		object.matrixAutoUpdate = true;
		object.userData.zylemEntityUuid = entity.uuid;

		if (object.parent) {
			object.parent.remove(object);
		}
		bundle.add(object);
		bundle.needsUpdate = true;

		entity.isBundled = true;
		entity.bundleKey = bundleKey;
		this.entityToBundle.set(entity.uuid, bundleKey);
		return true;
	}

	unregister(entity: GameEntity<any>): void {
		const bundleKey = this.entityToBundle.get(entity.uuid);
		if (!bundleKey) {
			return;
		}

		const bundle = this.bundles.get(bundleKey);
		const object = entity.mesh ?? entity.group;
		if (bundle && object) {
			bundle.remove(object);
			bundle.needsUpdate = true;
		}

		entity.isBundled = false;
		entity.bundleKey = null;
		this.entityToBundle.delete(entity.uuid);
	}

	getStats(): { bundleCount: number; entityCount: number } {
		return {
			bundleCount: this.bundles.size,
			entityCount: this.entityToBundle.size,
		};
	}

	dispose(): void {
		for (const bundle of this.bundles.values()) {
			if (this.scene) {
				this.scene.remove(bundle);
			}
		}
		this.bundles.clear();
		this.entityToBundle.clear();
	}

	private getOrCreateBundle(key: string): BundleGroup {
		let group = this.bundles.get(key);
		if (group) {
			return group;
		}

		group = new BundleGroup();
		group.name = `bundle:${key}`;
		// Record-once is valid because environment category forces static bodies.
		(group as unknown as { static: boolean }).static = true;
		this.bundles.set(key, group);

		if (this.scene) {
			this.scene.add(group);
		}

		return group;
	}
}
