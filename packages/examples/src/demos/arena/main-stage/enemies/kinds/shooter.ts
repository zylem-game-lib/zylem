import { Vector3 } from 'three';
import {
	faceDirection,
	playEnemyOneShot,
	syncIguanoLocomotion,
	teleportEnemyActor,
	xzDistSq,
	type IguanoBehavior,
} from '../shared';

/** Shooter: keeps distance + gravity lob shots (`damage_player`). */
const SHOOTER_RETREAT_NEAR_SQ = 7 * 7;
const SHOOTER_IDEAL_MIN_SQ = 10 * 10;
const SHOOTER_IDEAL_MAX_SQ = 15 * 15;
const SHOOTER_MOVE_SPEED = 5.2;
const SHOOT_INTERVAL = 1.95;

/**
 * Shooter archetype: kites the nearest avatar, retreats when too close,
 * advances when too far, and strafes inside the comfort band while throwing
 * lob projectiles on cooldown.
 */
export const SHOOTER_BEHAVIOR: IguanoBehavior = {
	kind: 'shooter',
	maxHp: 28,
	update(entry, delta, env) {
		entry.time += delta;
		const cur = entry.actor.body?.translation?.() ?? entry.anchor;
		const tgt = env.nearestAvatar(cur);
		const curV = new Vector3(cur.x, cur.y, cur.z);

		if (!tgt) {
			syncIguanoLocomotion(entry, false);
			return;
		}

		const radialFlat = new Vector3(
			tgt.pos.x - curV.x,
			0,
			tgt.pos.z - curV.z,
		);
		const planarSq = radialFlat.lengthSq();
		const radialLen = Math.sqrt(Math.max(0, planarSq));
		if (radialLen > 1e-5) radialFlat.multiplyScalar(1 / radialLen);

		const perp = new Vector3(-radialFlat.z, 0, radialFlat.x);
		const moveDir = new Vector3();

		if (planarSq < SHOOTER_RETREAT_NEAR_SQ) {
			moveDir.copy(radialFlat).multiplyScalar(-1);
		} else if (
			planarSq > SHOOTER_IDEAL_MAX_SQ ||
			(planarSq < SHOOTER_IDEAL_MIN_SQ && planarSq > SHOOTER_RETREAT_NEAR_SQ)
		) {
			moveDir.copy(radialFlat);
		} else {
			moveDir.copy(perp).multiplyScalar(Math.sin(entry.time * 0.9));
		}

		if (moveDir.lengthSq() < 1e-8) moveDir.copy(radialFlat);
		if (moveDir.lengthSq() < 1e-8) moveDir.set(0.01, 0, 0);
		moveDir.normalize().multiplyScalar(SHOOTER_MOVE_SPEED * delta);

		const nextX = curV.x + moveDir.x;
		const nextZ = curV.z + moveDir.z;
		const next = new Vector3(nextX, env.groundedY(nextX, nextZ), nextZ);
		entry.anchor.y = next.y;

		teleportEnemyActor(entry, next);
		syncIguanoLocomotion(entry, xzDistSq(curV, next) > 1e-8);
		faceDirection(entry, tgt.pos.clone().sub(curV));

		entry.attackCooldown -= delta;
		if (
			entry.attackCooldown <= 0 &&
			xzDistSq(entry.actor.body?.translation?.() ?? next, tgt.pos) >=
				SHOOTER_IDEAL_MIN_SQ * 0.64
		) {
			const from = entry.actor.body?.translation?.() ?? next;
			env.spawnLobProjectile(
				new Vector3(from.x, from.y, from.z),
				tgt.pos.clone(),
			);
			playEnemyOneShot(entry, 'fireball');
			entry.attackCooldown = SHOOT_INTERVAL * (0.88 + Math.random() * 0.2);
		}
	},
};
