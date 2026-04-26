/// <reference types="@zylem/assets" />

import { Color, Vector2, Vector3 } from 'three';
import {
	type UpdateContext,
	createCamera,
	createGame,
	createPlane,
	createStage,
	createText,
	getGlobal,
	mergeInputConfigs,
	setGlobal,
	useArrowsForAxes,
	useWASDForAxes,
} from '@zylem/game-lib';
import {
	ZylemRuntimePlatformer3DFsmState,
	type ZylemRuntimeStaticBoxCollider,
} from '@zylem/game-lib/runtime';
import { Platformer3DRuntimeAdapter } from '../runtime/platformer-3d-runtime';
import type { ErrorContext } from '../spacetimedb-generated';
import type { EntityTransform, Player } from '../spacetimedb-generated/types';
import { playgroundActor } from '../utils';
import { TransformableEntity } from '~/lib/actions/capabilities/apply-transform';
import { GameEntity } from '~/lib/entities';
import { StageEntity } from '@zylem/game-lib';
import {
	fourCharLobbyStore,
	getOrCreateFourCharDeviceId,
} from './four-characters-lobby-store';
import {
	connectFourCharModule,
	type FourCharDbConnection,
	getFourCharSpacetimeUri,
	preflightFourCharSpacetimeUri,
} from './four-characters-stdb-client';

type PlayerEntity = TransformableEntity & GameEntity<any> & StageEntity;
type StageHandle = ReturnType<typeof createStage>;

type AvatarRecord = {
	actor: PlayerEntity;
	nameplate: ReturnType<typeof createText>;
	deviceId: string;
	isLocal: boolean;
};

type NetworkAnimationState = {
	key: string;
	pauseAtEnd?: boolean;
};

/** Capsule dimensions for `playgroundActor('player')` (size.y = 3.8). */
const PLAYER_CAPSULE = {
	halfHeight: 1.4,
	radius: 0.5,
} as const;

/** Y offset to apply to the WASM capsule centre to align the FBX feet with the visual ground. */
const PLAYER_FEET_OFFSET = PLAYER_CAPSULE.halfHeight + PLAYER_CAPSULE.radius;

function u32ToColor(u: number): Color {
	const r = ((u >>> 16) & 255) / 255;
	const g = ((u >>> 8) & 255) / 255;
	const b = (u & 255) / 255;
	return new Color(r, g, b);
}

/**
 * Maps the FSM state from the wasm runtime to a renderable animation key.
 * Mirrors the legacy TS-side `Platformer3DBehavior` state names so the
 * existing FBX clips don't have to be renamed.
 */
function animationForFsmState(
	state: ZylemRuntimePlatformer3DFsmState,
): NetworkAnimationState {
	switch (state) {
		case ZylemRuntimePlatformer3DFsmState.Running:
			return { key: 'running' };
		case ZylemRuntimePlatformer3DFsmState.Walking:
			return { key: 'walking' };
		case ZylemRuntimePlatformer3DFsmState.Jumping:
			return { key: 'jumping-up', pauseAtEnd: true };
		case ZylemRuntimePlatformer3DFsmState.Falling:
			return { key: 'jumping-up', pauseAtEnd: true };
		case ZylemRuntimePlatformer3DFsmState.Landing:
			return { key: 'jumping-down', pauseAtEnd: true };
		case ZylemRuntimePlatformer3DFsmState.Idle:
		default:
			return { key: 'idle' };
	}
}

function applyNetworkTransform(entity: PlayerEntity, t: EntityTransform) {
	const q = { x: t.rotX, y: t.rotY, z: t.rotZ, w: t.rotW };
	const b = entity.body as
		| {
			setTranslation: (v: { x: number; y: number; z: number }, wake: boolean) => void;
			setRotation: (v: { x: number; y: number; z: number; w: number }, wake: boolean) => void;
			setLinvel: (v: { x: number; y: number; z: number }, wake: boolean) => void;
			setAngvel: (v: { x: number; y: number; z: number }, wake: boolean) => void;
		}
		| undefined;
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
		entity.transformStore.rotation.w = q.w;
		entity.transformStore.dirty.rotation = false;
	}
	if (entity.group) {
		entity.group.quaternion.set(q.x, q.y, q.z, q.w);
	}
}

function applyNetworkAnimation(entity: PlayerEntity, t: EntityTransform) {
	entity.playAnimation({
		key: t.animKey,
		pauseAtEnd: t.animPauseAtEnd,
	});
}

function applyRemoteEntityState(entity: PlayerEntity, t: EntityTransform) {
	applyNetworkTransform(entity, t);
	applyNetworkAnimation(entity, t);
}

/** u64 row fields may arrive as bigint or number; Map keys and `===` must stay consistent. */
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

export default function createDemo() {
	const lobbyCamera = createCamera({
		position: { x: 0, y: 4, z: 10 },
		target: { x: 0, y: 0, z: 0 },
	});

	const lobbyStage = createStage(
		{
			backgroundColor: new Color(0x111122),
		},
		lobbyCamera,
	);

	const groundPlane = createPlane({
		tile: { x: 100, y: 100 },
		position: { x: 0, y: -4, z: 0 },
		collision: { static: true },
		randomizeHeight: false,
		material: {
			color: new Color(0x666666),
		},
	});

	const mainCamera = createCamera({
		position: { x: 0, y: 8, z: 7 },
		perspective: 'third-person',
	});

	// Mirror the flat ground plane into the wasm runtime as a single static
	// box. The plane is `tile: 100x100` at y=-4 with thickness ~1 (so the
	// top surface sits at y=-3.5, matching the visible ground). The KCC
	// stands on this box.
	const groundStaticCollider: ZylemRuntimeStaticBoxCollider = {
		center: [0, -4.5, 0],
		halfExtents: [50, 0.5, 50],
		friction: 0.95,
	};

	// Adapter is constructed up-front so the stage knows about it before
	// any avatars spawn. The local player entity is plumbed in lazily via
	// `setLocalPlayer()` once spawned (network or offline path).
	const platformerAdapter = new Platformer3DRuntimeAdapter({
		// `null` placeholder \u2014 swapped in via `setLocalPlayer`. Until then,
		// `ownsEntity` returns false so the stage skips this adapter.
		player: null,
		capsule: {
			position: [0, 5, 0],
			halfHeight: PLAYER_CAPSULE.halfHeight,
			radius: PLAYER_CAPSULE.radius,
		},
		staticColliders: [groundStaticCollider],
	});

	const mainStage = createStage(
		{
			gravity: new Vector3(0, -9.82, 0),
			backgroundColor: new Color(0x222233),
			runtimeAdapter: platformerAdapter,
		},
		mainCamera,
	).setInputConfiguration(
		mergeInputConfigs(useArrowsForAxes('p1'), useWASDForAxes('p1')),
	);

	const avatars = new Map<bigint, AvatarRecord>();
	const pendingTransforms = new Map<bigint, EntityTransform>();
	const net: {
		conn: FourCharDbConnection | null;
		localEntityId: bigint | null;
		localDeviceId: string;
	} = { conn: null, localEntityId: null, localDeviceId: '' };

	let localActor: PlayerEntity | null = null;
	const lastMovement = new Vector3();

	function removeAvatarForEntity(entityId: bigint, stage: StageHandle) {
		const rec = avatars.get(entityId);
		if (!rec || !stage.wrappedStage) return;
		stage.wrappedStage.removeEntityByUuid(rec.actor.uuid);
		stage.wrappedStage.removeEntityByUuid(rec.nameplate.uuid);
		avatars.delete(entityId);
		pendingTransforms.delete(entityId);
	}

	/**
	 * Wire the wasm-driven platformer onto the (single) local actor.
	 * Idempotent \u2014 calling it again with a different actor is currently
	 * unsupported (the runtime session is bootstrapped once on first init).
	 */
	function attachLocalPlayer(actor: PlayerEntity) {
		// Mark the entity as runtime-owned so the stage entity delegate
		// skips creating a TS Rapier body. The adapter drives its pose
		// from wasm.
		(actor.options as any).runtime = { simulation: 'runtime' };
		platformerAdapter.setPlayer(actor);
		mainCamera.cameraRef.target = actor;
		localActor = actor;
	}

	/**
	 * Per-frame local-player update: push input into the wasm adapter,
	 * mirror the FSM state into an animation, snap the visual yaw to the
	 * last non-zero movement direction, and forward the resolved pose
	 * over the network.
	 */
	function installLocalUpdate(actor: PlayerEntity) {
		actor.onUpdate(({ inputs, me }: UpdateContext<any>) => {
			const { p1 } = inputs;
			const horizontal = p1.axes.Horizontal.value;
			const vertical = p1.axes.Vertical.value;
			const jumpHeld = p1.buttons.A.held > 0;
			const runHeld = p1.shoulders.LTrigger.held > 0;

			platformerAdapter.pushInput(horizontal, vertical, jumpHeld, runHeld);

			if (Math.abs(horizontal) > 0.2 || Math.abs(vertical) > 0.2) {
				lastMovement.set(horizontal, 0, vertical);
			}
			if (lastMovement.lengthSq() > 0) {
				const yaw = Math.atan2(-lastMovement.x, lastMovement.z);
				platformerAdapter.setFacing(yaw);
			}

			const animation = animationForFsmState(platformerAdapter.currentState());
			me.playAnimation(animation);

			const c = net.conn;
			if (!c || net.localEntityId === null) return;
			// With the wasm adapter the entity has no Rapier body, so read
			// the resolved pose from the player's group (which the adapter
			// wrote during the previous tick's `step`).
			const group = me.group;
			if (!group) return;
			const tr = group.position;
			const q = group.quaternion;
			void c.reducers.setEntityTransform({
				deviceId: net.localDeviceId,
				entityId: net.localEntityId,
				posX: tr.x,
				posY: tr.y,
				posZ: tr.z,
				rotX: q.x,
				rotY: q.y,
				rotZ: q.z,
				rotW: q.w,
				scaleX: group.scale.x,
				scaleY: group.scale.y,
				scaleZ: group.scale.z,
				animKey: animation.key,
				animPauseAtEnd: animation.pauseAtEnd ?? false,
			});
		});
	}

	function spawnAvatarForPlayer(
		conn: FourCharDbConnection,
		stage: StageHandle,
		player: Player,
	) {
		const eid = entityIdOf(player.entityId);
		if (avatars.has(eid)) return;

		const t =
			conn.db.entity_transform.entity_id.find(eid) ??
			pendingTransforms.get(eid);
		const pos = t
			? { x: t.posX, y: t.posY, z: t.posZ }
			: { x: 0, y: 0, z: 0 };

		const color = u32ToColor(player.colorU32);
		const actor = playgroundActor('player', color, pos) as PlayerEntity;
		const nameplate = createText({
			text: player.displayName,
			stickToViewport: false,
			fontSize: 22,
			fontColor: '#f5f5f5',
		});

		const isLocal = player.deviceId.trim() === net.localDeviceId;
		const rec: AvatarRecord = { actor, nameplate, deviceId: player.deviceId, isLocal };
		avatars.set(eid, rec);
		actor.listen('entity:animation:loaded', () => {
			if (isLocal) return;
			const latest = pendingTransforms.get(eid);
			if (!latest) return;
			applyRemoteEntityState(actor, latest);
		});

		if (isLocal) {
			net.localEntityId = eid;
			attachLocalPlayer(actor);
			// Teleport the wasm capsule to the network-authoritative spawn
			// position so we don't ignore the `entity_transform` row that
			// arrived during subscription.
			platformerAdapter.teleport(pos.x, pos.y + PLAYER_FEET_OFFSET, pos.z);
			installLocalUpdate(actor);
		}

		stage.add(actor, nameplate);

		if (t && !isLocal) {
			applyRemoteEntityState(actor, t);
		}
	}

	let networkBootstrapped = false;
	let networkTearingDown = false;
	let netErrorBanner: ReturnType<typeof createText> | null = null;

	function getNetworkTroubleshootingHint() {
		const uri = getFourCharSpacetimeUri();
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

	function reportNetError(context: string, err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		const hint = getNetworkTroubleshootingHint();
		const full = `SpacetimeDB ${context}: ${msg}\n${hint}`;
		console.error('[four-characters-plane]', context, err);
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
			mainStage.add(netErrorBanner);
		} else {
			netErrorBanner.updateText(full);
		}
	}

	/** Sentinel entity ID used for the local player when running in offline mode. */
	const OFFLINE_PLAYER_ENTITY_ID = BigInt(-1);

	/**
	 * Spawns the local player in offline mode (no SpacetimeDB connection).
	 * Used as a fallback when the server is unavailable so the player can still
	 * move around with their chosen name and colour.
	 */
	function spawnOfflineLocalPlayer(stage: StageHandle) {
		// Guard against duplicate spawns. In the `onConnectError` path this can only
		// fire before a successful connection (and therefore before `spawnAvatarForPlayer`
		// has ever set `localActor`), so when the guard triggers it means the player is
		// already visible and no action is needed.
		if (localActor) return;

		const displayName = getGlobal<string>('fourCharDisplayName') ?? 'Player';
		const colorU32 = getGlobal<number>('fourCharColorU32') ?? 0xff4a90e2;
		const color = u32ToColor(colorU32);

		const actor = playgroundActor('player', color, { x: 0, y: 0, z: 0 }) as PlayerEntity;
		const nameplate = createText({
			text: displayName,
			stickToViewport: false,
			fontSize: 22,
			fontColor: '#f5f5f5',
		});

		const eid = OFFLINE_PLAYER_ENTITY_ID;
		const rec: AvatarRecord = { actor, nameplate, deviceId: net.localDeviceId, isLocal: true };
		avatars.set(eid, rec);
		net.localEntityId = eid;

		attachLocalPlayer(actor);
		installLocalUpdate(actor);

		stage.add(actor, nameplate);
	}

	function resetNetworkState() {
		networkTearingDown = true;
		net.conn?.disconnect();
		net.conn = null;
		net.localEntityId = null;
		net.localDeviceId = '';
		localActor = null;
		lastMovement.set(0, 0, 0);
		avatars.clear();
		pendingTransforms.clear();
		netErrorBanner = null;
		networkBootstrapped = false;
	}

	function bootstrapNetwork() {
		if (networkBootstrapped) return;
		networkBootstrapped = true;
		networkTearingDown = false;

		const rawDeviceId =
			getGlobal<string>('fourCharDeviceId') ?? getOrCreateFourCharDeviceId();
		const deviceId = rawDeviceId.trim();
		const displayName = getGlobal<string>('fourCharDisplayName') ?? 'Player';
		const colorU32 = getGlobal<number>('fourCharColorU32') ?? 0xff4a90e2;
		net.localDeviceId = deviceId;

		const st = mainStage;

		void (async () => {
			try {
				await preflightFourCharSpacetimeUri();
			} catch (err) {
				// SpacetimeDB is not reachable (e.g. staging/production without the
				// Docker service). Fall back to offline single-player mode so the user
				// can still play with their chosen name and colour.
				console.warn('[four-characters-plane] SpacetimeDB unavailable – running offline:', err);
				spawnOfflineLocalPlayer(st);
				return;
			}

			const conn = connectFourCharModule({
				onConnect: (c) => {
					void c.reducers.registerPlayer({
						deviceId,
						displayName,
						colorU32,
					});
				},
				onConnectError: (_ctx, err) => {
					reportNetError('connect failed', err);
					// Fall back to offline mode if the player hasn't been spawned yet.
					spawnOfflineLocalPlayer(st);
				},
				onDisconnect: () => {
					if (networkTearingDown) return;
					console.warn('[four-characters-plane] SpacetimeDB disconnected');
				},
			});
			net.conn = conn;

			conn.db.entity_transform.onInsert((_ctx, row) => {
				const eid = entityIdOf(row.entityId);
				pendingTransforms.set(eid, row);
				const rec = avatars.get(eid);
				if (!rec || rec.isLocal) return;
				applyRemoteEntityState(rec.actor, row);
			});

			conn.db.entity_transform.onUpdate((_ctx, _old, row) => {
				const eid = entityIdOf(row.entityId);
				if (entityIdsEqual(eid, net.localEntityId)) return;
				const rec = avatars.get(eid);
				if (!rec || rec.isLocal) return;
				applyRemoteEntityState(rec.actor, row);
			});

			conn.db.entity_transform.onDelete((_ctx, row) => {
				const eid = entityIdOf(row.entityId);
				pendingTransforms.delete(eid);
				removeAvatarForEntity(eid, st);
			});

			conn.db.player.onInsert((_ctx, row) => {
				spawnAvatarForPlayer(conn, st, row);
			});

			conn.db.player.onUpdate((_ctx, _old, row) => {
				const rec = avatars.get(entityIdOf(row.entityId));
				if (rec) {
					rec.nameplate.updateText(row.displayName);
				}
			});

			conn.db.player.onDelete((_ctx, row) => {
				const eid = entityIdOf(row.entityId);
				removeAvatarForEntity(eid, st);
				if (entityIdsEqual(eid, net.localEntityId)) {
					net.localEntityId = null;
					localActor = null;
				}
			});

			conn
				.subscriptionBuilder()
				.onApplied((ctx) => {
					for (const t of ctx.db.entity_transform.iter()) {
						pendingTransforms.set(entityIdOf(t.entityId), t);
					}
					for (const p of ctx.db.player.iter()) {
						spawnAvatarForPlayer(conn, st, p);
					}
					for (const t of ctx.db.entity_transform.iter()) {
						const eid = entityIdOf(t.entityId);
						if (entityIdsEqual(eid, net.localEntityId)) continue;
						const rec = avatars.get(eid);
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
	}

	mainStage.onUpdate(() => {
		bootstrapNetwork();

		for (const rec of avatars.values()) {
			const g = rec.actor.group;
			const np = rec.nameplate.group;
			if (g && np) {
				np.position.set(g.position.x, g.position.y + 2.6, g.position.z);
			}
		}
	});

	mainStage.onDestroy(() => {
		resetNetworkState();
	});

	mainStage.add(groundPlane);

	const game = createGame(
		{
			id: 'four-characters-plane',
			debug: true,
			resolution: {
				width: 800,
				height: 600,
			},
			globals: {
				fourCharDeviceId: '',
				fourCharDisplayName: '',
				fourCharColorU32: 0xff4a90e2,
			},
		},
		lobbyStage,
		mainStage,
	);

	let lobbyAdvanced = false;
	game.onUpdate((ctx: UpdateContext<any>) => {
		if (lobbyAdvanced) return;
		if (!fourCharLobbyStore.joinRequested) return;
		const name = fourCharLobbyStore.displayName.trim();
		if (!name) return;
		const dev =
			fourCharLobbyStore.deviceId || getOrCreateFourCharDeviceId();
		setGlobal('fourCharDeviceId', dev);
		setGlobal('fourCharDisplayName', name);
		setGlobal('fourCharColorU32', fourCharLobbyStore.colorU32);
		lobbyAdvanced = true;
		fourCharLobbyStore.joinRequested = false;
		ctx.game?.nextStage();
	});

	return game;
}
