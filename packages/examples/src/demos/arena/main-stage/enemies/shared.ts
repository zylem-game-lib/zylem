import { Vector3 } from 'three';
import type { ArenaDbConnection } from '../../networking/arena-stdb-client';
import type { AvatarRecord } from '../main-stage';
import type {
	ParticleBurstSpec,
	StageAddTarget,
} from '../../characters/attack-effects';
import type { IguanoKind } from './kinds';

/**
 * Per-enemy state held by the orchestrator. Each iguano kind reads / mutates
 * the same record; kind-specific fields (`runnerCommitted`) are optional.
 */
export interface EnemyEntry {
	enemyId: bigint;
	entityId: bigint;
	iguanoKind: IguanoKind;
	actor: EnemyActorEntity;
	alive: boolean;
	/** Spawn anchor in world coordinates. `y` is refreshed each tick to track the bowl. */
	anchor: Vector3;
	phase: number;
	time: number;
	attackCooldown: number;
	pushTimer: number;
	/**
	 * Wall-clock-ish time (in `entry.time` units) until which a one-shot
	 * action clip (punch / bite / fireball / planting / runDestruct / pounce)
	 * is allowed to play uninterrupted. {@link syncIguanoLocomotion} is a
	 * no-op while this is in the future, so locomotion can't stomp the
	 * action clip every tick.
	 */
	actionAnimEndsAt?: number;
	runnerCommitted?: boolean;
}

/**
 * Result of a nearest-avatar query: stable id (for STDB), the owning device id
 * (for `damage_player`), and the world-space position used to drive locomotion.
 */
export interface NearestAvatar {
	entityId: bigint;
	deviceId: string;
	pos: Vector3;
}

/**
 * Minimal physics + group surface needed by the AI host. `body` is optional
 * so the helpers cope with both Rapier-backed actors and runtime-only ones.
 */
export interface EnemyActorEntity {
	uuid: string;
	playAnimation?(opts: { key: string; pauseAtEnd?: boolean }): void;
	group:
		| {
				position: { x: number; y: number; z: number };
				quaternion: {
					x: number;
					y: number;
					z: number;
					w: number;
					set(x: number, y: number, z: number, w: number): void;
				};
		  }
		| null
		| undefined;
	body?:
		| {
				translation(): { x: number; y: number; z: number };
				setTranslation(
					v: { x: number; y: number; z: number },
					wake: boolean,
				): void;
				setLinvel(
					v: { x: number; y: number; z: number },
					wake: boolean,
				): void;
				setAngvel(
					v: { x: number; y: number; z: number },
					wake: boolean,
				): void;
		  }
		| undefined;
	setPosition?: (x: number, y: number, z: number) => void;
}

/**
 * Re-export of the iguano's visual feet offset so behaviour modules (and the
 * orchestrator) can stay free of `characters/iguano-enemy.ts` imports while
 * still using the model-derived constant.
 *
 * Kept under the original name so existing callers don't churn.
 */
export { IGUANO_VISUAL_FEET_OFFSET as IGUANO_FOOT_OFFSET } from '../../characters/iguano-enemy';

/** Frequency at which the AI host broadcasts an enemy's pose to peers. */
export const HOST_TRANSFORM_PUSH_INTERVAL = 1 / 20;

/** Spherical hit radius (squared inputs use `**2` inline) used by host attacks. */
export const ENEMY_HIT_RADIUS = 1.35;

/**
 * Cross-cutting environment passed to each `IguanoBehavior.update`. Lets the
 * per-kind logic stay framework-agnostic — no direct DB / stage imports.
 */
export interface BehaviorEnv {
	conn: ArenaDbConnection;
	avatars: ReadonlyMap<bigint, AvatarRecord>;
	sampleGroundHeight: (x: number, z: number) => number;
	nearestAvatar: (pos: { x: number; y: number; z: number }) => NearestAvatar | null;
	centroidOfAvatarsXZ: () => Vector3 | null;
	burstStage: StageAddTarget;
	spawnLobProjectile: (from: Vector3, toward: Vector3) => void;
	spawnProximityMineAt: (pos: Vector3) => void;
	killEnemyRows: (entry: EnemyEntry, extraDamageCeiling?: number) => void;
	spawnParticleBurst: (worldPos: Vector3, spec: ParticleBurstSpec) => void;
	avatarWorldPosition: (av: AvatarRecord) => Vector3 | null;
	groundedY: (x: number, z: number) => number;
}

/**
 * Shape implemented by each iguano archetype (`runner`, `planter`, `fighter`,
 * `shooter`). The orchestrator dispatches via `IGUANO_BEHAVIORS[kind].update`.
 */
export interface IguanoBehavior {
	readonly kind: IguanoKind;
	readonly maxHp: number;
	update(entry: EnemyEntry, delta: number, env: BehaviorEnv): void;
}

/** Normalise STDB row ids (`bigint | number`) to a stable `bigint`. */
export function idOf(id: bigint | number): bigint {
	return BigInt(id);
}

/** Planar (XZ) distance squared between two points. */
export function xzDistSq(
	a: { x: number; y: number; z: number },
	b: { x: number; y: number; z: number },
): number {
	const dx = a.x - b.x;
	const dz = a.z - b.z;
	return dx * dx + dz * dz;
}

/**
 * World position for targeting / clustering. Prefers Rapier body translation
 * but falls back to `group.position` so the wasm-runtime local player (which
 * has no TS body) still registers as a chase target.
 */
export function avatarWorldPosition(av: AvatarRecord): Vector3 | null {
	const tr = av.actor.body?.translation?.();
	if (tr) return new Vector3(tr.x, tr.y, tr.z);
	const g = av.actor.group;
	if (g) return new Vector3(g.position.x, g.position.y, g.position.z);
	return null;
}

/**
 * Snap an enemy's body + render group to the supplied pose. The body's
 * `setTranslation` is called even on Fixed bodies — Rapier honours it, and
 * `syncRenderPoses` then mirrors the body translation onto the group.
 */
export function teleportEnemyActor(
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

/** Yaw the iguano so its forward (+Z) axis points along `dir` (XZ projected). */
export function faceDirection(entry: EnemyEntry, dir: Vector3): void {
	if (!entry.actor.group || dir.lengthSq() < 0.0001) return;
	const angle = Math.atan2(dir.x, dir.z);
	const half = angle * 0.5;
	const sin = Math.sin(half);
	const cos = Math.cos(half);
	entry.actor.group.quaternion.set(0, sin, 0, cos);
}

/**
 * Toggle between idle / walking clips. We intentionally do NOT cache the
 * last-requested key locally: the FBX clips load asynchronously, so the
 * very first tick may set a key the mixer doesn't accept yet, and a local
 * cache would then suppress every retry. The animation delegate already
 * dedupes via `key === _currentKey`, so calling per tick is essentially
 * free.
 *
 * Skipped entirely while a one-shot action animation is still playing
 * (see {@link playEnemyOneShot}) so e.g. a punch isn't crossfaded back to
 * walking on the very next tick.
 */
export function syncIguanoLocomotion(
	entry: EnemyEntry,
	moving: boolean,
): void {
	if ((entry.actionAnimEndsAt ?? 0) > entry.time) return;
	const key = moving ? 'walking' : 'idle';
	entry.actor.playAnimation?.({ key });
}

/**
 * Approximate clip durations (seconds) for the iguano one-shot animations.
 * The FBX assets aren't introspected at load time, so these are hand-tuned
 * to feel close to the actual clips while leaving a small tail.
 */
const ONE_SHOT_DURATION: Record<string, number> = {
	punch: 0.85,
	bite: 0.75,
	fireball: 1.0,
	planting: 1.0,
	runDestruct: 0.9,
};

/**
 * Trigger an attack / action animation that should play through to the end
 * before locomotion takes over again. Sets {@link EnemyEntry.actionAnimEndsAt}
 * so {@link syncIguanoLocomotion} stays idle for the clip's expected
 * duration.
 *
 * Falls back to `0.6s` if the key isn't in {@link ONE_SHOT_DURATION}; pass
 * `durationSec` explicitly to override.
 */
export function playEnemyOneShot(
	entry: EnemyEntry,
	key: string,
	durationSec?: number,
): void {
	const duration = durationSec ?? ONE_SHOT_DURATION[key] ?? 0.6;
	entry.actionAnimEndsAt = entry.time + duration;
	entry.actor.playAnimation?.({ key, pauseAtEnd: true });
}

/**
 * Move `current` toward `dest` by `step` units along XZ, clamping `next.y` to
 * the grounded value reported by `groundedY` so the iguano walks the bowl.
 */
export function moveTowardXZ(
	current: Vector3,
	dest: Vector3,
	step: number,
	groundedY: (x: number, z: number) => number,
): Vector3 {
	const dir = new Vector3(dest.x - current.x, 0, dest.z - current.z);
	const dist = dir.length();
	let nextXZ: Vector3;
	if (dist <= step || dist < 1e-6) {
		nextXZ = new Vector3(dest.x, current.y, dest.z);
	} else {
		dir.multiplyScalar(step / dist);
		nextXZ = new Vector3(current.x + dir.x, current.y, current.z + dir.z);
	}
	return new Vector3(nextXZ.x, groundedY(nextXZ.x, nextXZ.z), nextXZ.z);
}

/**
 * Throttled per-tick broadcast of an enemy's pose. The AI host owns enemy
 * simulation; guests only receive `set_enemy_transform` updates.
 */
export function pushHostTransform(
	entry: EnemyEntry,
	delta: number,
	conn: ArenaDbConnection,
): void {
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
