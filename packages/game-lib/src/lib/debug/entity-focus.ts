import type { Object3D } from 'three';
import type { GameEntity } from '../entities/entity';
import { debugState, setSelectedEntity } from './debug-state';

/**
 * Context registered by the active stage so the editor can focus entities
 * without importing stage internals.
 */
export interface EntityFocusContext {
	/** Resolve a live entity by UUID from the current stage. */
	resolveEntity(uuid: string): GameEntity<any> | null;
	/** Frame the debug camera on an Object3D (group/mesh). */
	frameObject(object: Object3D): void;
	/** Ensure debugMap / orbit wiring is ready (e.g. enable debug visuals). */
	ensureDebugReady?(): void;
}

let activeContext: EntityFocusContext | null = null;

/**
 * Register the active stage's focus context. Returns an unregister function.
 */
export function registerEntityFocusContext(context: EntityFocusContext): () => void {
	activeContext = context;
	return () => {
		if (activeContext === context) {
			activeContext = null;
		}
	};
}

/**
 * Select an entity by UUID and frame the debug camera to fit it.
 * Enables debug mode so orbit controls are active.
 *
 * @returns true if the entity was found and framed
 */
export function focusEntity(uuid: string): boolean {
	if (!activeContext) {
		console.warn('focusEntity: no active stage focus context');
		return false;
	}

	const entity = activeContext.resolveEntity(uuid);
	if (!entity) {
		console.warn(`focusEntity: entity ${uuid} not found`);
		return false;
	}

	const target = (entity as any).group ?? (entity as any).mesh ?? null;
	if (!target) {
		console.warn(`focusEntity: entity ${uuid} has no group/mesh`);
		return false;
	}

	if (!debugState.enabled) {
		debugState.enabled = true;
	}
	activeContext.ensureDebugReady?.();

	setSelectedEntity(entity);
	activeContext.frameObject(target);
	return true;
}
