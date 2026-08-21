/**
 * Runtime registry of placeable entity types, backing the editor's Add palette.
 *
 * The factory stays on this side of the bridge; only a serializable descriptor
 * crosses it. That is what makes the palette extensible without the editor
 * depending on game-lib: a host such as Creator registers its own configured
 * entities here (shaders, behaviors, whatever its swatches resolve to) and they
 * show up in the palette alongside the built-in primitives.
 */

import type { EntityTypeDescriptor } from '@zylem/bridge';
import type { BaseNode } from '../core/base-node';
import type { Vec3 } from '../core/vector';

/** Context handed to a factory when the user clicks to place. */
export interface EntityPlacementContext {
	/** Snapped world position the entity should be created at. */
	position: Vec3;
	/** Surface normal when placed onto geometry. */
	normal?: Vec3;
	/** Options merged over the descriptor's defaults. */
	props: Record<string, unknown>;
}

export type EntityTypeFactory = (
	context: EntityPlacementContext,
) => BaseNode | Promise<BaseNode> | null;

/** A registered entity type: what the palette shows, plus how to build it. */
export interface EntityTypeRegistration extends EntityTypeDescriptor {
	create: EntityTypeFactory;
}

const registry = new Map<string, EntityTypeRegistration>();
const listeners = new Set<() => void>();

function notify(): void {
	for (const listener of listeners) {
		try {
			listener();
		} catch (error) {
			console.error('[zylem] entity registry listener failed', error);
		}
	}
}

/**
 * Register a placeable entity type, replacing any existing type with the same
 * id so a host can override a built-in.
 *
 * @returns An unregister function.
 */
export function registerEntityType(
	registration: EntityTypeRegistration,
): () => void {
	registry.set(registration.id, registration);
	notify();
	return () => {
		if (registry.get(registration.id) === registration) {
			registry.delete(registration.id);
			notify();
		}
	};
}

/** Register several types at once, notifying listeners only after all of them. */
export function registerEntityTypes(
	registrations: EntityTypeRegistration[],
): () => void {
	for (const registration of registrations) {
		registry.set(registration.id, registration);
	}
	notify();
	return () => {
		for (const registration of registrations) {
			if (registry.get(registration.id) === registration) {
				registry.delete(registration.id);
			}
		}
		notify();
	};
}

export function getEntityType(id: string): EntityTypeRegistration | null {
	return registry.get(id) ?? null;
}

/** Every registered type, in registration order. */
export function listEntityTypes(): EntityTypeRegistration[] {
	return [...registry.values()];
}

/** The serializable view of the registry, as published to the editor. */
export function buildCatalogDescriptors(): EntityTypeDescriptor[] {
	return listEntityTypes().map(({ create: _create, ...descriptor }) => descriptor);
}

/**
 * Observe registry changes so the catalog can be republished.
 *
 * @returns An unsubscribe function.
 */
export function onEntityRegistryChanged(listener: () => void): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

/** Test hook: drop every registration. */
export function clearEntityRegistry(): void {
	registry.clear();
	notify();
}
