/// <reference types="@zylem/assets" />

import { Color, Vector3 } from 'three';
import {
	createActor,
	createSphere,
	type UpdateContext,
} from '@zylem/game-lib';
import snakeShipGlb from '../../../assets/snake-ship.glb';
import vultureShipGlb from '../../../assets/vulture-ship.glb';
import cougarShipGlb from '../../../assets/cougar-ship.glb';
import type { ArenaDbConnection } from '../networking/arena-stdb-client';
import type { AiHostHandle } from './ai-host';
import type {
	ArenaMainStageHandle,
	AvatarRecord,
} from './main-stage';
import type { ReportAttackHit } from './combat-controller';

/** Three arena-native enemy archetypes. */
export type EnemyKind = 'sine' | 'circle' | 'charge';

const ENEMY_KINDS: readonly EnemyKind[] = ['sine', 'circle', 'charge'] as const;

/** How many enemies to spawn per wave (plan: 9, 3 kinds × 3 anchors). */
const ENEMIES_PER_WAVE = 9;

/** Delay (seconds) between the final enemy dying and the next wave. */
const WAVE_RESPAWN_DELAY = 3;

/** Throttle (seconds) for how often the AI host pushes a network transform. */
const HOST_TRANSFORM_PUSH_INTERVAL = 1 / 20;

/** Radius of the per-enemy hit sphere (player-vs-attack resolution). */
const ENEMY_HIT_RADIUS = 1.4;

/** Projectile radius + lifetime + speed (plan: AI-host-local visual/damage). */
const PROJECTILE_RADIUS = 0.35;
const PROJECTILE_LIFETIME = 4;
const PROJECTILE_SPEED = 12;
const PROJECTILE_DAMAGE = 6;
const PROJECTILE_HIT_RADIUS = 0.9;

/** Per-kind tuning constants. */
const SINE_FIRE_COOLDOWN = 1.6;
const SINE_SPEED = 5;
const SINE_ANCHOR_Y = 3;

const CIRCLE_RADIUS = 8;
const CIRCLE_ANGULAR_SPEED = 0.9;
const CIRCLE_ANCHOR_Y = 2;

const CHARGE_PATROL_SPEED = 2.8;
const CHARGE_PATROL_RANGE = 4;
const CHARGE_LUNGE_SPEED = 14;
const CHARGE_RECOVER_SPEED = 4;
const CHARGE_WAIT_BEFORE_LUNGE = 1.2;
const CHARGE_LUNGE_DURATION = 0.9;
const CHARGE_RECOVER_DURATION = 2;
const CHARGE_FIRE_COOLDOWN = 2.4;
const CHARGE_CONTACT_DAMAGE = 12;

/** Height of the default enemy spawn anchors above the ground plane. */
const ENEMY_SPAWN_HEIGHT = 4;

/** Authored grid of anchor positions the AI host picks from when spawning waves. */
const ENEMY_ANCHORS: ReadonlyArray<{ x: number; y: number; z: number }> = [
	{ x: -12, y: ENEMY_SPAWN_HEIGHT, z: -12 },
	{ x: 0, y: ENEMY_SPAWN_HEIGHT, z: -15 },
	{ x: 12, y: ENEMY_SPAWN_HEIGHT, z: -12 },
	{ x: -15, y: ENEMY_SPAWN_HEIGHT + 2, z: 0 },
	{ x: 15, y: ENEMY_SPAWN_HEIGHT + 2, z: 0 },
	{ x: -12, y: ENEMY_SPAWN_HEIGHT, z: 12 },
	{ x: 0, y: ENEMY_SPAWN_HEIGHT, z: 15 },
	{ x: 12, y: ENEMY_SPAWN_HEIGHT, z: 12 },
	{ x: 0, y: ENEMY_SPAWN_HEIGHT + 3, z: 0 },
];

const KIND_MAX_HP: Record<EnemyKind, number> = {
	sine: 24,
	circle: 32,
	charge: 40,
};

const KIND_MODEL: Record<EnemyKind, string> = {
	sine: snakeShipGlb,
	circle: vultureShipGlb,
	charge: cougarShipGlb,
};

const KIND_COLOR: Record<EnemyKind, number> = {
	sine: 0xff6b6b,
	circle: 0x7ad3ff,
	charge: 0xffd166,
};

interface EnemyActorEntity {
	uuid: string;
	group: {
		position: { x: number; y: number; z: number };
		quaternion: { x: number; y: number; z: number; w: number; set(x: number, y: number, z: number, w: number): void };
	} | null | undefined;
	body?: {
		translation(): { x: number; y: number; z: number };
		setTranslation(v: { x: number; y: number; z: number }, wake: boolean): void;
		setLinvel(v: { x: number; y: number; z: number }, wake: boolean): void;
		setAngvel(v: { x: number; y: number; z: number }, wake: boolean): void;
	};
	setPosition?: (x: number, y: number, z: number) => void;
}

type ChargePhase = 'patrol' | 'wind-up' | 'lunge' | 'recover';

interface EnemyEntry {
	enemyId: bigint;
	entityId: bigint;
	kind: EnemyKind;
	actor: EnemyActorEntity;
	alive: boolean;
	anchor: Vector3;
	/** Phase-offset / rng seed for deterministic-ish motion. */
	phase: number;
	/** Local AI time accumulator. */
	time: number;
	/** Cooldown until the enemy can fire again (sine/charge only). */
	fireCooldown: number;
	/** Cooldown on contact damage so charging enemies don't multi-hit. */
	contactCooldown: number;
	/** Live charge-kind state machine. */
	charge?: {
		phase: ChargePhase;
		phaseTime: number;
		targetEntityId: bigint | null;
		targetPos: Vector3;
	};
	/** Throttle the network push of the host transform. */
	pushTimer: number;
}

interface Projectile {
	entity: {
		uuid: string;
		group: { position: { x: number; y: number; z: number } } | null | undefined;
		body?: {
			setTranslation(v: { x: number; y: number; z: number }, wake: boolean): void;
			translation(): { x: number; y: number; z: number };
		};
	};
	velocity: Vector3;
	life: number;
}

export interface CreateEnemiesOptions {
	handle: ArenaMainStageHandle;
	aiHost: AiHostHandle;
	conn: ArenaDbConnection;
	deviceId: string;
}

export interface EnemiesHandle {
	/** Inform the enemies module of a new player avatar (local or remote). */
	attachAvatar(entityId: bigint, record: AvatarRecord): void;
	/** Inform the enemies module that a player avatar was removed. */
	detachAvatar(entityId: bigint): void;
	/**
	 * Attack-hit resolver: compare the reported sphere against known
	 * enemies and call `damage_enemy` on any overlap. Suitable as the
	 * `onAttackHit` handler passed to `handle.setAttackHitHandler`.
	 */
	resolveAttackHit: ReportAttackHit;
	/** Release internal state on teardown. */
	reset(): void;
}

/**
 * Wire the enemies subsystem into the arena main stage. Handles both
 * the mirror-side (every client sees enemy transforms via the
 * entity_transform subscription) and the AI-host side (only the
 * elected host simulates enemy motion and damage).
 */
export function createEnemies(opts: CreateEnemiesOptions): EnemiesHandle {
	const { handle, aiHost, conn, deviceId } = opts;
	const stage = handle.stage;

	const enemies = new Map<bigint, EnemyEntry>();
	/** Reverse lookup so entity_transform.onUpdate can find the enemy by entity_id. */
	const enemiesByEntityId = new Map<bigint, EnemyEntry>();
	const avatars = new Map<bigint, AvatarRecord>();
	const projectiles: Projectile[] = [];

	let waveRespawnTimer = 0;
	let didKickoff = false;

	function idOf(id: bigint | number): bigint {
		return BigInt(id);
	}

	function pickTargetPosition(): Vector3 | null {
		let best: Vector3 | null = null;
		let bestDistSq = Infinity;
		for (const av of avatars.values()) {
			const tr = av.actor.body?.translation?.();
			if (!tr) continue;
			// Prefer nearest-to-origin tie-breaker by always picking the
			// closest avatar to world origin; the arena is small enough
			// that this is a good-enough heuristic for "pick someone".
			const d = tr.x * tr.x + tr.z * tr.z;
			if (d < bestDistSq) {
				bestDistSq = d;
				best = new Vector3(tr.x, tr.y, tr.z);
			}
		}
		return best;
	}

	function nearestAvatar(pos: Vector3): {
		entityId: bigint;
		deviceId: string;
		pos: Vector3;
	} | null {
		let bestId: bigint | null = null;
		let bestDevice = '';
		let bestPos: Vector3 | null = null;
		let bestDistSq = Infinity;
		for (const [entityId, av] of avatars) {
			const tr = av.actor.body?.translation?.();
			if (!tr) continue;
			const dx = tr.x - pos.x;
			const dy = tr.y - pos.y;
			const dz = tr.z - pos.z;
			const d = dx * dx + dy * dy + dz * dz;
			if (d < bestDistSq) {
				bestDistSq = d;
				bestId = entityId;
				bestDevice = av.deviceId;
				bestPos = new Vector3(tr.x, tr.y, tr.z);
			}
		}
		if (bestId === null || !bestPos) return null;
		return { entityId: bestId, deviceId: bestDevice, pos: bestPos };
	}

	function buildEnemyActor(
		kind: EnemyKind,
		anchor: { x: number; y: number; z: number },
	): EnemyActorEntity {
		const actor = createActor({
			name: `arena-enemy-${kind}`,
			models: [KIND_MODEL[kind]],
			scale: { x: 1.1, y: 1.1, z: 1.1 },
			collisionShape: 'bounds',
			collision: {
				size: { x: 1.2, y: 1, z: 1.4 },
				static: false,
			},
			position: anchor,
		});
		return actor as unknown as EnemyActorEntity;
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

		const kind = ENEMY_KINDS.includes(row.kind as EnemyKind)
			? (row.kind as EnemyKind)
			: 'sine';
		const anchor = new Vector3(row.anchorX, row.anchorY, row.anchorZ);
		const actor = buildEnemyActor(kind, anchor);
		stage.add(actor as unknown as Parameters<typeof stage.add>[0]);

		const entry: EnemyEntry = {
			enemyId,
			entityId,
			kind,
			actor,
			alive: row.alive,
			anchor,
			phase: Math.random() * Math.PI * 2,
			time: 0,
			fireCooldown: 0.5 + Math.random() * 0.8,
			contactCooldown: 0,
			pushTimer: 0,
			charge:
				kind === 'charge'
					? {
						phase: 'patrol',
						phaseTime: 0,
						targetEntityId: null,
						targetPos: new Vector3(),
					}
					: undefined,
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

	function teleportEnemyActor(
		entry: EnemyEntry,
		pos: { x: number; y: number; z: number },
		quat?: { x: number; y: number; z: number; w: number },
	): void {
		entry.actor.body?.setTranslation(pos, true);
		if (entry.actor.setPosition) {
			entry.actor.setPosition(pos.x, pos.y, pos.z);
		}
		if (entry.actor.group) {
			entry.actor.group.position.x = pos.x;
			entry.actor.group.position.y = pos.y;
			entry.actor.group.position.z = pos.z;
			if (quat && entry.actor.group.quaternion?.set) {
				entry.actor.group.quaternion.set(quat.x, quat.y, quat.z, quat.w);
			}
		}
	}

	// Projectiles are AI-host-local client entities — they live on the
	// host client only; remote clients will see damage but not the
	// visual bullet. A follow-up pass could network the bullet spawns
	// via a lightweight STDB table; for now we keep the surface minimal.
	function spawnProjectile(from: Vector3, toward: Vector3): void {
		const dir = new Vector3().subVectors(toward, from);
		if (dir.lengthSq() < 0.0001) {
			dir.set(0, 0, 1);
		}
		dir.normalize().multiplyScalar(PROJECTILE_SPEED);

		const bullet = createSphere({
			name: 'arena-enemy-bullet',
			radius: PROJECTILE_RADIUS,
			position: { x: from.x, y: from.y, z: from.z },
			material: { color: new Color(0xff8855), opacity: 1 },
			collision: { static: false },
		});
		stage.add(bullet as unknown as Parameters<typeof stage.add>[0]);
		projectiles.push({
			entity: bullet as unknown as Projectile['entity'],
			velocity: dir,
			life: PROJECTILE_LIFETIME,
		});
	}

	function updateProjectiles(delta: number): void {
		for (let i = projectiles.length - 1; i >= 0; i -= 1) {
			const p = projectiles[i]!;
			p.life -= delta;
			const current = p.entity.body?.translation?.() ?? {
				x: p.entity.group?.position.x ?? 0,
				y: p.entity.group?.position.y ?? 0,
				z: p.entity.group?.position.z ?? 0,
			};
			const next = {
				x: current.x + p.velocity.x * delta,
				y: current.y + p.velocity.y * delta,
				z: current.z + p.velocity.z * delta,
			};
			p.entity.body?.setTranslation(next, true);
			if (p.entity.group) {
				p.entity.group.position.x = next.x;
				p.entity.group.position.y = next.y;
				p.entity.group.position.z = next.z;
			}

			// Player overlap check
			let hit = false;
			for (const av of avatars.values()) {
				const pt = av.actor.body?.translation?.();
				if (!pt) continue;
				const dx = pt.x - next.x;
				const dy = pt.y - next.y;
				const dz = pt.z - next.z;
				if (dx * dx + dy * dy + dz * dz <= PROJECTILE_HIT_RADIUS * PROJECTILE_HIT_RADIUS) {
					void conn.reducers.damagePlayer({
						deviceId: av.deviceId,
						amount: PROJECTILE_DAMAGE,
					});
					hit = true;
					break;
				}
			}

			if (hit || p.life <= 0) {
				if (stage.wrappedStage && p.entity.uuid) {
					stage.wrappedStage.removeEntityByUuid(p.entity.uuid);
				}
				projectiles.splice(i, 1);
			}
		}
	}

	function pushHostTransform(entry: EnemyEntry, delta: number): void {
		entry.pushTimer += delta;
		if (entry.pushTimer < HOST_TRANSFORM_PUSH_INTERVAL) return;
		entry.pushTimer = 0;
		const tr = entry.actor.body?.translation?.() ?? {
			x: entry.actor.group?.position.x ?? 0,
			y: entry.actor.group?.position.y ?? 0,
			z: entry.actor.group?.position.z ?? 0,
		};
		const q = entry.actor.group?.quaternion ?? { x: 0, y: 0, z: 0, w: 1 };
		void conn.reducers.setEnemyTransform({
			entityId: entry.entityId,
			posX: tr.x,
			posY: tr.y,
			posZ: tr.z,
			rotX: q.x,
			rotY: q.y,
			rotZ: q.z,
			rotW: q.w,
		});
	}

	function faceDirection(entry: EnemyEntry, dir: Vector3): void {
		if (!entry.actor.group || dir.lengthSq() < 0.0001) return;
		const angle = Math.atan2(dir.x, dir.z);
		const half = angle * 0.5;
		const sin = Math.sin(half);
		const cos = Math.cos(half);
		entry.actor.group.quaternion.set(0, sin, 0, cos);
	}

	function updateSineEnemy(entry: EnemyEntry, delta: number): void {
		entry.time += delta;
		const target = pickTargetPosition();
		const base = target ?? new Vector3(0, SINE_ANCHOR_Y, 0);
		const lateralOffset = Math.sin(entry.time * 1.3 + entry.phase) * 3;
		const desired = new Vector3(
			base.x + Math.cos(entry.phase) * lateralOffset,
			entry.anchor.y + Math.sin(entry.time * 1.1 + entry.phase) * 0.4,
			base.z + Math.sin(entry.phase) * lateralOffset,
		);
		const current = entry.actor.body?.translation?.() ?? entry.anchor;
		const step = SINE_SPEED * delta;
		const dir = new Vector3(
			desired.x - current.x,
			desired.y - current.y,
			desired.z - current.z,
		);
		const dist = dir.length();
		let next: Vector3;
		if (dist <= step || dist < 1e-5) {
			next = desired.clone();
		} else {
			dir.divideScalar(dist);
			next = new Vector3(
				current.x + dir.x * step,
				current.y + dir.y * step,
				current.z + dir.z * step,
			);
		}

		teleportEnemyActor(entry, next);
		if (target) {
			faceDirection(entry, new Vector3(target.x - next.x, 0, target.z - next.z));
		}

		entry.fireCooldown -= delta;
		if (entry.fireCooldown <= 0 && target) {
			spawnProjectile(next, target);
			entry.fireCooldown = SINE_FIRE_COOLDOWN * (0.85 + Math.random() * 0.3);
		}
	}

	function updateCircleEnemy(entry: EnemyEntry, delta: number): void {
		entry.time += delta;
		const target = pickTargetPosition();
		const base = target ?? new Vector3(0, CIRCLE_ANCHOR_Y, 0);
		const angle = entry.time * CIRCLE_ANGULAR_SPEED + entry.phase;
		const desired = new Vector3(
			base.x + Math.cos(angle) * CIRCLE_RADIUS,
			entry.anchor.y,
			base.z + Math.sin(angle) * CIRCLE_RADIUS,
		);
		teleportEnemyActor(entry, desired);
		faceDirection(entry, new Vector3(base.x - desired.x, 0, base.z - desired.z));
	}

	function updateChargeEnemy(entry: EnemyEntry, delta: number): void {
		if (!entry.charge) return;
		entry.time += delta;
		const state = entry.charge;
		state.phaseTime += delta;
		const current = entry.actor.body?.translation?.() ?? entry.anchor;
		const currentV = new Vector3(current.x, current.y, current.z);

		switch (state.phase) {
			case 'patrol': {
				const localX =
					Math.sin(entry.time * 1.1 + entry.phase) * CHARGE_PATROL_RANGE;
				const desired = new Vector3(
					entry.anchor.x + localX,
					entry.anchor.y,
					entry.anchor.z,
				);
				const dir = new Vector3().subVectors(desired, currentV);
				const dist = dir.length();
				const step = CHARGE_PATROL_SPEED * delta;
				let next: Vector3;
				if (dist <= step || dist < 1e-5) {
					next = desired;
				} else {
					dir.multiplyScalar(step / dist);
					next = new Vector3(
						currentV.x + dir.x,
						currentV.y + dir.y,
						currentV.z + dir.z,
					);
				}
				teleportEnemyActor(entry, next);

				entry.fireCooldown -= delta;
				const target = pickTargetPosition();
				if (target) {
					faceDirection(
						entry,
						new Vector3(target.x - next.x, 0, target.z - next.z),
					);
					if (entry.fireCooldown <= 0) {
						spawnProjectile(next, target);
						entry.fireCooldown =
							CHARGE_FIRE_COOLDOWN * (0.85 + Math.random() * 0.3);
					}
				}

				if (state.phaseTime >= 3) {
					const t = nearestAvatar(currentV);
					if (t) {
						state.phase = 'wind-up';
						state.phaseTime = 0;
						state.targetEntityId = t.entityId;
						state.targetPos.copy(t.pos);
					}
				}
				break;
			}
			case 'wind-up': {
				if (state.phaseTime >= CHARGE_WAIT_BEFORE_LUNGE) {
					const t = nearestAvatar(currentV);
					if (t) {
						state.targetPos.copy(t.pos);
					}
					state.phase = 'lunge';
					state.phaseTime = 0;
				}
				break;
			}
			case 'lunge': {
				const dir = new Vector3().subVectors(state.targetPos, currentV);
				const dist = dir.length();
				const step = CHARGE_LUNGE_SPEED * delta;
				let next: Vector3;
				if (dist <= step || dist < 1e-5) {
					next = state.targetPos.clone();
				} else {
					dir.multiplyScalar(step / dist);
					next = new Vector3(
						currentV.x + dir.x,
						currentV.y + dir.y,
						currentV.z + dir.z,
					);
				}
				teleportEnemyActor(entry, next);
				faceDirection(entry, dir);

				// Contact damage on overlap.
				entry.contactCooldown -= delta;
				if (entry.contactCooldown <= 0) {
					for (const av of avatars.values()) {
						const pt = av.actor.body?.translation?.();
						if (!pt) continue;
						const dx = pt.x - next.x;
						const dy = pt.y - next.y;
						const dz = pt.z - next.z;
						if (
							dx * dx + dy * dy + dz * dz <=
							ENEMY_HIT_RADIUS * ENEMY_HIT_RADIUS
						) {
							void conn.reducers.damagePlayer({
								deviceId: av.deviceId,
								amount: CHARGE_CONTACT_DAMAGE,
							});
							entry.contactCooldown = 0.8;
							break;
						}
					}
				}

				if (state.phaseTime >= CHARGE_LUNGE_DURATION) {
					state.phase = 'recover';
					state.phaseTime = 0;
				}
				break;
			}
			case 'recover': {
				const dir = new Vector3().subVectors(entry.anchor, currentV);
				const dist = dir.length();
				const step = CHARGE_RECOVER_SPEED * delta;
				let next: Vector3;
				if (dist <= step || dist < 1e-5) {
					next = entry.anchor.clone();
				} else {
					dir.multiplyScalar(step / dist);
					next = new Vector3(
						currentV.x + dir.x,
						currentV.y + dir.y,
						currentV.z + dir.z,
					);
				}
				teleportEnemyActor(entry, next);
				if (state.phaseTime >= CHARGE_RECOVER_DURATION) {
					state.phase = 'patrol';
					state.phaseTime = 0;
				}
				break;
			}
		}
	}

	function spawnWaveIfNeeded(): void {
		if (!aiHost.isAiHost()) return;
		if (enemies.size > 0) return;
		if (waveRespawnTimer > 0) return;

		for (let i = 0; i < ENEMIES_PER_WAVE; i += 1) {
			const kind = ENEMY_KINDS[i % ENEMY_KINDS.length]!;
			const anchor = ENEMY_ANCHORS[i % ENEMY_ANCHORS.length]!;
			void conn.reducers.spawnEnemy({
				kind,
				maxHp: KIND_MAX_HP[kind],
				anchorX: anchor.x,
				anchorY: anchor.y,
				anchorZ: anchor.z,
			});
		}
	}

	// ─── Wire STDB table subscriptions for mirror + host logic ─────────────

	conn.db.enemy.onInsert((_ctx, row) => {
		const entry = spawnEnemyEntry(row);
		if (!entry) return;
		// Snap to the existing transform if it's already there.
		const tr = conn.db.entity_transform.entity_id.find(entry.entityId);
		if (tr) {
			teleportEnemyActor(entry, {
				x: tr.posX,
				y: tr.posY,
				z: tr.posZ,
			}, { x: tr.rotX, y: tr.rotY, z: tr.rotZ, w: tr.rotW });
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
		// On the AI host we're the source of truth; don't clobber our
		// own local simulation by re-applying the transform we just
		// published.
		if (aiHost.isAiHost()) return;
		teleportEnemyActor(
			entry,
			{ x: row.posX, y: row.posY, z: row.posZ },
			{ x: row.rotX, y: row.rotY, z: row.rotZ, w: row.rotW },
		);
	});

	// ─── Per-frame AI host tick ────────────────────────────────────────────

	stage.onUpdate(({ delta }: UpdateContext<any>) => {
		if (!didKickoff && aiHost.isAiHost()) {
			didKickoff = true;
			spawnWaveIfNeeded();
		}

		if (!aiHost.isAiHost()) return;

		// If all enemies are dead, start the wave respawn countdown.
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
			if (!entry.alive) continue;
			switch (entry.kind) {
				case 'sine':
					updateSineEnemy(entry, delta);
					break;
				case 'circle':
					updateCircleEnemy(entry, delta);
					break;
				case 'charge':
					updateChargeEnemy(entry, delta);
					break;
			}
			pushHostTransform(entry, delta);
		}

		updateProjectiles(delta);
	});

	// ─── Public API ────────────────────────────────────────────────────────

	return {
		attachAvatar(entityId, record) {
			avatars.set(entityId, record);
		},
		detachAvatar(entityId) {
			avatars.delete(entityId);
		},
		resolveAttackHit(info) {
			const radiusSq = (1.5 + 0.5) ** 2; // reach + enemy radius
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
			for (const p of projectiles) {
				if (stage.wrappedStage && p.entity.uuid) {
					stage.wrappedStage.removeEntityByUuid(p.entity.uuid);
				}
			}
			projectiles.length = 0;
		},
	};
}

