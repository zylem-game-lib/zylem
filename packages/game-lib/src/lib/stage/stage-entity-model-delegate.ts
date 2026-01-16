import { zylemEventBus } from '../events';
import { ZylemScene } from '../graphics/zylem-scene';
import { GameEntity } from '../entities/entity';

/**
 * Delegate for handling deferred model loading in entities.
 * Subscribes to model:loaded events and adds entity groups to the scene
 * when they become available after async loading completes.
 */
export class StageEntityModelDelegate {
	private scene: ZylemScene | null = null;
	private pendingEntities: Map<string, GameEntity<any>> = new Map();
	private modelLoadedHandler: ((payload: { entityId: string; success: boolean }) => void) | null = null;

	/**
	 * Initialize the delegate with the scene reference and start listening.
	 */
	attach(scene: ZylemScene): void {
		this.scene = scene;
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
		this.scene = null;
	}
}
