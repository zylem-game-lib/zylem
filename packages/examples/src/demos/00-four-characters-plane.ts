/// <reference types="@zylem/assets" />

import { Color, Vector2, Vector3 } from 'three';
import {
	Platformer3DBehavior,
	type SetupContext,
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

function u32ToColor(u: number): Color {
	const r = ((u >>> 16) & 255) / 255;
	const g = ((u >>> 8) & 255) / 255;
	const b = (u & 255) / 255;
	return new Color(r, g, b);
}

function animationForPlatformerState(
	state: ReturnType<NonNullable<ReturnType<PlayerEntity['use']>>['getState']> | null | undefined,
): NetworkAnimationState {
	switch (state) {
		case 'running':
			return { key: 'running' };
		case 'walking':
			return { key: 'walking' };
		case 'jumping':
			return { key: 'jumping-up', pauseAtEnd: true };
		case 'falling':
			return { key: 'jumping-up', pauseAtEnd: true };
		case 'landing':
			return { key: 'jumping-down', pauseAtEnd: true };
		default:
			return { key: 'idle' };
	}
}

function applyNetworkTransform(entity: PlayerEntity, t: EntityTransform) {
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

	const mainStage = createStage(
		{
			gravity: new Vector3(0, -9.82, 0),
			backgroundColor: new Color(0x222233),
		},
		mainCamera,
	).setInputConfiguration(
		mergeInputConfigs(useArrowsForAxes('p1'), useWASDForAxes('p1')),
	);

	const platformerOpts = {
		walkSpeed: 10,
		runSpeed: 20,
		jumpForce: 16,
		maxJumps: 4,
		gravity: 9.82,
		groundRayLength: 0.25,
	};

	const avatars = new Map<bigint, AvatarRecord>();
	const pendingTransforms = new Map<bigint, EntityTransform>();
	const net: {
		conn: FourCharDbConnection | null;
		localEntityId: bigint | null;
		localDeviceId: string;
	} = { conn: null, localEntityId: null, localDeviceId: '' };

	let localActor: PlayerEntity | null = null;
	let localPlatformer: ReturnType<PlayerEntity['use']> | null = null;
	let lastMovement = new Vector3();
	// let syncAccum = 0;

	function removeAvatarForEntity(entityId: bigint, stage: StageHandle) {
		const rec = avatars.get(entityId);
		if (!rec || !stage.wrappedStage) return;
		stage.wrappedStage.removeEntityByUuid(rec.actor.uuid);
		stage.wrappedStage.removeEntityByUuid(rec.nameplate.uuid);
		avatars.delete(entityId);
		pendingTransforms.delete(entityId);
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
			localActor = actor;
			// Attach the movement behavior before adding the actor to a live stage.
			// `stage.add()` spawns immediately once the stage is loaded, and behavior
			// systems are registered during spawn.
			localPlatformer = actor.use(Platformer3DBehavior, platformerOpts);
			mainCamera.cameraRef.target = actor;

			actor.onUpdate(({ delta, inputs, me }: UpdateContext<any>) => {
				const { p1 } = inputs;
				const horizontal = p1.axes.Horizontal.value;
				const vertical = p1.axes.Vertical.value;
				// $platformer is created lazily by Platformer3DBehavior; dynamic spawns can miss a few frames.
				const pl = me.$platformer;
				if (pl) {
					pl.moveX = horizontal;
					pl.moveZ = vertical;
					pl.jump = p1.buttons.A.held > 0;
					pl.run = p1.shoulders.LTrigger.held > 0;
				}

				const animation = animationForPlatformerState(localPlatformer?.getState());
				me.playAnimation(animation);
				if (Math.abs(horizontal) > 0.2 || Math.abs(vertical) > 0.2) {
					lastMovement.set(horizontal, 0, vertical);
				}
				if (lastMovement.lengthSq() > 0) {
					me.rotateInDirection(lastMovement);
				}

				// syncAccum += delta;
				// if (syncAccum < 0.08) return;
				// syncAccum = 0;
				const c = net.conn;
				if (!c || net.localEntityId === null) return;
				const tr = me.body?.translation?.();
				const group = me.group;
				if (!tr || !group) return;
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

		stage.add(actor, nameplate);

		if (t && !isLocal) {
			applyRemoteEntityState(actor, t);
		}
	}

	mainStage.onUpdate(() => {
		for (const rec of avatars.values()) {
			const g = rec.actor.group;
			const np = rec.nameplate.group;
			if (g && np) {
				np.position.set(g.position.x, g.position.y + 2.6, g.position.z);
			}
		}
	});

	let networkBootstrapped = false;
	let netErrorBanner: ReturnType<typeof createText> | null = null;

	function reportNetError(context: string, err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		const hint =
			'With the server running, publish once: pnpm --filter @zylem/spacetime-server run publish:local';
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

	groundPlane.onSetup((_ctx: SetupContext<any>) => {
		if (networkBootstrapped) return;
		networkBootstrapped = true;

		const rawDeviceId =
			getGlobal<string>('fourCharDeviceId') ?? getOrCreateFourCharDeviceId();
		const deviceId = rawDeviceId.trim();
		const displayName = getGlobal<string>('fourCharDisplayName') ?? 'Player';
		const colorU32 = getGlobal<number>('fourCharColorU32') ?? 0xff4a90e2;
		net.localDeviceId = deviceId;

		const st = mainStage;

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
			},
			onDisconnect: () => {
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
				localPlatformer = null;
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
