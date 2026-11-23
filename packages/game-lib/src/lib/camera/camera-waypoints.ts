import { Vector3 } from 'three';
import type { Vec3Input } from '../core/vector';
import { toThreeVector3 } from '../core/vector';
import type { CutsceneEasing } from '../cinematics/cutscene-definition';
import { easeValue } from '../cinematics/cutscene-math';
import { clonePose } from './smoothing';
import type { CameraPose } from './types';

/** A timed move to a camera position, with an optional point to look at. */
export interface CameraWaypoint {
	position: Vec3Input;
	/** Keeps the previous aim when omitted. */
	lookAt?: Vec3Input;
	/** Seconds to reach this waypoint. Zero makes an immediate cut. Defaults to one. */
	duration?: number;
	/** Defaults to easeInOut. */
	easing?: CutsceneEasing;
}

export type CameraWaypoints = readonly CameraWaypoint[];

interface ResolvedWaypoint {
	position: Vector3;
	lookAt?: Vector3;
	duration: number;
	easing: CutsceneEasing;
}

/** Advances waypoint moves using the camera's simulation clock. */
export class CameraWaypointQueue {
	private readonly pending: ResolvedWaypoint[] = [];
	private from: CameraPose | null = null;
	private elapsed = 0;

	add(waypoints: CameraWaypoints): void {
		const resolved = waypoints.map(({ position, lookAt, duration = 1, easing = 'easeInOut' }) => {
			if (!Number.isFinite(duration) || duration < 0) {
				throw new RangeError('Camera waypoint duration must be finite and nonnegative.');
			}
			return {
				position: toThreeVector3(position),
				lookAt: lookAt === undefined ? undefined : toThreeVector3(lookAt),
				duration,
				easing,
			};
		});
		this.pending.push(...resolved);
	}

	clear(): void {
		this.pending.length = 0;
		this.from = null;
		this.elapsed = 0;
	}

	update(pose: CameraPose, dt: number): CameraPose | null {
		if (!this.pending.length) return this.from;
		this.from ??= clonePose(pose);
		this.elapsed += Math.max(0, dt);
		while (this.pending.length && this.elapsed >= this.pending[0]!.duration) {
			const waypoint = this.pending.shift()!;
			this.elapsed -= waypoint.duration;
			this.from = this.interpolate(this.from, waypoint, 1);
		}
		const waypoint = this.pending[0];
		if (waypoint) {
			return this.interpolate(this.from, waypoint, easeValue(waypoint.easing, this.elapsed / waypoint.duration));
		}
		this.elapsed = 0;
		return this.from;
	}

	private interpolate(from: CameraPose, to: ResolvedWaypoint, progress: number): CameraPose {
		const pose = clonePose(from);
		pose.position.lerp(to.position, progress);
		if (to.lookAt) {
			const aim = pose.lookAt ?? new Vector3(0, 0, -1).applyQuaternion(from.rotation).add(from.position);
			pose.lookAt = aim.lerp(to.lookAt, progress);
		}
		return pose;
	}
}
