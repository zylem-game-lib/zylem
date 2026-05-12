import { Vector3 } from 'three';
import {
	faceDirection,
	moveTowardXZ,
	syncIguanoLocomotion,
	teleportEnemyActor,
	xzDistSq,
	type EnemyEntry,
	type IguanoBehavior,
} from '../shared';

/**
 * Wanderer: picks a random XZ point within `WANDER_RADIUS` of its anchor,
 * walks there, idles for a short pause, picks another. Reads as a stop-and-
 * go grazer — visibly different from the constant-motion patrol / fighter.
 */
const WANDER_MOVE_SPEED = 3.0;
const WANDER_RADIUS = 6.5;
const WANDER_REACH_SQ = 0.5 * 0.5;
const WANDER_PAUSE_MIN = 1.0;
const WANDER_PAUSE_MAX = 2.4;

interface WandererEntry extends EnemyEntry {
	wanderTarget?: Vector3;
	wanderPauseUntil?: number;
}

/** Pick a fresh XZ destination inside the disc around `anchor`. */
function pickWanderTarget(entry: EnemyEntry): Vector3 {
	const angle = Math.random() * Math.PI * 2;
	const radius = Math.sqrt(Math.random()) * WANDER_RADIUS;
	const x = entry.anchor.x + Math.cos(angle) * radius;
	const z = entry.anchor.z + Math.sin(angle) * radius;
	return new Vector3(x, entry.anchor.y, z);
}

export const WANDERER_BEHAVIOR: IguanoBehavior = {
	kind: 'wanderer',
	maxHp: 24,
	update(entry, delta, env) {
		entry.time += delta;
		const w = entry as WandererEntry;
		const cur = entry.actor.body?.translation?.() ?? entry.anchor;
		const curV = new Vector3(cur.x, cur.y, cur.z);

		// Currently pausing? Hold idle until the timer expires.
		if (w.wanderPauseUntil !== undefined && entry.time < w.wanderPauseUntil) {
			syncIguanoLocomotion(entry, false);
			return;
		}

		if (!w.wanderTarget) {
			w.wanderTarget = pickWanderTarget(entry);
		}

		// Reached the target? Start a pause and clear the target so the
		// next "active" tick picks a fresh one.
		if (xzDistSq(curV, w.wanderTarget) <= WANDER_REACH_SQ) {
			w.wanderPauseUntil =
				entry.time +
				WANDER_PAUSE_MIN +
				Math.random() * (WANDER_PAUSE_MAX - WANDER_PAUSE_MIN);
			w.wanderTarget = undefined;
			syncIguanoLocomotion(entry, false);
			return;
		}

		const step = WANDER_MOVE_SPEED * delta;
		const next = moveTowardXZ(curV, w.wanderTarget, step, env.groundedY);
		entry.anchor.y = next.y;

		teleportEnemyActor(entry, next);
		syncIguanoLocomotion(entry, xzDistSq(curV, next) > 1e-6);
		faceDirection(
			entry,
			new Vector3(
				w.wanderTarget.x - next.x,
				0,
				w.wanderTarget.z - next.z,
			),
		);
	},
};
