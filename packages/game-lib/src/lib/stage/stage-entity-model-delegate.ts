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
	private onLoadSettled: ((entityId: string) => void) | null = null;
	private modelLoadedHandler: ((payload: { entityId: string; success: boolean }) => void) | null = null;
	private animationLoadedHandler: ((payload: { entityId: string }) => void) | null = null;

	/**
	 * Initialize the delegate with the scene reference and start listening.
	 *
	 * @param onEntityReady Called when a late model is in the scene, so deferred
	 * physics and instancing can finish.
	 * @param onLoadSettled Called after each late asset (model, then animation
	 * clips) arrives, so the stage can run the entity's loaded callbacks once
	 * nothing is pending.
	 */
	attach(
		scene: ZylemScene,
		onEntityReady?: (entity: GameEntity<any>) => void,
		onLoadSettled?: (entityId: string) => void,
	): void {
		this.scene = scene;
		this.onEntityReady = onEntityReady ?? null;
		this.onLoadSettled = onLoadSettled ?? null;
		this.modelLoadedHandler = (payload) => {
			this.handleModelLoaded(payload.entityId, payload.success);
			if (payload.success) this.onLoadSettled?.(payload.entityId);
		};
		this.animationLoadedHandler = (payload) => {
			this.onLoadSettled?.(payload.entityId);
		};
		zylemEventBus.on('entity:model:loaded', this.modelLoadedHandler);
		zylemEventBus.on('entity:animation:loaded', this.animationLoadedHandler);
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
		if (this.animationLoadedHandler) {
			zylemEventBus.off('entity:animation:loaded', this.animationLoadedHandler);
			this.animationLoadedHandler = null;
		}
		this.pendingEntities.clear();
		this.onEntityReady = null;
		this.onLoadSettled = null;
		this.scene = null;
	}
}
