/**
 * Maps canvas-center-relative pointer offset to absolute yaw/pitch targets.
 * Used with screen-center mouse look (free cursor, no pointer lock).
 */

export interface ScreenCenterLookTargets {
	targetYaw: number;
	targetPitch: number;
}

export interface ScreenCenterLookOptions {
	maxLookDegrees?: number;
	/** How fast cursor position pulls yaw/pitch toward target (lower = snappier). @default 2 */
	lookSensitivity?: number;
}

/** Shortest signed angle from `from` to `to` in radians. */
export function shortestAngleDelta(from: number, to: number): number {
	let d = to - from;
	while (d > Math.PI) d -= 2 * Math.PI;
	while (d < -Math.PI) d += 2 * Math.PI;
	return d;
}

/**
 * Converts normalized pointer offset from viewport center to look angles.
 *
 * @param nx Horizontal offset from center (−1 = left edge, +1 = right edge).
 * @param ny Vertical offset from center (−1 = top edge, +1 = bottom edge).
 * @param maxDegrees Maximum yaw/pitch at viewport edges (default 45).
 */
export function screenCenterLookTargets(
	nx: number,
	ny: number,
	maxDegrees = 45,
): ScreenCenterLookTargets {
	const max = (maxDegrees * Math.PI) / 180;
	return {
		targetYaw: -nx * max,
		targetPitch: -ny * max,
	};
}

/**
 * Computes WASM look deltas that drive current yaw/pitch toward screen-center targets.
 *
 * `lookSensitivity` controls follow rate toward the cursor-mapped target (lower = snappier).
 * WASM applies its own `look_sensitivity` multiplier to these deltas.
 */
export function screenCenterLookDeltas(
	nx: number,
	ny: number,
	currentYaw: number,
	currentPitch: number,
	options: ScreenCenterLookOptions = {},
): { lookX: number; lookY: number } {
	const { targetYaw, targetPitch } = screenCenterLookTargets(
		nx,
		ny,
		options.maxLookDegrees ?? 45,
	);
	const sensitivity = options.lookSensitivity ?? 2;
	return {
		lookX: shortestAngleDelta(currentYaw, targetYaw) / sensitivity,
		lookY: shortestAngleDelta(currentPitch, targetPitch) / sensitivity,
	};
}
