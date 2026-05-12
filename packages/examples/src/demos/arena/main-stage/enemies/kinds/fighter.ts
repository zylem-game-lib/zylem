import { Vector3 } from 'three';
import {
	avatarWorldPosition,
	ENEMY_HIT_RADIUS,
	faceDirection,
	playEnemyOneShot,
	syncIguanoLocomotion,
	teleportEnemyActor,
	xzDistSq,
	type IguanoBehavior,
} from '../shared';

/** Fighter: orbit-zone melee when in range (`damage_player`). */
const FIGHTER_MOVE_SPEED = 5.8;
const FIGHTER_ZONE_MIN_DIST = 2.6;
const FIGHTER_ZONE_MAX_DIST = 5.2;
const FIGHTER_MELEE_RADIUS_SQ = 2.1 * 2.1;
const FIGHTER_MELEE_DAMAGE = 11;
const FIGHTER_MELEE_COOLDOWN = 1;

/**
 * Fighter archetype: maintains a melee orbit around the nearest avatar,
 * pushing inward / outward to stay in `[FIGHTER_ZONE_MIN_DIST,
 * FIGHTER_ZONE_MAX_DIST]`, alternating bite / punch on cooldown.
 */
export const FIGHTER_BEHAVIOR: IguanoBehavior = {
	kind: 'fighter',
	maxHp: 44,
	update(entry, delta, env) {
		entry.time += delta;
		const cur = entry.actor.body?.translation?.() ?? entry.anchor;
		const tgt = env.nearestAvatar(cur);
		const curV = new Vector3(cur.x, cur.y, cur.z);

		if (!tgt) {
			syncIguanoLocomotion(entry, false);
			return;
		}

		const planarSq = xzDistSq(curV, tgt.pos);
		const planar = Math.sqrt(Math.max(0, planarSq));
		const toPlayerFlat = new Vector3(
			tgt.pos.x - curV.x,
			0,
			tgt.pos.z - curV.z,
		);

		const perp = new Vector3(-toPlayerFlat.z, 0, toPlayerFlat.x);
		const plen = perp.length();
		if (plen > 1e-5) perp.multiplyScalar(1 / plen);

		const moveDir = new Vector3();
		if (planar < FIGHTER_ZONE_MIN_DIST) {
			moveDir.copy(toPlayerFlat).multiplyScalar(-1);
		} else if (planar > FIGHTER_ZONE_MAX_DIST) {
			moveDir.copy(toPlayerFlat);
		} else {
			moveDir.copy(perp).multiplyScalar(entry.phase > Math.PI ? 1 : -1);
		}

		if (moveDir.lengthSq() < 1e-6) {
			moveDir.set(
				Math.cos(entry.time + entry.phase),
				0,
				Math.sin(entry.time + entry.phase),
			);
		}
		moveDir.normalize();

		const step = FIGHTER_MOVE_SPEED * delta;
		const nextX = curV.x + moveDir.x * step;
		const nextZ = curV.z + moveDir.z * step;
		const next = new Vector3(nextX, env.groundedY(nextX, nextZ), nextZ);
		entry.anchor.y = next.y;

		teleportEnemyActor(entry, next);
		syncIguanoLocomotion(entry, xzDistSq(curV, next) > 1e-8);
		const face = toPlayerFlat.clone();
		if (face.lengthSq() > 1e-6) face.normalize();
		else face.set(0, 0, 1);
		faceDirection(entry, face);

		entry.attackCooldown -= delta;
		const after = entry.actor.body?.translation?.() ?? next;
		const meleeDistSq =
			(after.x - tgt.pos.x) ** 2 +
			(after.y - tgt.pos.y) ** 2 +
			(after.z - tgt.pos.z) ** 2;
		if (meleeDistSq <= FIGHTER_MELEE_RADIUS_SQ && entry.attackCooldown <= 0) {
			const animKey =
				entry.time * 0.3 + entry.phase > Math.PI ? 'bite' : 'punch';
			playEnemyOneShot(entry, animKey);
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
						amount: FIGHTER_MELEE_DAMAGE,
					});
					break;
				}
			}
			entry.attackCooldown = FIGHTER_MELEE_COOLDOWN;
		}
	},
};
