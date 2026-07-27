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

/** Entity selection owned by the game, mirrored back to the editor. */
export interface EntitySelectionPayload {
	selectedUuid: string | null;
	hoveredUuid: string | null;
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
		scale?: BridgeVec3;
	};
	'stage:variable:set': { key: string; value: unknown };
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
