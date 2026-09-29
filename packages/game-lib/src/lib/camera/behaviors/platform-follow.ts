import { MathUtils, Vector3 } from 'three';
import type { CameraBehavior, CameraContext, CameraPose } from '../types';
import { clonePose } from '../smoothing';

/** How one axis of the follow focus tracks the target. */
export type PlatformAxisMode = 'delay' | 'settle' | 'off';

export interface PlatformAxisModes {
	x?: PlatformAxisMode;
	y?: PlatformAxisMode;
	z?: PlatformAxisMode;
}

/**
 * Options for the Super Mario World style follow.
 *
 * `delay` lerps toward the target and can wait inside a deadzone.
 * `settle` holds still while the axis is moving (a jump, a lane change) and
 * eases to the new rest once the axis goes quiet — landing on a platform.
 * `off` leaves that axis of the incoming pose alone.
 */
export interface PlatformFollowOptions {
	/** Key in CameraContext.targets to follow. Default 'primary'. */
	targetKey?: string;
	/**
	 * Per-axis mode. Default: x and z delay, y settles. Vertical jumps do not
	 * drag the camera; landing does. The same settle mode works on a horizontal axis.
	 */
	axes?: PlatformAxisModes;
	/**
	 * Interpolation factor for `delay` axes, in 0..1 per 60Hz frame.
	 * 1 = instant. Scaled by dt. Default 0.1.
	 */
	lerpFactor?: number;
	/**
	 * Deadzone in world units for `delay` axes. The focus holds until the
	 * target (plus lookahead) leaves this window. Default 0.
	 */
	window?: number;
	/** Speed, in units/second, at or below which a `settle` axis counts as resting. Default 0.75. */
	settleSpeed?: number;
	/** Seconds a `settle` axis must stay slow before the focus accepts the new rest. Default 0.15. */
	settleTime?: number;
	/** Interpolation factor used once a `settle` axis has a new rest. Default 0.08. */
	settleLerp?: number;
	/**
	 * World units of lookahead along the last travel direction.
	 * Applied on `delay` axes only. Default 0.
	 */
	lookahead?: number;
}

const DEFAULT_AXES: Required<PlatformAxisModes> = {
	x: 'delay',
	y: 'settle',
	z: 'delay',
};

type Axis = 'x' | 'y' | 'z';
const AXES: Axis[] = ['x', 'y', 'z'];

/**
 * Follow a target with per-axis delay or platform settling.
 *
 * Shifts `position` and `lookAt` by the same delta, so the perspective's
 * offset stays intact and the framed point becomes the filtered focus.
 *
 * "On a platform" is inferred from the axis going quiet. Games do not have
 * to supply a grounded flag.
 */
export function createPlatformFollow(options?: PlatformFollowOptions): CameraBehavior {
	const axes: Required<PlatformAxisModes> = { ...DEFAULT_AXES, ...options?.axes };
	const targetKey = options?.targetKey ?? 'primary';
	const lerpFactor = options?.lerpFactor ?? 0.1;
	const window = options?.window ?? 0;
	const settleSpeed = options?.settleSpeed ?? 0.75;
	const settleTime = options?.settleTime ?? 0.15;
	const settleLerp = options?.settleLerp ?? 0.08;
	const lookahead = options?.lookahead ?? 0;

	let focus: Vector3 | null = null;
	let rest: Vector3 | null = null;
	let previous: Vector3 | null = null;
	const slowTime = { x: 0, y: 0, z: 0 };
	const heading = new Vector3();
	const travel = new Vector3();

	const reset = () => {
		focus = null;
		rest = null;
		previous = null;
		slowTime.x = slowTime.y = slowTime.z = 0;
		heading.set(0, 0, 0);
	};

	return {
		priority: 0,
		enabled: true,
		onAttach: reset,
		onDetach: reset,

		update(ctx: CameraContext, pose: CameraPose): CameraPose {
			const target = ctx.targets[targetKey];
			if (!target) return pose;

			const live = target.position;
			const focusPoint = focus ?? live.clone();
			const restPoint = rest ?? live.clone();
			const previousPoint = previous ?? live.clone();
			focus = focusPoint;
			rest = restPoint;
			previous = previousPoint;

			const dt = ctx.dt;
			const invDt = dt > 1e-8 ? 1 / dt : 0;
			const delayT = frameLerp(lerpFactor, dt);
			const settleT = frameLerp(settleLerp, dt);

			if (lookahead > 0) {
				travel.set(0, 0, 0);
				for (const axis of AXES) {
					if (axes[axis] !== 'delay') continue;
					travel[axis] = (live[axis] - previousPoint[axis]) * invDt;
				}
				if (travel.lengthSq() > 1e-8) heading.copy(travel).normalize();
			}

			for (const axis of AXES) {
				const mode = axes[axis];
				if (mode === 'off') {
					focusPoint[axis] = live[axis];
					continue;
				}

				const speed = Math.abs((live[axis] - previousPoint[axis]) * invDt);
				if (mode === 'settle') {
					if (speed <= settleSpeed) {
						slowTime[axis] += dt;
						if (slowTime[axis] >= settleTime) restPoint[axis] = live[axis];
					} else {
						slowTime[axis] = 0;
					}
					focusPoint[axis] = MathUtils.lerp(focusPoint[axis], restPoint[axis], settleT);
					continue;
				}

				let goal = live[axis];
				if (lookahead > 0) goal += heading[axis] * lookahead;
				if (Math.abs(goal - focusPoint[axis]) <= window) continue;
				focusPoint[axis] = MathUtils.lerp(focusPoint[axis], goal, delayT);
			}

			previousPoint.copy(live);

			const result = clonePose(pose);
			const dx = focusPoint.x - live.x;
			const dy = focusPoint.y - live.y;
			const dz = focusPoint.z - live.z;
			result.position.x += dx;
			result.position.y += dy;
			result.position.z += dz;
			if (result.lookAt) {
				result.lookAt.x += dx;
				result.lookAt.y += dy;
				result.lookAt.z += dz;
			}
			return result;
		},
	};
}

/** 0..1 blend that stays the same across refresh rates. `factor` is per 60Hz frame. */
function frameLerp(factor: number, dt: number): number {
	const damping = MathUtils.clamp(factor, 0, 1);
	return 1 - Math.pow(1 - damping, dt * 60);
}
