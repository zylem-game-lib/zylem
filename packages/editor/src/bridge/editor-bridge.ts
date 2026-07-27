/**
 * Editor-side adapter for the shared editor ↔ game bridge.
 *
 * Subscribes to game→editor messages and writes them into the editor's
 * valtio stores (`gameState`, `stageState`, editor `debugState`), replacing
 * the old `zylemEventBus.on('state:dispatch', …)` wiring and window
 * CustomEvent listeners. UI actions send typed editor→game commands through
 * the same channel, so the editor has no runtime dependency on game-lib
 * internals.
 *
 * Hydrates from `channel.getState()` on connect, so an editor mounted after
 * the game started shows current config/entities immediately.
 */

import {
	getZylemBridge,
	type BridgeDebugTool,
	type EntitySelectionPayload,
	type EntitySummaryPayload,
	type EntityThumbnailPayload,
	type StageSnapshotPayload,
	type GameConfigPayload,
	type GameNoticePayload,
	type GameVariablePayload,
} from '@zylem/bridge';

import { gameState } from '../components/game/game-state';
import { stageState } from '../components/stages/stage-state';
import { debugState as editorDebugState } from '../components/entities/entities-state';
import { setDebugStore } from '../components/editor-store';
import { printToConsole } from '../components/console/console-state';
import {
	clearEntityThumbnails,
	removeEntityThumbnails,
	setEntityThumbnails,
} from '../components/entities/thumbnail-store';
import type { BaseEntityInterface } from '../types';

const { channel } = getZylemBridge();

let connected = false;
let connectionCount = 0;
let unsubscribes: (() => void)[] = [];

/**
 * uuid → index into `stageState.entities`. Kept alongside the array so an
 * upsert is a direct lookup instead of a full scan per message.
 */
const entityIndex = new Map<string, number>();

function toEntityInterface(payload: EntitySummaryPayload): BaseEntityInterface {
	const entity: BaseEntityInterface = {
		uuid: payload.uuid,
		name: payload.name,
		type: payload.type,
		position: payload.position,
		rotation: payload.rotation,
		scale: payload.scale,
	};
	if (payload.bounds) {
		entity.bounds = payload.bounds;
	}
	return entity;
}

/** Copy changed fields onto an existing entity, leaving untouched ones alone. */
function updateEntityInPlace(
	target: Partial<BaseEntityInterface>,
	payload: EntitySummaryPayload,
): void {
	if (target.name !== payload.name) target.name = payload.name;
	if (target.type !== payload.type) target.type = payload.type;
	if (!isSameVec3(target.position, payload.position)) {
		target.position = payload.position;
	}
	if (!isSameVec3(target.rotation, payload.rotation)) {
		target.rotation = payload.rotation;
	}
	if (!isSameVec3(target.scale, payload.scale)) {
		target.scale = payload.scale;
	}
	if (payload.bounds && !isSameBounds(target.bounds, payload.bounds)) {
		target.bounds = payload.bounds;
	}
}

function isSameVec3(
	a: { x: number; y: number; z: number } | undefined,
	b: { x: number; y: number; z: number } | undefined,
): boolean {
	if (a === b) return true;
	if (!a || !b) return false;
	return a.x === b.x && a.y === b.y && a.z === b.z;
}

function isSameBounds(
	a: { width: number; height: number; depth: number } | undefined,
	b: { width: number; height: number; depth: number } | undefined,
): boolean {
	if (a === b) return true;
	if (!a || !b) return false;
	return a.width === b.width && a.height === b.height && a.depth === b.depth;
}

/**
 * Apply the display config, writing only the fields that changed. The game's
 * `ResizeObserver` republishes on every layout tick, and assigning a fresh
 * object each time would invalidate every consumer of `gameState.config`.
 */
function applyGameConfig(config: GameConfigPayload): void {
	if (gameState.id !== config.id) {
		gameState.id = config.id;
	}

	const current = gameState.config;
	if (!current) {
		gameState.config = {
			id: config.id,
			aspectRatio: config.aspectRatio,
			fullscreen: config.fullscreen,
			bodyBackground: config.bodyBackground,
			internalResolution: config.internalResolution,
			debug: config.debug,
		};
		return;
	}

	if (current.id !== config.id) current.id = config.id;
	if (current.aspectRatio !== config.aspectRatio) {
		current.aspectRatio = config.aspectRatio;
	}
	if (current.fullscreen !== config.fullscreen) {
		current.fullscreen = config.fullscreen;
	}
	if (current.bodyBackground !== config.bodyBackground) {
		current.bodyBackground = config.bodyBackground;
	}
	if (current.debug !== config.debug) current.debug = config.debug;

	const nextResolution = config.internalResolution;
	const currentResolution = current.internalResolution;
	const resolutionChanged =
		(!nextResolution || !currentResolution)
			? nextResolution !== currentResolution
			: nextResolution.width !== currentResolution.width
			|| nextResolution.height !== currentResolution.height;
	if (resolutionChanged) {
		current.internalResolution = nextResolution;
	}
}

function applyGameVariable(payload: GameVariablePayload): void {
	gameState.globals[payload.path] = payload.value;
}

function applyStageSnapshot(snapshot: StageSnapshotPayload): void {
	if (snapshot.stage) {
		stageState.config = {
			id: snapshot.stage.id,
			backgroundColor: snapshot.stage.backgroundColor,
			backgroundImage: snapshot.stage.backgroundImage,
			gravity: snapshot.stage.gravity,
			inputs: snapshot.stage.inputs,
			variables: snapshot.stage.variables,
		};
	}
	stageState.entities = snapshot.entities.map(toEntityInterface);
	entityIndex.clear();
	stageState.entities.forEach((entity, index) => {
		if (entity.uuid) entityIndex.set(entity.uuid, index);
	});
	clearEntityThumbnails();
	adoptInlineThumbnails(snapshot.entities);
}

/**
 * Route thumbnails that arrived inline on an entity summary into the
 * side-channel store, so every consumer reads them from one place.
 */
function adoptInlineThumbnails(entities: EntitySummaryPayload[]): void {
	const inline = entities
		.filter((payload) => Boolean(payload.thumbnail))
		.map((payload) => ({
			uuid: payload.uuid,
			url: payload.thumbnail as string,
			bounds: payload.bounds,
		}));
	if (inline.length > 0) setEntityThumbnails(inline);
}

/**
 * Merge entity updates by mutating changed entries in place. Replacing the
 * whole array on every message made each upsert cost O(entities) and forced
 * `reconcile` to re-diff the entire list, which is what turned a spawn-heavy
 * game into a frozen tab.
 */
function applyEntityUpsert(entities: EntitySummaryPayload[]): void {
	const current = stageState.entities;
	for (const payload of entities) {
		const index = entityIndex.get(payload.uuid);
		const existing = index === undefined ? undefined : current[index];
		if (!existing) {
			entityIndex.set(payload.uuid, current.length);
			current.push(toEntityInterface(payload));
		} else {
			updateEntityInPlace(existing, payload);
		}
	}
	adoptInlineThumbnails(entities);
}

function applyEntityRemoved(uuids: string[]): void {
	const removed = new Set(uuids);
	const current = stageState.entities;
	// Compact in place, then rebuild the index for the shifted positions.
	let write = 0;
	for (let read = 0; read < current.length; read += 1) {
		const entity = current[read]!;
		if (entity.uuid && removed.has(entity.uuid)) continue;
		current[write] = entity;
		write += 1;
	}
	if (write === current.length) return;

	current.length = write;
	entityIndex.clear();
	current.forEach((entity, index) => {
		if (entity.uuid) entityIndex.set(entity.uuid, index);
	});
	removeEntityThumbnails(uuids);
}

function applyThumbnails(thumbnails: EntityThumbnailPayload[]): void {
	setEntityThumbnails(thumbnails);
}

function applyGameStatus(status: { paused?: boolean; debug?: boolean }): void {
	if (status.paused !== undefined) {
		editorDebugState.paused = status.paused;
		setDebugStore('paused', status.paused);
	}
	if (status.debug !== undefined) {
		setDebugStore('debug', status.debug);
	}
}

function applyEntitySelection(selection: EntitySelectionPayload): void {
	editorDebugState.selectedEntityId = selection.selectedUuid;
	editorDebugState.hoveredEntityId = selection.hoveredUuid;
}

function applyGameNotice(notice: GameNoticePayload): void {
	printToConsole(`[${notice.level}] ${notice.message}`);
}

/**
 * Subscribe the editor stores to game→editor bridge messages and hydrate
 * from the channel's retained state.
 *
 * Reference-counted: the game gates expensive editor-only work (thumbnails,
 * entity summaries) on these subscriptions existing, so the last editor to
 * unmount must actually release them, while any editor still mounted must
 * keep them alive.
 *
 * @returns A release function; safe to call more than once.
 */
export function connectEditorBridge(): () => void {
	connectionCount += 1;
	let released = false;
	const release = () => {
		if (released) return;
		released = true;
		connectionCount -= 1;
		if (connectionCount <= 0) {
			connectionCount = 0;
			disconnectEditorBridge();
		}
	};

	if (connected) return release;
	connected = true;

	unsubscribes = [
		channel.on('game:config', applyGameConfig),
		channel.on('game:variable', applyGameVariable),
		channel.on('game:status', applyGameStatus),
		channel.on('stage:snapshot', applyStageSnapshot),
		channel.on('entity:upsert', applyEntityUpsert),
		channel.on('entity:removed', ({ uuids }) => applyEntityRemoved(uuids)),
		channel.on('entity:thumbnail', applyThumbnails),
		channel.on('entity:selection', applyEntitySelection),
		channel.on('game:notice', applyGameNotice),
	];

	// Rebuild the uuid index from whatever survived a previous connection.
	entityIndex.clear();
	stageState.entities.forEach((entity, index) => {
		if (entity.uuid) entityIndex.set(entity.uuid, index);
	});

	// Hydrate from last-known state so a late-mounting editor is populated
	// without waiting for the game's next publish.
	const config = channel.getState('game:config');
	if (config) applyGameConfig(config);
	const snapshot = channel.getState('stage:snapshot');
	if (snapshot) applyStageSnapshot(snapshot);
	const upserts = channel.getState('entity:upsert');
	if (upserts) applyEntityUpsert(upserts);
	const thumbnails = channel.getState('entity:thumbnail');
	if (thumbnails) applyThumbnails(thumbnails);
	const status = channel.getState('game:status');
	if (status) applyGameStatus(status);
	const selection = channel.getState('entity:selection');
	if (selection) applyEntitySelection(selection);

	return release;
}

/** Tear down all bridge subscriptions, ignoring the reference count. */
export function disconnectEditorBridge(): void {
	for (const unsubscribe of unsubscribes) unsubscribe();
	unsubscribes = [];
	connected = false;
	connectionCount = 0;
}

// ── Editor → game commands ─────────────────────────────────────────────────

/** Toggle the game's debug mode. */
export function sendDebugEnabled(enabled: boolean): void {
	channel.send('debug:set', { enabled });
}

/** Switch the active editor tool in the game. */
export function sendTool(tool: BridgeDebugTool): void {
	channel.send('tool:set', { tool });
}

/** Pause or resume the game loop. */
export function sendPlayback(paused: boolean): void {
	channel.send('playback:set', { paused });
}

/** Select an entity in the game (null clears the selection). */
export function sendEntitySelect(uuid: string | null): void {
	channel.send('entity:select', { uuid });
}

/** Focus/frame the game debug camera on an entity. */
export function sendEntityFocus(uuid: string): void {
	channel.send('entity:focus', { uuid });
}

/** Write a stage variable in the running game. */
export function sendStageVariable(key: string, value: unknown): void {
	channel.send('stage:variable:set', { key, value });
}

/** The shared bridge channel, for advanced subscriptions. */
export { channel as bridgeChannel };
