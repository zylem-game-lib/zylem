import { Vector3 } from 'three';
import {
	avatarWorldPosition,
	ENEMY_HIT_RADIUS,
	faceDirection,
	moveTowardXZ,
	playEnemyOneShot,
	syncIguanoLocomotion,
	teleportEnemyActor,
	xzDistSq,
	type IguanoBehavior,
} from '../shared';

/**
 * Guardian: holds territory. Stays inside `GUARDIAN_HOME_RADIUS` of its
 * spawn anchor, slowly rotating in place when no avatar is nearby. If a
 * player crosses into `GUARDIAN_TERRITORY_RADIUS` it advances to bite
 * range and locks them down with a melee on cooldown. Once the player
 * leaves, it walks back to the anchor and resumes the slow scan.
 */
const GUARDIAN_TERRITORY_RADIUS = 8.0;
const GUARDIAN_TERRITORY_RADIUS_SQ =
	GUARDIAN_TERRITORY_RADIUS * GUARDIAN_TERRITORY_RADIUS;
const GUARDIAN_HOME_RADIUS = 1.5;
const GUARDIAN_MOVE_SPEED = 4.4;
const GUARDIAN_BITE_RADIUS_SQ = (1.9 * 1.9);
const GUARDIAN_BITE_DAMAGE = 14;
const GUARDIAN_BITE_COOLDOWN = 1.1;
const GUARDIAN_SCAN_RAD_PER_SEC = 0.7;

export const GUARDIAN_BEHAVIOR: IguanoBehavior = {
	kind: 'guardian',
	maxHp: 50,
	update(entry, delta, env) {
		entry.time += delta;
		const cur = entry.actor.body?.translation?.() ?? entry.anchor;
		const curV = new Vector3(cur.x, cur.y, cur.z);
		const tgt = env.nearestAvatar(cur);

		const intruderInRange =
			tgt !== null &&
			xzDistSq(curV, tgt.pos) <= GUARDIAN_TERRITORY_RADIUS_SQ;

		// Pick a destination: chase the intruder if they're in our turf,
		// otherwise return to the anchor (or hold there).
		const dest = intruderInRange
			? tgt!.pos
			: entry.anchor.clone();
		const distToDestSq = xzDistSq(curV, dest);

		// Hold position when we're already on top of our anchor and idle.
		const holding =
			!intruderInRange && distToDestSq <= GUARDIAN_HOME_RADIUS * GUARDIAN_HOME_RADIUS;

		if (holding) {
			// Slow yaw scan so the guardian visibly "looks around".
			if (entry.actor.group?.quaternion?.set) {
				const yaw =
					Math.sin(entry.time * GUARDIAN_SCAN_RAD_PER_SEC + entry.phase) *
					Math.PI;
				const half = yaw * 0.5;
				entry.actor.group.quaternion.set(0, Math.sin(half), 0, Math.cos(half));
			}
			syncIguanoLocomotion(entry, false);
		} else {
			const step = GUARDIAN_MOVE_SPEED * delta;
			const next = moveTowardXZ(curV, dest, step, env.groundedY);
			entry.anchor.y = next.y;
			teleportEnemyActor(entry, next);
			syncIguanoLocomotion(entry, xzDistSq(curV, next) > 1e-6);
			faceDirection(
				entry,
				new Vector3(dest.x - next.x, 0, dest.z - next.z),
			);
		}

		// Bite if a player is right next to us, regardless of where we are
		// in the territory (covers the case where they ran into us).
		entry.attackCooldown -= delta;
		if (tgt && entry.attackCooldown <= 0) {
			const after = entry.actor.body?.translation?.() ?? curV;
			const meleeSq =
				(after.x - tgt.pos.x) ** 2 +
				(after.y - tgt.pos.y) ** 2 +
				(after.z - tgt.pos.z) ** 2;
			if (meleeSq <= GUARDIAN_BITE_RADIUS_SQ) {
				playEnemyOneShot(entry, 'bite');
				for (const av of env.avatars.values()) {
					const pt = avatarWorldPosition(av);
					if (!pt) continue;
					const dx = pt.x - after.x;
					const dy = pt.y - after.y;
					const dz = pt.z - after.z;
					if (
						dx * dx + dy * dy + dz * dz <=
						ENEMY_HIT_RADIUS * ENEMY_HIT_RADIUS
					) {
						void env.conn.reducers.damagePlayer({
							deviceId: av.deviceId,
							amount: GUARDIAN_BITE_DAMAGE,
						});
						break;
					}
				}
				entry.attackCooldown = GUARDIAN_BITE_COOLDOWN;
			}
		}
	},
};
