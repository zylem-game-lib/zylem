import { Color, Vector2 } from 'three';
import { createText, getGlobal } from '@zylem/game-lib';
import type { ErrorContext } from '../../../spacetimedb-generated';
import type { EntityTransform, Player } from '../../../spacetimedb-generated/types';
import {
	connectArenaModule,
	getArenaSpacetimeUri,
	preflightArenaSpacetimeUri,
	type ArenaDbConnection,
} from '../networking/arena-stdb-client';
import {
	type CharacterClass,
	isCharacterClass,
} from '../characters';
import type {
	ArenaMainStageHandle,
	LocalTransformPayload,
	PlayerEntity,
} from './main-stage';
import { createAiHost } from './ai-host';
import { createEnemies, type EnemiesHandle } from './enemies';

/**
 * Sentinel entity ID used for the local player when running in offline mode.
 * Keeps the `avatars` map keyed uniformly by bigint even when there's no
 * STDB row backing the local avatar.
 */
const OFFLINE_PLAYER_ENTITY_ID = BigInt(-1);

/**
 * Configuration consumed by `bootstrapArenaNetwork`. All values are
 * snapshotted at bootstrap time from the lobby globals.
 */
export interface BootstrapArenaNetworkConfig {
	/** Stable per-device identifier used to identify this client to STDB. */
	deviceId: string;
	/** Display name shown in the floating nameplate. */
	displayName: string;
	/** 32-bit RGBA encoded avatar tint. */
	colorU32: number;
}

export interface ArenaNetworkHandle {
	/**
	 * Disconnect from STDB and clear all network-side state (pending
	 * transforms, connection, error banner). Idempotent.
	 */
	reset(): void;
}

/**
 * Decode a 32-bit packed RGB value into a Three.js `Color`. Alpha bits
 * are ignored — avatar colours in the arena are opaque.
 */
function u32ToColor(u: number): Color {
	const r = ((u >>> 16) & 255) / 255;
	const g = ((u >>> 8) & 255) / 255;
	const b = (u & 255) / 255;
	return new Color(r, g, b);
}

/**
 * STDB row ids come over the wire as `bigint | number` depending on the
 * codec path. Always normalise to `bigint` so Map keys and `===` checks
 * stay consistent.
 */
function entityIdOf(id: bigint | number): bigint {
	return BigInt(id);
}

function entityIdsEqual(
	a: bigint | number,
	b: bigint | number | null | undefined,
): boolean {
	if (b === null || b === undefined) return false;
	return BigInt(a) === BigInt(b);
}

/**
 * Resolve the local player's character class from the game globals,
 * defaulting to `tank` when nothing has been set yet (e.g. screenshots
 * or deep links that bypass the lobby overlay).
 */
function getLocalCharacterClass(): CharacterClass {
	const raw = getGlobal<string>('arenaCharacterClass');
	return isCharacterClass(raw) ? raw : 'tank';
}

/** Forcibly snap a physics body + render group to the supplied transform. */
function applyNetworkTransform(entity: PlayerEntity, t: EntityTransform): void {
	const q = { x: t.rotX, y: t.rotY, z: t.rotZ, w: t.rotW };
	const b = entity.body as {
		setTranslation: (v: { x: number; y: number; z: number }, wake: boolean) => void;
		setRotation: (v: { x: number; y: number; z: number; w: number }, wake: boolean) => void;
		setLinvel: (v: { x: number; y: number; z: number }, wake: boolean) => void;
		setAngvel: (v: { x: number; y: number; z: number }, wake: boolean) => void;
	};
	if (b) {
		b.setTranslation({ x: t.posX, y: t.posY, z: t.posZ }, true);
		b.setRotation(q, true);
		b.setLinvel({ x: 0, y: 0, z: 0 }, true);
		b.setAngvel({ x: 0, y: 0, z: 0 }, true);
	}
	if (entity.transformStore) {
		entity.transformStore.rotation.x = q.x;
		entity.transformStore.rotation.y = q.y;
		entity.transformStore.rotation.z = q.z;
		entity.transformStore.dirty.rotation = false;
	}
	if (entity.group) {
		entity.group.quaternion.set(q.x, q.y, q.z, q.w);
	}
}

function applyNetworkAnimation(entity: PlayerEntity, t: EntityTransform): void {
	entity.playAnimation({
		key: t.animKey,
		pauseAtEnd: t.animPauseAtEnd,
	});
}

function applyRemoteEntityState(entity: PlayerEntity, t: EntityTransform): void {
	applyNetworkTransform(entity, t);
	applyNetworkAnimation(entity, t);
}

/** Resolve a remote player's character class with a safe tank fallback. */
function resolveRemoteCharacterClass(raw: string): CharacterClass {
	return isCharacterClass(raw) ? raw : 'tank';
}

/**
 * Build a human-friendly hint pointing the user at what to do when the
 * STDB preflight fails. Handles both local dev (`localhost`) and
 * deployed setups with custom hosts.
 */
function getNetworkTroubleshootingHint(): string {
	const uri = getArenaSpacetimeUri();
	const host = (() => {
		try {
			return new URL(uri).hostname;
		} catch {
			return '';
		}
	})();
	const isLocalHost =
		host === 'localhost' || host === '127.0.0.1' || host === '[::1]';

	if (isLocalHost) {
		return `Target: ${uri}\nWith the server running, publish once: pnpm --filter @zylem/spacetime-server run publish:local`;
	}
	const message = `Target: ${uri}\nIf this is a deployed build, that host must serve /v1/* through the Docker/nginx + SpacetimeDB setup from render.yaml. If the examples app is hosted separately, set VITE_STDB_URI to the public SpacetimeDB service origin instead of the frontend host.`;
	console.warn(message);
	return message;
}

/**
 * Wire the arena's main stage to the SpacetimeDB `arena` module.
 *
 * Flow:
 * 1. Preflight the STDB endpoint. If unreachable, fall back to offline
 *    mode (spawn a solo local avatar so the player can still explore
 *    the stage).
 * 2. Connect + register this device as a player, then publish the
 *    chosen character class.
 * 3. Claim (or observe) the `ai_host` singleton so the cluster agrees
 *    on a single enemy-simulation owner.
 * 4. Subscribe to `player`, `entity_transform`, and `enemy`, mirroring
 *    remote avatars + enemy actors on the main stage and pushing the
 *    local player's pose every frame.
 *
 * Returns a handle whose `reset()` disconnects and clears all
 * network-side state. Safe to call from `mainStage.onDestroy`.
 */
export function bootstrapArenaNetwork(
	handle: ArenaMainStageHandle,
	config: BootstrapArenaNetworkConfig,
): ArenaNetworkHandle {
	const { stage, mainCamera: _mainCamera } = handle;
	const pendingTransforms = new Map<bigint, EntityTransform>();
	let conn: ArenaDbConnection | null = null;
	let tearingDown = false;
	let netErrorBanner: ReturnType<typeof createText> | null = null;
	const aiHost = createAiHost();
	let enemies: EnemiesHandle | null = null;

	const deviceId = config.deviceId.trim();
	const localCharacterClass = getLocalCharacterClass();

	function reportNetError(context: string, err: unknown): void {
		const msg = err instanceof Error ? err.message : String(err);
		const hint = getNetworkTroubleshootingHint();
		const full = `SpacetimeDB ${context}: ${msg}\n${hint}`;
		console.error('[arena]', context, err);
		if (!netErrorBanner) {
			netErrorBanner = createText({
				text: full,
				stickToViewport: true,
				screenPosition: new Vector2(0.5, 0.08),
				fontColor: '#ffaaaa',
				fontSize: 13,
				backgroundColor: 'rgba(0,0,0,0.7)',
				padding: 10,
			});
			stage.add(netErrorBanner);
		} else {
			netErrorBanner.updateText(full);
		}
	}

	/**
	 * Build the `onLocalTransform` callback the main stage will invoke
	 * every frame for the local player. Each call turns into a
	 * `setEntityTransform` reducer call once we have both a connection
	 * and a known entity id.
	 */
	function makeLocalTransformPusher(
		getLocalEntityId: () => bigint | null,
	): (payload: LocalTransformPayload) => void {
		return (payload) => {
			const c = conn;
			const eid = getLocalEntityId();
			if (!c || eid === null) return;
			void c.reducers.setEntityTransform({
				deviceId,
				entityId: eid,
				posX: payload.position.x,
				posY: payload.position.y,
				posZ: payload.position.z,
				rotX: payload.rotation.x,
				rotY: payload.rotation.y,
				rotZ: payload.rotation.z,
				rotW: payload.rotation.w,
				scaleX: payload.scale.x,
				scaleY: payload.scale.y,
				scaleZ: payload.scale.z,
				animKey: payload.animation.key,
				animPauseAtEnd: payload.animation.pauseAtEnd ?? false,
			});
		};
	}

	function spawnAvatarForPlayer(
		c: ArenaDbConnection,
		player: Player,
	): void {
		const eid = entityIdOf(player.entityId);
		if (handle.avatars.has(eid)) return;

		const t =
			c.db.entity_transform.entity_id.find(eid) ??
			pendingTransforms.get(eid);
		const pos = t
			? { x: t.posX, y: t.posY, z: t.posZ }
			: { x: 0, y: 0, z: 0 };

		const color = u32ToColor(player.colorU32);
		const isLocal = player.deviceId.trim() === deviceId;

		const klass = isLocal
			? localCharacterClass
			: resolveRemoteCharacterClass(player.characterClass);

		const rec = handle.spawnAvatar({
			entityId: eid,
			isLocal,
			displayName: player.displayName,
			characterClass: klass,
			color,
			position: pos,
			deviceId: player.deviceId,
			onLocalTransform: isLocal
				? makeLocalTransformPusher(handle.getLocalEntityId)
				: undefined,
		});

		// Seed the initial HP on the record so the nameplate picks it up.
		handle.applyPlayerHp(eid, player.hp, player.maxHp);

		// Let the enemies module know this avatar now exists so AI-host
		// target resolution works (both locally-driven and remote).
		enemies?.attachAvatar(eid, rec);

		if (!isLocal) {
			// When the animation rig finishes loading asynchronously, flush
			// any queued transforms so the avatar snaps into the right pose
			// on first appearance rather than waiting for the next tick.
			rec.actor.listen('entity:animation:loaded', () => {
				const latest = pendingTransforms.get(eid);
				if (!latest) return;
				applyRemoteEntityState(rec.actor, latest);
			});
		}

		if (t && !isLocal) {
			applyRemoteEntityState(rec.actor, t);
		}
	}

	/**
	 * Spawn the local avatar without a STDB connection. Used as a
	 * fallback when the preflight / connect fails so the player can
	 * still explore the stage with their chosen name and colour.
	 */
	function spawnOfflineLocalPlayer(): void {
		if (handle.getLocalActor()) return;
		const displayName = getGlobal<string>('arenaDisplayName') ?? 'Player';
		const colorU32 = getGlobal<number>('arenaColorU32') ?? 0xff4a90e2;
		handle.spawnAvatar({
			entityId: OFFLINE_PLAYER_ENTITY_ID,
			isLocal: true,
			displayName,
			characterClass: localCharacterClass,
			color: u32ToColor(colorU32),
			position: { x: 0, y: 0, z: 0 },
			deviceId,
		});
	}

	void (async () => {
		try {
			await preflightArenaSpacetimeUri();
		} catch (err) {
			console.warn('[arena] SpacetimeDB unavailable – running offline:', err);
			spawnOfflineLocalPlayer();
			return;
		}

		conn = connectArenaModule({
			onConnect: (c, identity) => {
				void c.reducers.registerPlayer({
					deviceId,
					displayName: config.displayName,
					colorU32: config.colorU32,
				});
				void c.reducers.setPlayerCharacterClass({
					deviceId,
					characterClass: localCharacterClass,
				});
				aiHost.init(c, identity);
			},
			onConnectError: (_ctx, err) => {
				reportNetError('connect failed', err);
				spawnOfflineLocalPlayer();
			},
			onDisconnect: () => {
				if (tearingDown) return;
				console.warn('[arena] SpacetimeDB disconnected');
			},
		});

		const currentConn = conn;

		// Stand up the enemies module immediately so its STDB hooks are
		// registered before we receive the initial subscription dump.
		enemies = createEnemies({
			handle,
			aiHost,
			conn: currentConn,
			deviceId,
		});
		handle.setAttackHitHandler(enemies.resolveAttackHit);
		handle.setFallRespawnHandler((info) => {
			void currentConn.reducers.respawnPlayer({
				deviceId: info.deviceId,
				posX: info.spawn.x,
				posY: info.spawn.y,
				posZ: info.spawn.z,
			});
		});

		currentConn.db.entity_transform.onInsert((_ctx, row) => {
			const eid = entityIdOf(row.entityId);
			pendingTransforms.set(eid, row);
			const rec = handle.avatars.get(eid);
			if (!rec || rec.isLocal) return;
			applyRemoteEntityState(rec.actor, row);
		});

		currentConn.db.entity_transform.onUpdate((_ctx, _old, row) => {
			const eid = entityIdOf(row.entityId);
			if (entityIdsEqual(eid, handle.getLocalEntityId())) return;
			const rec = handle.avatars.get(eid);
			if (!rec || rec.isLocal) return;
			applyRemoteEntityState(rec.actor, row);
		});

		currentConn.db.entity_transform.onDelete((_ctx, row) => {
			const eid = entityIdOf(row.entityId);
			pendingTransforms.delete(eid);
			handle.removeAvatar(eid);
			enemies?.detachAvatar(eid);
		});

		currentConn.db.player.onInsert((_ctx, row) => {
			spawnAvatarForPlayer(currentConn, row);
		});

		currentConn.db.player.onUpdate((_ctx, _old, row) => {
			const eid = entityIdOf(row.entityId);
			const rec = handle.avatars.get(eid);
			if (rec) {
				// HP may change independently of nameplate text; update both.
				handle.applyPlayerHp(eid, row.hp, row.maxHp);
			}
		});

		currentConn.db.player.onDelete((_ctx, row) => {
			const eid = entityIdOf(row.entityId);
			handle.removeAvatar(eid);
			enemies?.detachAvatar(eid);
		});

		currentConn
			.subscriptionBuilder()
			.onApplied((ctx) => {
				for (const t of ctx.db.entity_transform.iter()) {
					pendingTransforms.set(entityIdOf(t.entityId), t);
				}
				for (const p of ctx.db.player.iter()) {
					spawnAvatarForPlayer(currentConn, p);
				}
				for (const t of ctx.db.entity_transform.iter()) {
					const eid = entityIdOf(t.entityId);
					if (entityIdsEqual(eid, handle.getLocalEntityId())) continue;
					const rec = handle.avatars.get(eid);
					if (!rec || rec.isLocal) continue;
					applyRemoteEntityState(rec.actor, t);
				}
			})
			.onError((ctx: ErrorContext) => {
				reportNetError(
					'subscription failed',
					ctx.event ?? new Error('Unknown subscription error'),
				);
			})
			.subscribeToAllTables();
	})();

	return {
		reset() {
			tearingDown = true;
			enemies?.reset();
			enemies = null;
			aiHost.reset();
			handle.setAttackHitHandler(null);
			handle.setFallRespawnHandler(null);
			conn?.disconnect();
			conn = null;
			pendingTransforms.clear();
			netErrorBanner = null;
		},
	};
}
