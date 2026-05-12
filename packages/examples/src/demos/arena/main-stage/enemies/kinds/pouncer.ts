import { Vector3 } from 'three';
import {
	avatarWorldPosition,
	ENEMY_HIT_RADIUS,
	faceDirection,
	playEnemyOneShot,
	syncIguanoLocomotion,
	teleportEnemyActor,
	xzDistSq,
	type EnemyEntry,
	type IguanoBehavior,
} from '../shared';

/**
 * Pouncer: ambush archetype. Stays idle, faces the nearest avatar, and only
 * commits when one steps inside `POUNCE_TRIGGER_RADIUS`. The pounce locks
 * direction at the launch instant and sprints in a straight line for
 * `POUNCE_DURATION` seconds while playing the punch clip; on contact it
 * deals `POUNCE_DAMAGE` and goes back to idle on a cooldown.
 */
const POUNCE_TRIGGER_RADIUS = 5.0;
const POUNCE_TRIGGER_RADIUS_SQ = POUNCE_TRIGGER_RADIUS * POUNCE_TRIGGER_RADIUS;
const POUNCE_SPEED = 16;
const POUNCE_DURATION = 0.5;
const POUNCE_RECOVERY = 1.4;
const POUNCE_DAMAGE = 18;

interface PouncerEntry extends EnemyEntry {
	/** Active pounce direction (unit XZ). Absent while idle. */
	pounceDir?: Vector3;
	/** `entry.time` at which the active pounce should end. */
	pounceEndsAt?: number;
	/** `entry.time` at which the next pounce becomes legal. */
	pounceCooldownUntil?: number;
	/** Set true once the active pounce has dealt its hit. */
	pounceHitApplied?: boolean;
}

export const POUNCER_BEHAVIOR: IguanoBehavior = {
	kind: 'pouncer',
	maxHp: 32,
	update(entry, delta, env) {
		entry.time += delta;
		const p = entry as PouncerEntry;
		const cur = entry.actor.body?.translation?.() ?? entry.anchor;
		const curV = new Vector3(cur.x, cur.y, cur.z);

		// Active pounce: integrate the locked direction forward each tick.
		if (p.pounceDir && p.pounceEndsAt !== undefined) {
			if (entry.time >= p.pounceEndsAt) {
				p.pounceDir = undefined;
				p.pounceEndsAt = undefined;
				p.pounceHitApplied = undefined;
				p.pounceCooldownUntil = entry.time + POUNCE_RECOVERY;
				syncIguanoLocomotion(entry, false);
				return;
			}

			const step = POUNCE_SPEED * delta;
			const nextX = curV.x + p.pounceDir.x * step;
			const nextZ = curV.z + p.pounceDir.z * step;
			const next = new Vector3(nextX, env.groundedY(nextX, nextZ), nextZ);
			entry.anchor.y = next.y;
			teleportEnemyActor(entry, next);

			// Single hit per pounce: spend the strike on the first overlap.
			if (!p.pounceHitApplied) {
				for (const av of env.avatars.values()) {
					const pt = avatarWorldPosition(av);
					if (!pt) continue;
					const dx = pt.x - next.x;
					const dy = pt.y - next.y;
					const dz = pt.z - next.z;
					if (
						dx * dx + dy * dy + dz * dz <=
						ENEMY_HIT_RADIUS * ENEMY_HIT_RADIUS
					) {
						void env.conn.reducers.damagePlayer({
							deviceId: av.deviceId,
							amount: POUNCE_DAMAGE,
						});
						p.pounceHitApplied = true;
						break;
					}
				}
			}
			return;
		}

		// Idle: face the closest avatar; trigger if one steps inside the
		// trigger radius and the recovery cooldown has elapsed.
		const tgt = env.nearestAvatar(cur);
		if (!tgt) {
			syncIguanoLocomotion(entry, false);
			return;
		}

		faceDirection(
			entry,
			new Vector3(tgt.pos.x - curV.x, 0, tgt.pos.z - curV.z),
		);

		const cooldownDone =
			(p.pounceCooldownUntil ?? 0) <= entry.time;
		if (
			cooldownDone &&
			xzDistSq(curV, tgt.pos) <= POUNCE_TRIGGER_RADIUS_SQ
		) {
			const dir = new Vector3(
				tgt.pos.x - curV.x,
				0,
				tgt.pos.z - curV.z,
			);
			if (dir.lengthSq() < 1e-6) {
				dir.set(0, 0, 1);
			} else {
				dir.normalize();
			}
			p.pounceDir = dir;
			p.pounceEndsAt = entry.time + POUNCE_DURATION;
			p.pounceHitApplied = false;
			playEnemyOneShot(entry, 'punch', POUNCE_DURATION);
			return;
		}

		syncIguanoLocomotion(entry, false);
	},
};
