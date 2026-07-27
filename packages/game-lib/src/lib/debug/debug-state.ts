import { proxy } from 'valtio/vanilla';
import type { GameEntity } from '../entities/entity';

export type DebugTools =
	| 'select'
	| 'translate'
	| 'rotate'
	| 'scale'
	| 'delete'
	| 'add'
	| 'none';

export interface DebugState {
	enabled: boolean;
	paused: boolean;
	tool: DebugTools;
	/**
	 * UUID of the selected entity, never the entity itself. Valtio deep-proxies
	 * any object assigned into a proxy, so storing a live `GameEntity` here
	 * would walk `group.parent` into the entire THREE scene graph and
	 * `physicsWorldRef` into the Rapier world, freezing the tab and handing
	 * Proxy wrappers to engine code that expects real instances.
	 */
	selectedEntityId: string | null;
	/** UUID of the hovered entity. Same constraint as `selectedEntityId`. */
	hoveredEntityId: string | null;
	flags: Set<string>;
}

export const debugState = proxy<DebugState>({
	enabled: false,
	paused: false,
	tool: 'none',
	selectedEntityId: null,
	hoveredEntityId: null,
	flags: new Set(),
});

/** Resolves a UUID to the live entity owned by the active stage. */
export type DebugEntityResolver = (uuid: string) => GameEntity<any> | null;

let entityResolver: DebugEntityResolver | null = null;

/**
 * Register the active stage's entity resolver so `getSelectedEntity` /
 * `getHoveredEntity` can hand back live entities without the reactive store
 * ever holding one.
 *
 * @returns An unregister function.
 */
export function registerDebugEntityResolver(
	resolver: DebugEntityResolver,
): () => void {
	entityResolver = resolver;
	return () => {
		if (entityResolver === resolver) {
			entityResolver = null;
		}
	};
}

/** Resolve a UUID through the active stage, or null when unavailable. */
export function resolveDebugEntity(uuid: string | null): GameEntity<any> | null {
	if (!uuid || !entityResolver) return null;
	return entityResolver(uuid);
}

/**
 * Coerce a caller value into an entity UUID. Accepts a uuid, null, or (for
 * backwards compatibility with the old object-based API) an entity-like value
 * carrying a `uuid`. Anything else throws rather than silently poisoning the
 * proxy.
 */
function toEntityId(value: unknown, setter: string): string | null {
	if (value === null || value === undefined) return null;
	if (typeof value === 'string') return value;

	const uuid = (value as { uuid?: unknown }).uuid;
	if (typeof uuid === 'string') {
		console.warn(
			`${setter}: received a live entity. Pass the UUID instead — storing `
			+ 'entities in debugState makes valtio deep-proxy the scene graph.',
		);
		return uuid;
	}

	throw new TypeError(
		`${setter} expects an entity UUID string or null, received ${typeof value}.`,
	);
}

export function isPaused(): boolean {
	return debugState.paused;
}

export function setPaused(paused: boolean): void {
	debugState.paused = paused;
}

export function setDebugFlag(flag: string, value: boolean): void {
	if (value) {
		debugState.flags.add(flag);
	} else {
		debugState.flags.delete(flag);
	}
}

export function getDebugTool(): DebugTools {
	return debugState.tool;
}

export function setDebugTool(tool: DebugTools): void {
	debugState.tool = tool;
}

export function getSelectedEntityId(): string | null {
	return debugState.selectedEntityId;
}

export function setSelectedEntityId(uuid: string | null): void {
	const next = toEntityId(uuid, 'setSelectedEntityId');
	if (debugState.selectedEntityId === next) return;
	debugState.selectedEntityId = next;
}

export function getHoveredEntityId(): string | null {
	return debugState.hoveredEntityId;
}

export function setHoveredEntityId(uuid: string | null): void {
	const next = toEntityId(uuid, 'setHoveredEntityId');
	if (debugState.hoveredEntityId === next) return;
	debugState.hoveredEntityId = next;
}

export function resetHoveredEntity(): void {
	setHoveredEntityId(null);
}

/** The live selected entity, resolved on demand through the active stage. */
export function getSelectedEntity(): GameEntity<any> | null {
	return resolveDebugEntity(debugState.selectedEntityId);
}

/** The live hovered entity, resolved on demand through the active stage. */
export function getHoveredEntity(): GameEntity<any> | null {
	return resolveDebugEntity(debugState.hoveredEntityId);
}

/**
 * @deprecated Pass a UUID to {@link setSelectedEntityId} instead. Accepts a
 * live entity only to keep the previous public API working.
 */
export function setSelectedEntity(
	entity: GameEntity<any> | string | null,
): void {
	setSelectedEntityId(toEntityId(entity, 'setSelectedEntity'));
}

/**
 * @deprecated Pass a UUID to {@link setHoveredEntityId} instead. Accepts a
 * live entity only to keep the previous public API working.
 */
export function setHoveredEntity(
	entity: GameEntity<any> | string | null,
): void {
	setHoveredEntityId(toEntityId(entity, 'setHoveredEntity'));
}
