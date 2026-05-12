/// <reference types="@zylem/assets" />

import { Vector3 } from 'three';
import { type UpdateContext } from '@zylem/game-lib/core';
import type { ArenaDbConnection } from '../../networking/arena-stdb-client';
import type { AiHostHandle } from '../ai-host';
import type {
	ArenaMainStageHandle,
	AvatarRecord,
} from '../main-stage';
import type { ReportAttackHit } from '../combat-controller';
import { createIguanoEnemyActor } from '../../characters/iguano-enemy';
import {
	spawnParticleBurst,
	type StageAddTarget,
} from '../../characters/attack-effects';
import {
	avatarWorldPosition,
	idOf,
	IGUANO_FOOT_OFFSET,
	pushHostTransform,
	teleportEnemyActor,
	type BehaviorEnv,
	type EnemyActorEntity,
	type EnemyEntry,
	type NearestAvatar,
} from './shared';
import {
	clearProjectiles,
	spawnLobProjectile,
	updateProjectiles,
	type ProjectileList,
} from './projectiles';
import {
	clearMines,
	spawnProximityMineAt,
	updateProximityMines,
	type MineList,
} from './mines';
import {
	ALL_IGUANO_KINDS,
	IGUANO_BEHAVIORS,
	KIND_MAX_HP,
	parseIguanoKind,
	type IguanoKind,
} from './kinds';

const WAVE_KIND_ORDER: readonly IguanoKind[] = ALL_IGUANO_KINDS;
const ENEMIES_PER_WAVE = WAVE_KIND_ORDER.length;
const WAVE_RESPAWN_DELAY = 3;

/**
 * Per-shooter projectile tuning. Lives here (rather than in `kinds/shooter.ts`)
 * because the orchestrator owns the projectile pool / stage handle and just
 * forwards the spawn call into the behaviour `env`.
 */
const LOB_TUNING = {
	horizSpeed: 11,
	upBias: 7,
	gravity: -28,
	lifetime: 9,
	damage: 7,
	hitRadius: 1.05,
} as const;

/** Per-planter mine tuning. Same rationale as `LOB_TUNING`. */
const MINE_TUNING = {
	armDelay: 0.55,
	lifetime: 28,
	triggerRadius: 1.5,
	damage: 22,
	visualRadius: 0.42,
} as const;

/** Compass ring radius for the wave-spawn anchor layout. */
const WAVE_RING_RADIUS = 14;

/**
 * Anchor candidates around the bowl: 8 evenly-spaced compass points at
 * `WAVE_RING_RADIUS`, starting at +X (East) and going counter-clockwise.
 * `y` is sampled from the heightfield at spawn time — these literals are
 * just the planar XZ ring.
 */
const ENEMY_ANCHORS_XZ: ReadonlyArray<{ x: number; z: number }> =
	Array.from({ length: 8 }, (_, i) => {
		const angle = (i / 8) * Math.PI * 2;
		return {
			x: Math.cos(angle) * WAVE_RING_RADIUS,
			z: Math.sin(angle) * WAVE_RING_RADIUS,
		};
	});

export interface CreateEnemiesOptions {
	handle: ArenaMainStageHandle;
	aiHost: AiHostHandle;
	conn: ArenaDbConnection;
}

export interface EnemiesHandle {
	attachAvatar(entityId: bigint, record: AvatarRecord): void;
	detachAvatar(entityId: bigint): void;
	resolveAttackHit: ReportAttackHit;
	spawnGuestIguanoForNewPlayer(playerEntityId: bigint): void;
	reset(): void;
}

function moduloPositiveBigint(a: bigint, m: bigint): number {
	const r = ((a % m) + m) % m;
	return Number(r);
}

/**
 * Wire the enemies subsystem into the arena main stage. Handles mirror-side
 * `entity_transform` subscription sync and AI-host locomotion plus client-only
 * VFX (lob projectiles, mines, explosion bursts) that call `damage_player` /
 * `damage_enemy`.
 */
export function createEnemies(opts: CreateEnemiesOptions): EnemiesHandle {
	const { handle, aiHost, conn } = opts;
	const stage = handle.stage;
	const burstStage = stage as unknown as StageAddTarget;
	const sampleGroundHeight = handle.sampleGroundHeight;

	const enemies = new Map<bigint, EnemyEntry>();
	const enemiesByEntityId = new Map<bigint, EnemyEntry>();
	const avatars = new Map<bigint, AvatarRecord>();
	const projectiles: ProjectileList = [];
	const proximityMines: MineList = [];
	const guestIguanoSpawnedForPlayerEntity = new Set<bigint>();

	let waveRespawnTimer = 0;
	let didKickoff = false;

	function nearestAvatar(pos: {
		x: number;
		y: number;
		z: number;
	}): NearestAvatar | null {
		let bestId: bigint | null = null;
		let bestDevice = '';
		let bestPos: Vector3 | null = null;
		let bestDistSq = Infinity;
		for (const [entityId, av] of avatars) {
			const p = avatarWorldPosition(av);
			if (!p) continue;
			const dx = p.x - pos.x;
			const dy = p.y - pos.y;
			const dz = p.z - pos.z;
			const d = dx * dx + dy * dy + dz * dz;
			if (d < bestDistSq) {
				bestDistSq = d;
				bestId = entityId;
				bestDevice = av.deviceId;
				bestPos = p;
			}
		}
		if (bestId === null || !bestPos) return null;
		return { entityId: bestId, deviceId: bestDevice, pos: bestPos };
	}

	function centroidOfAvatarsXZ(): Vector3 | null {
		let sx = 0;
		let sz = 0;
		let n = 0;
		let yAvg = 0;
		for (const av of avatars.values()) {
			const p = avatarWorldPosition(av);
			if (!p) continue;
			sx += p.x;
			yAvg += p.y;
			sz += p.z;
			n += 1;
		}
		if (!n) return null;
		return new Vector3(sx / n, yAvg / n, sz / n);
	}

	function killEnemyRows(entry: EnemyEntry, extraDamageCeiling = 5000): void {
		const amount = KIND_MAX_HP[entry.iguanoKind] + extraDamageCeiling;
		void conn.reducers.damageEnemy({
			enemyId: entry.enemyId,
			amount: Math.min(amount, 0xffff_ffff),
		});
	}

	/** Heightfield-aware Y resolver shared by every behaviour `update`. */
	function groundedY(x: number, z: number): number {
		return sampleGroundHeight(x, z) + IGUANO_FOOT_OFFSET;
	}

	const env: BehaviorEnv = {
		conn,
		avatars,
		sampleGroundHeight,
		nearestAvatar,
		centroidOfAvatarsXZ,
		burstStage,
		spawnLobProjectile: (from, toward) =>
			spawnLobProjectile(stage, projectiles, from, toward, LOB_TUNING),
		spawnProximityMineAt: (pos) =>
			spawnProximityMineAt(stage, proximityMines, pos, MINE_TUNING),
		killEnemyRows,
		spawnParticleBurst: (worldPos, spec) =>
			spawnParticleBurst(burstStage, worldPos, spec),
		avatarWorldPosition,
		groundedY,
	};

	function buildEnemyActor(anchor: {
		x: number;
		y: number;
		z: number;
	}): EnemyActorEntity {
		return createIguanoEnemyActor(anchor) as unknown as EnemyActorEntity;
	}

	function spawnEnemyEntry(row: {
		enemyId: bigint | number;
		entityId: bigint | number;
		kind: string;
		alive: boolean;
		anchorX: number;
		anchorY: number;
		anchorZ: number;
	}): EnemyEntry | null {
		const enemyId = idOf(row.enemyId);
		const entityId = idOf(row.entityId);
		if (enemies.has(enemyId)) return enemies.get(enemyId)!;

		const iguanoKind = parseIguanoKind(row.kind);
		// Even with an authoritative anchorY in the row, prefer the local
		// heightfield: peers may have spawned before they had the same bowl
		// (rare, but keeps guests level even when joining mid-frame).
		const groundY = groundedY(row.anchorX, row.anchorZ);
		const anchor = new Vector3(row.anchorX, groundY, row.anchorZ);
		const actor = buildEnemyActor(anchor);
		stage.add(actor as unknown as Parameters<typeof stage.add>[0]);

		const entry: EnemyEntry = {
			enemyId,
			entityId,
			iguanoKind,
			actor,
			alive: row.alive,
			anchor,
			phase: Math.random() * Math.PI * 2,
			time: 0,
			attackCooldown: 0.4 + Math.random() * 0.6,
			pushTimer: 0,
		};
		enemies.set(enemyId, entry);
		enemiesByEntityId.set(entityId, entry);
		return entry;
	}

	function removeEnemyEntry(enemyId: bigint): void {
		const entry = enemies.get(enemyId);
		if (!entry) return;
		enemies.delete(enemyId);
		enemiesByEntityId.delete(entry.entityId);
		if (stage.wrappedStage && entry.actor.uuid) {
			stage.wrappedStage.removeEntityByUuid(entry.actor.uuid);
		}
	}

	/** Spawn one enemy of every archetype around the bowl on the AI host. */
	function spawnWaveIfNeeded(): void {
		if (!aiHost.isAiHost()) return;
		if (enemies.size > 0) return;
		if (waveRespawnTimer > 0) return;

		for (let i = 0; i < ENEMIES_PER_WAVE; i += 1) {
			const iguanoKind = WAVE_KIND_ORDER[i]!;
			const anchor = ENEMY_ANCHORS_XZ[i % ENEMY_ANCHORS_XZ.length]!;
			const anchorY = groundedY(anchor.x, anchor.z);
			void conn.reducers.spawnEnemy({
				kind: iguanoKind,
				maxHp: KIND_MAX_HP[iguanoKind],
				anchorX: anchor.x,
				anchorY,
				anchorZ: anchor.z,
			});
		}
	}

	conn.db.enemy.onInsert((_ctx, row) => {
		const entry = spawnEnemyEntry(row);
		if (!entry) return;
		const tr = conn.db.entity_transform.entity_id.find(entry.entityId);
		if (tr) {
			teleportEnemyActor(
				entry,
				{ x: tr.posX, y: tr.posY, z: tr.posZ },
				{ x: tr.rotX, y: tr.rotY, z: tr.rotZ, w: tr.rotW },
			);
		}
	});

	conn.db.enemy.onUpdate((_ctx, _old, row) => {
		const entry = enemies.get(idOf(row.enemyId));
		if (!entry) return;
		entry.alive = row.alive;
		if (!row.alive && aiHost.isAiHost()) {
			void conn.reducers.despawnEnemy({ enemyId: idOf(row.enemyId) });
		}
	});

	conn.db.enemy.onDelete((_ctx, row) => {
		removeEnemyEntry(idOf(row.enemyId));
	});

	conn.db.entity_transform.onUpdate((_ctx, _old, row) => {
		const entry = enemiesByEntityId.get(idOf(row.entityId));
		if (!entry) return;
		if (aiHost.isAiHost()) return;
		teleportEnemyActor(
			entry,
			{ x: row.posX, y: row.posY, z: row.posZ },
			{ x: row.rotX, y: row.rotY, z: row.rotZ, w: row.rotW },
		);
	});

	stage.onUpdate(({ delta }: UpdateContext<any>) => {
		if (!didKickoff && aiHost.isAiHost()) {
			didKickoff = true;
			spawnWaveIfNeeded();
		}

		if (!aiHost.isAiHost()) return;

		let aliveCount = 0;
		for (const e of enemies.values()) {
			if (e.alive) aliveCount += 1;
		}
		if (aliveCount === 0) {
			waveRespawnTimer -= delta;
			if (waveRespawnTimer <= 0) {
				waveRespawnTimer = WAVE_RESPAWN_DELAY;
				spawnWaveIfNeeded();
			}
		} else {
			waveRespawnTimer = 0;
		}

		for (const entry of enemies.values()) {
			if (!entry.alive || entry.runnerCommitted) continue;
			IGUANO_BEHAVIORS[entry.iguanoKind].update(entry, delta, env);
			pushHostTransform(entry, delta, conn);
		}

		updateProjectiles(stage, projectiles, avatars, conn, delta);
		updateProximityMines(
			stage,
			burstStage,
			proximityMines,
			avatars,
			conn,
			MINE_TUNING,
			delta,
		);
	});

	return {
		attachAvatar(entityId, record) {
			avatars.set(entityId, record);
		},
		detachAvatar(entityId) {
			avatars.delete(entityId);
		},
		spawnGuestIguanoForNewPlayer(playerEntityId) {
			if (!aiHost.isAiHost()) return;
			if (guestIguanoSpawnedForPlayerEntity.has(playerEntityId)) return;
			guestIguanoSpawnedForPlayerEntity.add(playerEntityId);
			const n = BigInt(ALL_IGUANO_KINDS.length);
			const kindIdx = moduloPositiveBigint(playerEntityId, n);
			const iguanoKind = ALL_IGUANO_KINDS[kindIdx]!;
			const span = BigInt(ENEMY_ANCHORS_XZ.length);
			const anchIdx = moduloPositiveBigint(playerEntityId, span);
			const anchor = ENEMY_ANCHORS_XZ[anchIdx]!;
			const anchorY = groundedY(anchor.x, anchor.z);
			void conn.reducers.spawnEnemy({
				kind: iguanoKind,
				maxHp: KIND_MAX_HP[iguanoKind],
				anchorX: anchor.x,
				anchorY,
				anchorZ: anchor.z,
			});
		},
		resolveAttackHit(info) {
			const radiusSq = (1.5 + 0.5) ** 2;
			for (const entry of enemies.values()) {
				if (!entry.alive) continue;
				const pos = entry.actor.body?.translation?.();
				if (!pos) continue;
				const dx = pos.x - info.position.x;
				const dy = pos.y - info.position.y;
				const dz = pos.z - info.position.z;
				if (dx * dx + dy * dy + dz * dz > radiusSq) continue;
				void conn.reducers.damageEnemy({
					enemyId: entry.enemyId,
					amount: info.damage ?? 5,
				});
			}
		},
		reset() {
			for (const entry of enemies.values()) {
				if (stage.wrappedStage && entry.actor.uuid) {
					stage.wrappedStage.removeEntityByUuid(entry.actor.uuid);
				}
			}
			enemies.clear();
			enemiesByEntityId.clear();
			avatars.clear();
			clearProjectiles(stage, projectiles);
			clearMines(stage, proximityMines);
			guestIguanoSpawnedForPlayerEntity.clear();
		},
	};
}
