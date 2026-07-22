/**
 * Bridges async model loading to scene attachment for entities.
 *
 * Some entities (e.g. GLTF actors) don't have a renderable group/mesh at spawn
 * time. This delegate observes those entities, listens for `entity:model:loaded`
 * events, and adds their group to the scene once the model is ready — notifying
 * the stage so deferred physics/instancing can finish. Exists to handle the
 * "spawned now, mesh arrives later" race without complicating spawn code.
 */
import { zylemEventBus } from '../events';
import { ZylemScene } from '../graphics/zylem-scene';
import { GameEntity } from '../entities/entity';
import { finalizeSpawnPlacement, syncPendingPlacementVisibility } from '../entities/spawn-placement';
import { usesManagedRenderPath } from '../graphics/render-category';

/**
 * Delegate for handling deferred model loading in entities.
 * Subscribes to model:loaded events and adds entity groups to the scene
 * when they become available after async loading completes.
 */
export class StageEntityModelDelegate {
	private scene: ZylemScene | null = null;
	private onEntityReady: ((entity: GameEntity<any>) => void) | null = null;
	private pendingEntities: Map<string, GameEntity<any>> = new Map();
	private modelLoadedHandler: ((payload: { entityId: string; success: boolean }) => void) | null = null;

	/**
	 * Initialize the delegate with the scene reference and start listening.
	 */
	attach(scene: ZylemScene, onEntityReady?: (entity: GameEntity<any>) => void): void {
		this.scene = scene;
		this.onEntityReady = onEntityReady ?? null;
		this.modelLoadedHandler = (payload) => {
			this.handleModelLoaded(payload.entityId, payload.success);
		};
		zylemEventBus.on('entity:model:loaded', this.modelLoadedHandler);
	}

	/**
	 * Register an entity for observation.
	 * When its model loads, the group will be added to the scene.
	 */
	observe(entity: GameEntity<any>): void {
		if (entity.group || entity.mesh) {
			if (!usesManagedRenderPath(entity.options)) {
				this.scene?.addEntityGroup(entity);
				syncPendingPlacementVisibility(entity);
				finalizeSpawnPlacement(entity);
				this.onEntityReady?.(entity);
			}
			return;
		}
		this.pendingEntities.set(entity.uuid, entity);
	}

	/**
	 * Unregister an entity (e.g., when removed before model loads).
	 */
	unobserve(entityId: string): void {
		this.pendingEntities.delete(entityId);
	}

	/**
	 * Handle model loaded event - add group to scene if entity is pending.
	 */
	private handleModelLoaded(entityId: string, success: boolean): void {
		const entity = this.pendingEntities.get(entityId);
		if (!entity || !success) {
			this.pendingEntities.delete(entityId);
			return;
		}

		this.scene?.addEntityGroup(entity);
		syncPendingPlacementVisibility(entity);
		finalizeSpawnPlacement(entity);
		if (!usesManagedRenderPath(entity.options)) {
			this.onEntityReady?.(entity);
		}
		this.pendingEntities.delete(entityId);
	}

	/**
	 * Cleanup all subscriptions and pending entities.
	 */
	dispose(): void {
		if (this.modelLoadedHandler) {
			zylemEventBus.off('entity:model:loaded', this.modelLoadedHandler);
			this.modelLoadedHandler = null;
		}
		this.pendingEntities.clear();
		this.onEntityReady = null;
		this.scene = null;
	}
}
