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

/** Tools that manipulate a selected entity's transform via the gizmo. */
export const TRANSFORM_TOOLS = ['translate', 'rotate', 'scale'] as const;

export type TransformTool = (typeof TRANSFORM_TOOLS)[number];

export function isTransformTool(tool: DebugTools): tool is TransformTool {
	return (TRANSFORM_TOOLS as readonly string[]).includes(tool);
}

/** Grid increments applied to gizmo drags, in world units and radians. */
export interface SnapSettings {
	enabled: boolean;
	translate: number;
	/** Radians. Defaults to 15 degrees. */
	rotate: number;
	scale: number;
}

export const DEFAULT_SNAP_SETTINGS: SnapSettings = {
	enabled: true,
	translate: 0.25,
	rotate: Math.PI / 12,
	scale: 0.1,
};

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
	/**
	 * Full selection, in click order. `selectedEntityId` mirrors the first
	 * entry. Only ever holds one uuid today, but the gizmo and scene operations
	 * are already written against the list so multi-select needs no rework here.
	 */
	selectedEntityIds: string[];
	/** UUID of the hovered entity. Same constraint as `selectedEntityId`. */
	hoveredEntityId: string | null;
	snap: SnapSettings;
	/** Whether the construction-plane grid is drawn. */
	gridVisible: boolean;
	/** Catalog type the add tool will spawn, or null when disarmed. */
	addTypeId: string | null;
	/** Creation options merged over the armed type's defaults. */
	addTypeProps: Record<string, unknown> | null;
	flags: Set<string>;
}

export const debugState = proxy<DebugState>({
	enabled: false,
	paused: false,
	tool: 'none',
	selectedEntityId: null,
	selectedEntityIds: [],
	hoveredEntityId: null,
	snap: { ...DEFAULT_SNAP_SETTINGS },
	gridVisible: false,
	addTypeId: null,
	addTypeProps: null,
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

/**
 * Whether the editor's pointer tools should be live.
 *
 * Debug mode owns the collider wireframes and the orbit camera; it does not own
 * editing. An armed tool has to work without it, or the toolbar offers buttons
 * that quietly do nothing — which is what Add, Select and Delete all did until
 * the Debug button happened to be on.
 */
export function isEditorInteractionActive(): boolean {
	return debugState.enabled || debugState.tool !== 'none';
}

export function getSelectedEntityId(): string | null {
	return debugState.selectedEntityId;
}

export function setSelectedEntityId(uuid: string | null): void {
	const next = toEntityId(uuid, 'setSelectedEntityId');
	if (debugState.selectedEntityId === next) return;
	debugState.selectedEntityId = next;
	debugState.selectedEntityIds = next ? [next] : [];
}

/** Every selected uuid, in click order. */
export function getSelectedEntityIds(): string[] {
	return [...debugState.selectedEntityIds];
}

/**
 * Replace the selection. `selectedEntityId` follows the first entry so the
 * single-select consumers (debug cursor, orbit focus target, bridge mirror)
 * keep working unchanged.
 */
export function setSelectedEntityIds(uuids: string[]): void {
	const next = uuids.map((uuid, index) => toEntityId(uuid, `setSelectedEntityIds[${index}]`))
		.filter((uuid): uuid is string => uuid !== null);
	const unchanged =
		next.length === debugState.selectedEntityIds.length
		&& next.every((uuid, index) => debugState.selectedEntityIds[index] === uuid);
	if (unchanged) return;
	debugState.selectedEntityIds = next;
	debugState.selectedEntityId = next[0] ?? null;
}

/** Current snap increments. */
export function getSnapSettings(): SnapSettings {
	return { ...debugState.snap };
}

export function setSnapSettings(snap: Partial<SnapSettings>): void {
	Object.assign(debugState.snap, snap);
}

export function setGridVisible(visible: boolean): void {
	debugState.gridVisible = visible;
}

/** Arm the add tool with a catalog type, or pass `null` to disarm it. */
export function setAddType(
	typeId: string | null,
	props?: Record<string, unknown> | null,
): void {
	debugState.addTypeId = typeId;
	debugState.addTypeProps = typeId ? (props ?? null) : null;
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
