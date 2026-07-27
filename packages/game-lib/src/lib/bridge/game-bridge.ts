/**
 * Game-side adapter for the shared editor ↔ game bridge.
 *
 * Owns the editor→game command subscriptions (debug/tool/playback, entity
 * select/focus/transform, stage variables) and exposes typed publish helpers
 * the running game uses to stream config, stage snapshots, entity upserts,
 * and thumbnails to the editor. High-frequency publishes go through the
 * channel's `queue`, which coalesces to at most one message per animation
 * frame.
 */

import { subscribe } from 'valtio/vanilla';
import {
	announceBridgeReady,
	getZylemBridge,
	type BridgeChannel,
	type BridgeVec3,
	type EntitySummaryPayload,
	type EntityThumbnailPayload,
	type GameConfigPayload,
	type GameLoadingPayload,
	type GameNoticePayload,
	type GameVariablePayload,
	type StageSnapshotPayload,
} from '@zylem/bridge';

import { debugState, setDebugTool, setPaused, setSelectedEntityId } from '../debug/debug-state';
import { focusEntity } from '../debug/entity-focus';
import type { GameEntity } from '../entities/entity';

/** A THREE `Vector3`-shaped value, as carried by a render object. */
type ScaleVector = BridgeVec3 & {
	set?: (x: number, y: number, z: number) => void;
};

/**
 * The THREE object carrying an entity's render transform. Scale is not part
 * of the `GameEntity` mutator surface (unlike position and rotation), so it
 * has to be read and written on the render object directly.
 */
function renderScaleOf(entity: any): ScaleVector | undefined {
	const object = entity?.group ?? entity?.mesh;
	return object?.scale;
}

/** Read an entity's scale, defaulting to unit scale. */
export function readEntityScale(entity: any): BridgeVec3 {
	const scale: Partial<BridgeVec3> = entity?.scale ?? renderScaleOf(entity) ?? {};
	return {
		x: scale.x ?? 1,
		y: scale.y ?? 1,
		z: scale.z ?? 1,
	};
}

/** Write an entity's scale, preferring a `setScale` mutator when present. */
export function applyEntityScale(entity: any, scale: BridgeVec3): void {
	if (typeof entity?.setScale === 'function') {
		entity.setScale(scale.x, scale.y, scale.z);
		return;
	}
	renderScaleOf(entity)?.set?.(scale.x, scale.y, scale.z);
}

/**
 * Send a one-off diagnostic to the editor console without needing a
 * `GameBridge` instance. No-ops harmlessly when no editor is listening.
 */
export function publishGameNotice(
	level: GameNoticePayload['level'],
	message: string,
): void {
	getZylemBridge().channel.send('game:notice', { level, message });
}

/**
 * Host context supplied by the running game so bridge commands can act on
 * live stage state without the bridge importing game internals.
 */
export interface GameBridgeHost {
	/** Resolve a live entity by UUID from the current stage. */
	resolveEntity(uuid: string): GameEntity<any> | null;
	/** Write a stage variable (editor `stage:variable:set`). */
	setStageVariable?(key: string, value: unknown): void;
}

export class GameBridge {
	private channel: BridgeChannel;
	private unsubscribes: (() => void)[] = [];
	private host: GameBridgeHost | null = null;

	/**
	 * Values the editor is already known to hold, either because it commanded
	 * them or because we published them. Anything matching here is skipped, so
	 * an editor command can never echo back as a game update.
	 */
	private editorKnown: {
		paused?: boolean;
		debug?: boolean;
		selectedUuid?: string | null;
		hoveredUuid?: string | null;
	} = {};

	constructor() {
		this.channel = getZylemBridge().channel;
	}

	/**
	 * Subscribe to editor commands and announce the game side as ready.
	 * @param host Live-game context for entity/stage lookups
	 * @param announceTarget DOM node the `zylem:bridge:ready` event bubbles from
	 */
	connect(host: GameBridgeHost, announceTarget?: EventTarget): void {
		this.disconnect();
		this.host = host;

		this.unsubscribes.push(
			this.channel.on('debug:set', ({ enabled }) => {
				this.editorKnown.debug = enabled;
				debugState.enabled = enabled;
			}),
			this.channel.on('tool:set', ({ tool }) => {
				setDebugTool(tool);
			}),
			this.channel.on('playback:set', ({ paused }) => {
				this.editorKnown.paused = paused;
				setPaused(paused);
			}),
			this.channel.on('entity:select', ({ uuid }) => {
				this.editorKnown.selectedUuid = uuid;
				setSelectedEntityId(uuid);
			}),
			this.channel.on('entity:focus', ({ uuid }) => {
				focusEntity(uuid);
			}),
			this.channel.on('entity:transform', ({ uuid, position, rotation, scale }) => {
				const entity = this.host?.resolveEntity(uuid) as any;
				if (!entity) return;
				if (position && typeof entity.setPosition === 'function') {
					entity.setPosition(position.x, position.y, position.z);
				}
				if (rotation) {
					entity.setRotationX?.(rotation.x);
					entity.setRotationY?.(rotation.y);
					entity.setRotationZ?.(rotation.z);
				}
				if (scale) {
					applyEntityScale(entity, scale);
				}
			}),
			this.channel.on('stage:variable:set', ({ key, value }) => {
				this.host?.setStageVariable?.(key, value);
			}),
			// Mirror game-owned debug state back to the editor so in-scene
			// selections and game-side debug toggles stay in sync.
			subscribe(debugState, () => this.publishDebugStateChanges()),
		);

		this.publishDebugStateChanges();
		announceBridgeReady(announceTarget);
	}

	disconnect(): void {
		for (const unsubscribe of this.unsubscribes) unsubscribe();
		this.unsubscribes = [];
		this.host = null;
		this.editorKnown = {};
	}

	/**
	 * Publish only the parts of `debugState` the editor does not already know.
	 * Values that arrived as editor commands are recorded on `editorKnown`
	 * first, so they are never echoed back.
	 */
	private publishDebugStateChanges(): void {
		const status: { paused?: boolean; debug?: boolean } = {};
		if (debugState.paused !== this.editorKnown.paused) {
			this.editorKnown.paused = debugState.paused;
			status.paused = debugState.paused;
		}
		if (debugState.enabled !== this.editorKnown.debug) {
			this.editorKnown.debug = debugState.enabled;
			status.debug = debugState.enabled;
		}
		if (status.paused !== undefined || status.debug !== undefined) {
			this.publishStatus(status);
		}

		const selectionChanged =
			debugState.selectedEntityId !== this.editorKnown.selectedUuid
			|| debugState.hoveredEntityId !== this.editorKnown.hoveredUuid;
		if (selectionChanged) {
			this.editorKnown.selectedUuid = debugState.selectedEntityId;
			this.editorKnown.hoveredUuid = debugState.hoveredEntityId;
			this.channel.queue('entity:selection', {
				selectedUuid: debugState.selectedEntityId,
				hoveredUuid: debugState.hoveredEntityId,
			});
		}
	}

	// ── Demand gating ───────────────────────────────────────────────────────

	/**
	 * Whether anything is listening for entity list updates. Building entity
	 * summaries is pure editor overhead, so publishers skip it when no editor
	 * is attached.
	 */
	wantsEntityUpdates(): boolean {
		return (
			this.channel.hasSubscribers('entity:upsert')
			|| this.channel.hasSubscribers('stage:snapshot')
		);
	}

	/**
	 * Whether anything is listening for thumbnails. Each thumbnail costs an
	 * offscreen render plus a pixel readback on the renderer the game draws
	 * with, so this gate matters far more than the others.
	 */
	wantsThumbnails(): boolean {
		return this.channel.hasSubscribers('entity:thumbnail');
	}

	/**
	 * Run a callback when an editor first subscribes to entity data, so the
	 * game can backfill state produced while nothing was listening.
	 *
	 * @returns An unsubscribe function.
	 */
	onEditorAttached(callback: () => void): () => void {
		return this.channel.onSubscriberAdded((type) => {
			if (type === 'entity:upsert' || type === 'entity:thumbnail') {
				callback();
			}
		});
	}

	// ── Publish helpers (game → editor) ─────────────────────────────────────

	publishConfig(config: GameConfigPayload): void {
		this.channel.send('game:config', config);
	}

	publishLoading(payload: GameLoadingPayload): void {
		this.channel.send('game:loading', payload);
	}

	publishStatus(status: { paused?: boolean; debug?: boolean }): void {
		this.channel.queue('game:status', status);
	}

	publishVariable(payload: GameVariablePayload): void {
		this.channel.queue('game:variable', payload);
	}

	/** Surface a diagnostic message in the editor console. */
	publishNotice(level: GameNoticePayload['level'], message: string): void {
		this.channel.send('game:notice', { level, message });
	}

	publishStageSnapshot(snapshot: StageSnapshotPayload): void {
		this.channel.send('stage:snapshot', snapshot);
	}

	/** RAF-coalesced entity add/update stream; merged by uuid per frame. */
	queueEntityUpsert(entities: EntitySummaryPayload[]): void {
		if (!entities.length) return;
		this.channel.queue('entity:upsert', entities);
	}

	/** RAF-coalesced entity removal stream. */
	queueEntityRemoved(uuids: string[]): void {
		if (!uuids.length) return;
		this.channel.queue('entity:removed', { uuids });
	}

	/** RAF-coalesced thumbnail stream; merged by uuid per frame. */
	queueThumbnails(thumbnails: EntityThumbnailPayload[]): void {
		if (!thumbnails.length) return;
		this.channel.queue('entity:thumbnail', thumbnails);
	}
}
