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
 * Patrol: walks a fixed 4-corner loop centred on the spawn anchor. Visually
 * distinct from every other kind because it never deviates — even when a
 * player crosses its path — so it reads as "scenery on rails".
 */
const PATROL_MOVE_SPEED = 3.4;
const PATROL_RADIUS = 4.2;
/** Distance² at which the next waypoint is considered "reached". */
const PATROL_WAYPOINT_REACH_SQ = 0.45 * 0.45;

interface PatrolEntry extends EnemyEntry {
	patrolWaypointIdx?: number;
}

/**
 * Compute the four waypoints (cardinal-offset square) around an anchor in
 * the order the patrol traverses them. Memoised on the entry so we don't
 * re-allocate every tick.
 */
function patrolWaypoints(entry: EnemyEntry): readonly Vector3[] {
	const a = entry.anchor;
	return [
		new Vector3(a.x + PATROL_RADIUS, a.y, a.z),
		new Vector3(a.x, a.y, a.z + PATROL_RADIUS),
		new Vector3(a.x - PATROL_RADIUS, a.y, a.z),
		new Vector3(a.x, a.y, a.z - PATROL_RADIUS),
	];
}

export const PATROL_BEHAVIOR: IguanoBehavior = {
	kind: 'patrol',
	maxHp: 30,
	update(entry, delta, env) {
		entry.time += delta;
		const e = entry as PatrolEntry;
		if (e.patrolWaypointIdx === undefined) e.patrolWaypointIdx = 0;

		const waypoints = patrolWaypoints(entry);
		const target = waypoints[e.patrolWaypointIdx]!;
		const cur = entry.actor.body?.translation?.() ?? entry.anchor;
		const curV = new Vector3(cur.x, cur.y, cur.z);

		if (xzDistSq(curV, target) <= PATROL_WAYPOINT_REACH_SQ) {
			e.patrolWaypointIdx = (e.patrolWaypointIdx + 1) % waypoints.length;
		}

		const dest = waypoints[e.patrolWaypointIdx]!;
		const step = PATROL_MOVE_SPEED * delta;
		const next = moveTowardXZ(curV, dest, step, env.groundedY);
		entry.anchor.y = next.y;

		teleportEnemyActor(entry, next);
		syncIguanoLocomotion(entry, xzDistSq(curV, next) > 1e-6);
		faceDirection(entry, new Vector3(dest.x - next.x, 0, dest.z - next.z));
	},
};
