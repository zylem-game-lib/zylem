import { Vector3 } from 'three';
import {
	faceDirection,
	moveTowardXZ,
	playEnemyOneShot,
	syncIguanoLocomotion,
	teleportEnemyActor,
	xzDistSq,
	type IguanoBehavior,
} from '../shared';

/** Planter: plants host-local proximity mines (`damage_player` only). */
const PLANTER_MOVE_SPEED = 3.6;
const PLANT_INTERVAL = 2.9;

/**
 * Planter archetype: hovers around the avatar centroid (or its anchor when no
 * players are present) and periodically drops a proximity mine at its feet.
 */
export const PLANTER_BEHAVIOR: IguanoBehavior = {
	kind: 'planter',
	maxHp: 36,
	update(entry, delta, env) {
		entry.time += delta;
		const cen = env.centroidOfAvatarsXZ();
		const cur = entry.actor.body?.translation?.() ?? entry.anchor;

		let dest: Vector3;
		if (!cen) {
			dest = new Vector3(
				entry.anchor.x + Math.cos(entry.time * 0.4 + entry.phase) * 2,
				entry.anchor.y,
				entry.anchor.z + Math.sin(entry.time * 0.4 + entry.phase) * 2,
			);
		} else {
			const blend = cen.clone().sub(entry.anchor).multiplyScalar(0.55);
			dest = entry.anchor.clone().add(blend);
		}
		dest.y = env.groundedY(dest.x, dest.z);

		const curV = new Vector3(cur.x, cur.y, cur.z);
		const step = PLANTER_MOVE_SPEED * delta;
		const next = moveTowardXZ(curV, dest, step, env.groundedY);
		entry.anchor.y = next.y;

		teleportEnemyActor(entry, next);
		syncIguanoLocomotion(entry, xzDistSq(curV, next) > 1e-5);
		if (cen) {
			faceDirection(entry, cen.clone().sub(next));
		}

		entry.attackCooldown -= delta;
		if (entry.attackCooldown <= 0) {
			const foot = entry.actor.body?.translation?.() ?? next;
			env.spawnProximityMineAt(new Vector3(foot.x, foot.y, foot.z));
			playEnemyOneShot(entry, 'planting');
			entry.attackCooldown = PLANT_INTERVAL * (0.85 + Math.random() * 0.25);
		}
	},
};
