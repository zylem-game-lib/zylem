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
	type BridgePose,
	type BridgeQuat,
	type BridgeVec3,
	type EntitySummaryPayload,
	type EntityThumbnailPayload,
	type EntityTypeDescriptor,
	type GameConfigPayload,
	type GameLoadingPayload,
	type GameNoticePayload,
	type GameVariablePayload,
	type SceneOperationPayload,
	type SnapSettingsPayload,
	type StageSnapshotPayload,
} from '@zylem/bridge';

import {
	debugState,
	setAddType,
	setDebugTool,
	setGridVisible,
	setPaused,
	setSelectedEntityId,
	setSnapSettings,
} from '../debug/debug-state';
import { focusEntity } from '../debug/entity-focus';
import { eulerToQuaternion, quaternionToEuler } from '../core/transform-math';
import { commitColliderScale } from '../entities/entity-scale';
import type { GameEntity } from '../entities/entity';

/** A THREE `Vector3`-shaped value, as carried by a render object. */
type ScaleVector = BridgeVec3 & {
	set?: (x: number, y: number, z: number) => void;
};

/** The THREE object carrying an entity's render transform. */
function renderScaleOf(entity: any): ScaleVector | undefined {
	const object = entity?.group ?? entity?.mesh;
	return object?.scale;
}

/** Read an entity's scale, defaulting to unit scale. */
export function readEntityScale(entity: any): BridgeVec3 {
	const stored = typeof entity?.getScale === 'function' ? entity.getScale() : undefined;
	const scale: Partial<BridgeVec3> = stored ?? entity?.scale ?? renderScaleOf(entity) ?? {};
	return {
		x: scale.x ?? 1,
		y: scale.y ?? 1,
		z: scale.z ?? 1,
	};
}

/** Read an entity's orientation as a quaternion, when it has a live pose. */
export function readEntityQuaternion(entity: any): BridgeQuat | undefined {
	const pose = typeof entity?.getPose === 'function' ? entity.getPose() : null;
	if (!pose?.rotation) return undefined;
	const { x, y, z, w } = pose.rotation;
	return { x, y, z, w };
}

/**
 * An entity's full current transform, for scene-operation before/after records.
 *
 * Every component is filled in, defaulted where the entity has no live pose,
 * so callers building a complete payload do not have to re-default them.
 */
export function readEntityPose(entity: any): Required<BridgePose> {
	const pose = typeof entity?.getPose === 'function' ? entity.getPose() : null;
	const position = pose?.position ?? { x: 0, y: 0, z: 0 };
	const quaternion = pose?.rotation ?? { x: 0, y: 0, z: 0, w: 1 };
	return {
		position: { x: position.x, y: position.y, z: position.z },
		rotation: quaternionToEuler(quaternion),
		quaternion: {
			x: quaternion.x,
			y: quaternion.y,
			z: quaternion.z,
			w: quaternion.w,
		},
		scale: readEntityScale(entity),
	};
}

/**
 * Write an entity's scale to its render object.
 *
 * Deliberately render-only: colliders are baked in the wasm simulation and
 * rebuilding them means respawning the body, so that is deferred to
 * {@link commitEntityScale} when the gesture commits.
 */
export function applyEntityScale(entity: any, scale: BridgeVec3): void {
	if (typeof entity?.setScale === 'function') {
		entity.setScale(scale.x, scale.y, scale.z);
		return;
	}
	renderScaleOf(entity)?.set?.(scale.x, scale.y, scale.z);
}

/** Rebuild an entity's colliders to match a scale change already applied. */
export function commitEntityScale(entity: any): void {
	if (!entity || typeof entity.getScale !== 'function') return;
	commitColliderScale(entity);
}

/**
 * Apply an absolute pose to an entity.
 *
 * Routed through `setPose`, which teleports the body, rather than the
 * velocity-style `setPosition` mutators — those accumulate a *delta* into the
 * transform store, so feeding them an absolute target would send the entity
 * flying off by its own coordinates every write.
 */
export function applyEntityPose(entity: any, pose: BridgePose): boolean {
	if (!entity) return false;

	const rotation = pose.quaternion
		?? (pose.rotation ? eulerToQuaternion(pose.rotation) : undefined);

	let applied = false;
	if ((pose.position || rotation) && typeof entity.setPose === 'function') {
		applied = entity.setPose({ position: pose.position, rotation });
	}

	if (pose.scale) {
		applyEntityScale(entity, pose.scale);
		applied = true;
	}

	return applied;
}

/**
 * The entity's registered type symbol as the plain string the editor list shows.
 */
export function entityTypeName(entity: unknown): string {
	const type = (entity as { constructor?: { type?: unknown } } | null)
		?.constructor?.type;
	return type
		? String(type).replace('Symbol(', '').replace(')', '')
		: 'Unknown';
}

/**
 * Echo one entity's live transform to the editor.
 *
 * `entity:upsert` is otherwise published only when an entity is added, so the
 * editor's list and inspector would keep showing the pose the entity spawned
 * with. Sending the pose the game actually settled on — rather than trusting
 * the editor's own optimistic write — also corrects the editor when the two
 * disagree.
 *
 * Thumbnail and bounds are left off: the editor merges an upsert field by
 * field and skips absent ones, so a transform echo cannot clobber them.
 */
export function publishEntityTransform(entity: unknown): void {
	const target = entity as { uuid?: string; name?: string } | null;
	if (!target?.uuid) return;

	const channel = getZylemBridge().channel;
	if (!channel.hasSubscribers('entity:upsert')) return;

	const pose = readEntityPose(entity);
	channel.queue('entity:upsert', [{
		uuid: target.uuid,
		name: target.name || 'Unnamed',
		type: entityTypeName(entity),
		position: pose.position,
		rotation: pose.rotation,
		scale: pose.scale,
		quaternion: pose.quaternion,
	}]);
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
	/** Spawn a catalog entity into the current stage (editor `entity:create`). */
	createEntity?(
		typeId: string,
		props: Record<string, unknown> | undefined,
		pose: BridgePose | undefined,
	): void;
	/** Undo or redo a committed scene operation (`scene:operation:apply`). */
	applySceneOperation?(op: SceneOperationPayload, direction: 'undo' | 'redo'): void;
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

	/**
	 * True while an undo/redo is being applied, so the writes it performs are
	 * not themselves recorded as new operations.
	 */
	private applyingSceneOperation = false;

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
			this.channel.on('entity:transform', ({ uuid, position, rotation, quaternion, scale }) => {
				const entity = this.host?.resolveEntity(uuid) as any;
				if (!entity) return;

				const before = readEntityPose(entity);
				applyEntityPose(entity, { position, rotation, quaternion, scale });
				// A numeric-field write is already a committed change, so unlike a
				// gizmo drag it rebuilds colliders immediately.
				if (scale) commitEntityScale(entity);

				publishEntityTransform(entity);

				// Echoed as an operation so inspector edits are undoable on the
				// same stack as gizmo drags. Suppressed while a `scene:operation:
				// apply` is running, or undoing would push its own inverse and the
				// stack would never make progress.
				if (this.applyingSceneOperation) return;
				const after = readEntityPose(entity);
				this.channel.send('scene:operation', {
					opId: `tx-${uuid}-${Date.now().toString(36)}`,
					kind: 'transform',
					label: `Set ${entity.name || 'entity'} transform`,
					entries: [{ uuid, before, after }],
				});
			}),
			this.channel.on('entity:create', ({ typeId, props, pose }) => {
				this.host?.createEntity?.(typeId, props, pose);
			}),
			this.channel.on('scene:operation:apply', ({ op, direction }) => {
				this.applyingSceneOperation = true;
				try {
					this.host?.applySceneOperation?.(op, direction);
				} finally {
					this.applyingSceneOperation = false;
				}
			}),
			this.channel.on('add:type:set', ({ typeId, props }) => {
				setAddType(typeId, props ?? null);
			}),
			this.channel.on('snap:set', (snap) => {
				setSnapSettings(snap);
			}),
			this.channel.on('grid:set', ({ visible }) => {
				setGridVisible(visible);
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
				selectedUuids: [...debugState.selectedEntityIds],
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
	 * An editor takes out both entity subscriptions as it mounts, and each is
	 * a first-subscriber transition. Backfilling on both would republish the
	 * config, the whole stage snapshot, and every thumbnail twice per mount,
	 * so a signal is ignored while the other entity type still has a
	 * listener — that is the same editor finishing its setup, not a new one.
	 *
	 * @returns An unsubscribe function.
	 */
	onEditorAttached(callback: () => void): () => void {
		return this.channel.onSubscriberAdded((type) => {
			if (type !== 'entity:upsert' && type !== 'entity:thumbnail') return;
			const other = type === 'entity:upsert'
				? 'entity:thumbnail'
				: 'entity:upsert';
			if (this.channel.subscriberCount(other) > 0) return;
			callback();
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

	/**
	 * Publish a global's new value.
	 *
	 * Sent rather than queued: a queued payload is merged into the pending one
	 * for its type, and since each message names a single `path`, two globals
	 * changing in the same frame would collapse into one and the first
	 * variable's update would never reach the editor.
	 */
	publishVariable(payload: GameVariablePayload): void {
		this.channel.send('game:variable', payload);
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

	/** Publish the placeable entity types the editor's Add palette offers. */
	publishCatalog(entities: EntityTypeDescriptor[]): void {
		this.channel.send('catalog:snapshot', { entities });
	}

	/**
	 * Publish a committed, invertible change for the editor's undo stack.
	 *
	 * Sent rather than queued: coalescing merges same-type payloads within a
	 * frame, which would fuse two operations into one and lose an undo step.
	 */
	publishSceneOperation(op: SceneOperationPayload): void {
		this.channel.send('scene:operation', op);
	}

	/** Whether an editor is tracking scene operations for undo. */
	wantsSceneOperations(): boolean {
		return this.channel.hasSubscribers('scene:operation');
	}
}

/**
 * Publish a scene operation without a `GameBridge` instance, so the stage's
 * debug delegate can report committed gestures where they happen.
 */
export function publishSceneOperation(op: SceneOperationPayload): void {
	getZylemBridge().channel.send('scene:operation', op);
}

/** Publish the entity catalog without a `GameBridge` instance. */
export function publishEntityCatalog(entities: EntityTypeDescriptor[]): void {
	getZylemBridge().channel.send('catalog:snapshot', { entities });
}

/** Snap settings the editor last pushed, for gizmo drag math. */
export type { SnapSettingsPayload };
