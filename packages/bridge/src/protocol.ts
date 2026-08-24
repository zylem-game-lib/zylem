/**
 * Editor ↔ game bridge protocol.
 *
 * Single source of truth for every message exchanged between a running
 * Zylem game (`@zylem/game-lib`) and the editor overlay (`@zylem/editor`).
 * Both packages depend on this module only — they never import each other's
 * internals — which keeps the two custom elements fully decoupled while
 * sharing one typed contract.
 */

/** Plain `{ x, y, z }` vector used across bridge payloads. */
export interface BridgeVec3 {
	x: number;
	y: number;
	z: number;
}

/** Plain quaternion. Authoritative orientation for editor transforms. */
export interface BridgeQuat {
	x: number;
	y: number;
	z: number;
	w: number;
}

/**
 * A partial transform. Euler `rotation` is carried for display and numeric
 * entry; `quaternion` is authoritative when present, since round-tripping an
 * orientation through Euler angles drifts and can hit gimbal degeneracy.
 */
export interface BridgePose {
	position?: BridgeVec3;
	/** Euler angles in radians. */
	rotation?: BridgeVec3;
	quaternion?: BridgeQuat;
	scale?: BridgeVec3;
}

/** Editor toolbar tools mirrored into the game debug state. */
export type BridgeDebugTool =
	| 'select'
	| 'translate'
	| 'rotate'
	| 'scale'
	| 'delete'
	| 'add'
	| 'none';

/** Display / runtime configuration of the running game. */
export interface GameConfigPayload {
	id: string;
	aspectRatio: number;
	fullscreen: boolean;
	bodyBackground: string | undefined;
	internalResolution: { width: number; height: number } | undefined;
	debug: boolean;
}

/** Loading lifecycle updates (start → progress → complete). */
export interface GameLoadingPayload {
	phase: 'start' | 'progress' | 'complete';
	progress?: number;
	stageName?: string;
	stageIndex?: number;
}

/** Stage configuration surfaced in the editor stage panel. */
export interface StageConfigPayload {
	id: string;
	backgroundColor: string;
	backgroundImage: string | null;
	gravity: BridgeVec3;
	inputs: Record<string, string[]>;
	variables: Record<string, unknown>;
}

/** Per-entity summary rendered in the editor entity list. */
export interface EntitySummaryPayload {
	uuid: string;
	name: string;
	type: string;
	position: BridgeVec3;
	rotation: BridgeVec3;
	scale: BridgeVec3;
	/** Authoritative orientation, when the game can supply one. */
	quaternion?: BridgeQuat;
	/** Preview image URL (blob or data URL), when available. */
	thumbnail?: string | null;
	/** World-space AABB size used for thumbnail rulers. */
	bounds?: { width: number; height: number; depth: number };
}

/** Full stage snapshot: config plus the complete entity list. */
export interface StageSnapshotPayload {
	stage: StageConfigPayload | null;
	entities: EntitySummaryPayload[];
}

/** Thumbnail ready notification for one entity. */
export interface EntityThumbnailPayload {
	uuid: string;
	/** Blob URL (preferred) or PNG data URL of the framed preview. */
	url: string;
	bounds: { width: number; height: number; depth: number };
}

/** Game global-variable change mirrored to the editor. */
export interface GameVariablePayload {
	path: string;
	value: unknown;
	previousValue?: unknown;
}

/** One-off diagnostic message surfaced in the editor console. */
export interface GameNoticePayload {
	level: 'info' | 'warn' | 'error';
	message: string;
}

/** Apply a catalog shader or behavior to a live entity without a rebuild. */
export interface EntityApplySwatchPayload {
	uuid: string;
	kind: 'shader' | 'behavior';
	/** Shader factory or behavior descriptor export name. */
	source: string;
	props: Record<string, unknown>;
}
export interface EntitySelectionPayload {
	/** First entry of {@link selectedUuids}, kept for single-select consumers. */
	selectedUuid: string | null;
	hoveredUuid: string | null;
	/** Full selection. Present even while only one entity can be selected. */
	selectedUuids?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene operations (undo/redo)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * What a {@link SceneOperationPayload} did.
 *
 * - `transform` — poses changed; invert by writing `before`.
 * - `create` — entities were spawned; invert by detaching them.
 * - `delete` — entities were detached; invert by restoring them.
 */
export type SceneOperationKind = 'transform' | 'create' | 'delete';

/** One entity's participation in a scene operation. */
export interface SceneOperationEntry {
	uuid: string;
	before?: BridgePose;
	after?: BridgePose;
}

/**
 * A committed, invertible change to the stage.
 *
 * Published by the game because every editing gesture originates game-side
 * (gizmo drags, placement clicks, delete clicks). The editor stores these as
 * its undo stack and replays them via `scene:operation:apply` — it never has
 * to reconstruct an entity, which it could not do from an
 * {@link EntitySummaryPayload} alone.
 */
export interface SceneOperationPayload {
	opId: string;
	kind: SceneOperationKind;
	/** Human-readable summary, e.g. `Move Box`. */
	label: string;
	entries: SceneOperationEntry[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Entity catalog
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A placeable entity type offered by the game, rendered in the editor's Add
 * palette. Deliberately serializable: the factory itself stays game-side, so
 * hosts (e.g. Creator) extend the palette by registering types with the game
 * rather than passing closures across the bridge.
 */
export interface EntityTypeDescriptor {
	id: string;
	label: string;
	/** Inline SVG markup for the palette entry and armed Add button. */
	icon?: string;
	/** Searched alongside `label`, and used for palette grouping. */
	tags?: string[];
	/** Group heading in the palette. */
	group?: string;
	description?: string;
	/** Creation options the palette entry defaults to. */
	defaultProps?: Record<string, unknown>;
}

/** Snap increments applied to gizmo drags, in world units / radians. */
export interface SnapSettingsPayload {
	enabled: boolean;
	/** World units per translation step. */
	translate: number;
	/** Radians per rotation step. */
	rotate: number;
	/** Scale factor per step. */
	scale: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Message maps
// ─────────────────────────────────────────────────────────────────────────────

/** Messages published by the game side, consumed by the editor. */
export type GameToEditorMessages = {
	'game:config': GameConfigPayload;
	'game:loading': GameLoadingPayload;
	'game:status': { paused?: boolean; debug?: boolean };
	'game:variable': GameVariablePayload;
	'game:notice': GameNoticePayload;
	'stage:snapshot': StageSnapshotPayload;
	'entity:upsert': EntitySummaryPayload[];
	'entity:removed': { uuids: string[] };
	'entity:thumbnail': EntityThumbnailPayload[];
	'entity:selection': EntitySelectionPayload;
	'catalog:snapshot': { entities: EntityTypeDescriptor[] };
	'scene:operation': SceneOperationPayload;
};

/** Commands published by the editor, consumed by the game. */
export type EditorToGameMessages = {
	'debug:set': { enabled: boolean };
	'tool:set': { tool: BridgeDebugTool };
	'playback:set': { paused: boolean };
	'entity:select': { uuid: string | null };
	'entity:focus': { uuid: string };
	'entity:transform': {
		uuid: string;
		position?: BridgeVec3;
		rotation?: BridgeVec3;
		quaternion?: BridgeQuat;
		scale?: BridgeVec3;
	};
	'entity:create': {
		typeId: string;
		props?: Record<string, unknown>;
		pose?: BridgePose;
	};
	'scene:operation:apply': {
		op: SceneOperationPayload;
		direction: 'undo' | 'redo';
	};
	/** Arm the add tool with a catalog type, or `null` to disarm. */
	'add:type:set': { typeId: string | null; props?: Record<string, unknown> };
	'snap:set': SnapSettingsPayload;
	'grid:set': { visible: boolean };
	'stage:variable:set': { key: string; value: unknown };
	'entity:apply-swatch': EntityApplySwatchPayload;
};

/** Combined message map carried by a single bridge channel. */
export type BridgeMessages = GameToEditorMessages & EditorToGameMessages;

export type BridgeMessageType = keyof BridgeMessages;

/**
 * DOM event dispatched (bubbles + composed) from the game element when its
 * bridge side connects, so decoupled listeners can detect a live game
 * without polling.
 */
export const BRIDGE_READY_EVENT = 'zylem:bridge:ready';
