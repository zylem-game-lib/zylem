import { BufferGeometry, Material, Object3D } from 'three';

import type { GameEntity } from '../entities/entity';
import { InstanceManager } from './instance-manager';
import { RenderBundleManager } from './render-bundle-manager';
import { resolveRenderCategory } from './render-category';

/**
 * Routes entities to scene-direct (`none`), WebGPU bundles (`environment`), or
 * instanced meshes (`pack`) based on `options.category`.
 */
export class RenderStrategyManager {
	readonly bundles = new RenderBundleManager();
	readonly instances = new InstanceManager();

	setScene(scene: Object3D): void {
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
			return true;
		}

		if (category === 'environment') {
			const placed = this.bundles.register(entity, geometry, material, key);
			if (!placed) {
				return false;
			}
			if (entity.mesh) {
				entity.mesh.visible = true;
			}
			return true;
		}

		return false;
	}

	unregister(entity: GameEntity<any>): void {
		if (entity.isInstanced) {
			this.instances.unregister(entity);
			entity.isInstanced = false;
			entity.instanceId = -1;
			entity.packKey = null;
		}
		if (entity.isBundled) {
			this.bundles.unregister(entity);
		}
	}

	update(interpolationAlpha = 0): void {
		this.instances.update(interpolationAlpha);
	}

	dispose(): void {
		this.bundles.dispose();
		this.instances.dispose();
	}
}
