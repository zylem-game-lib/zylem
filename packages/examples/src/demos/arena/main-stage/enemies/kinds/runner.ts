import { Vector3 } from 'three';
import {
	avatarWorldPosition,
	faceDirection,
	playEnemyOneShot,
	syncIguanoLocomotion,
	teleportEnemyActor,
	xzDistSq,
	type BehaviorEnv,
	type EnemyEntry,
	type IguanoBehavior,
} from '../shared';

/** Runner kamikaze: sprint + AoE explosion on proximity. */
const RUNNER_APPROACH_SPEED = 10;
const RUNNER_DETONATE_RADIUS = 2.1;
const RUNNER_BLAST_RADIUS = 3.4;
const RUNNER_BLAST_DAMAGE = 34;

/**
 * Detonate the runner: emit a particle burst, damage everyone inside the
 * blast radius, swap to the death animation, and despawn the row. Idempotent
 * via `runnerCommitted`.
 */
function explodeRunner(
	entry: EnemyEntry,
	worldPos: Vector3,
	env: BehaviorEnv,
): void {
	if (entry.runnerCommitted) return;
	entry.runnerCommitted = true;
	env.spawnParticleBurst(worldPos, {
		color: '#ff5522',
		count: 42,
		duration: 0.08,
		speed: [6, 18],
		size: [0.12, 0.55],
		yOffset: 0.4,
	});
	for (const av of env.avatars.values()) {
		const pt = avatarWorldPosition(av);
		if (!pt) continue;
		const dx = pt.x - worldPos.x;
		const dy = pt.y - worldPos.y;
		const dz = pt.z - worldPos.z;
		if (
			dx * dx + dy * dy + dz * dz <=
			RUNNER_BLAST_RADIUS * RUNNER_BLAST_RADIUS
		) {
			void env.conn.reducers.damagePlayer({
				deviceId: av.deviceId,
				amount: RUNNER_BLAST_DAMAGE,
			});
		}
	}
	playEnemyOneShot(entry, 'runDestruct');
	env.killEnemyRows(entry);
}

/**
 * Runner archetype: charges directly at the nearest avatar and detonates on
 * contact. No attack cooldown; the explosion is single-shot.
 */
export const RUNNER_BEHAVIOR: IguanoBehavior = {
	kind: 'runner',
	maxHp: 18,
	update(entry, delta, env) {
		if (entry.runnerCommitted) return;
		entry.time += delta;
		const cur = entry.actor.body?.translation?.() ?? entry.anchor;
		const tgt = env.nearestAvatar(cur);
		const curV = new Vector3(cur.x, cur.y, cur.z);
		if (!tgt) {
			syncIguanoLocomotion(entry, false);
			return;
		}
		const planar = xzDistSq(tgt.pos, curV);

		if (planar <= RUNNER_DETONATE_RADIUS * RUNNER_DETONATE_RADIUS) {
			explodeRunner(entry, curV.clone(), env);
			return;
		}

		const toT = new Vector3().subVectors(tgt.pos, curV);
		const dir = new Vector3(toT.x, 0, toT.z);
		dir.normalize().multiplyScalar(RUNNER_APPROACH_SPEED * delta);
		const nextX = curV.x + dir.x;
		const nextZ = curV.z + dir.z;
		const next = new Vector3(nextX, env.groundedY(nextX, nextZ), nextZ);
		entry.anchor.y = next.y;

		const prev = curV.clone();
		teleportEnemyActor(entry, next);
		const moved =
			xzDistSq(prev, entry.actor.body?.translation?.() ?? next) > 1e-6;
		syncIguanoLocomotion(entry, moved);

		const q = entry.actor.body?.translation?.() ?? next;
		faceDirection(
			entry,
			new Vector3(tgt.pos.x - q.x, 0, tgt.pos.z - q.z),
		);
	},
};
