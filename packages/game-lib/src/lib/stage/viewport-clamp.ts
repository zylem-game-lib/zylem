/**
 * Keeps a transform drag inside what the camera can actually see.
 *
 * The bound is measured in normalized device coordinates rather than world
 * units, so it follows the view for free: zoom out and there is more room to
 * move, zoom in and there is less. Depth counts too — an entity shoved behind
 * the camera or past the far plane is just as lost as one dragged off the side.
 *
 * Pure geometry over a camera and points, so it is exercised directly in tests.
 */

import {
	OrthographicCamera,
	PerspectiveCamera,
	Vector3,
	type Box3,
	type Camera,
} from 'three';

/**
 * Fraction of the viewport a drag may reach. Short of 1 so the target does not
 * sit exactly on the edge, where it is half off screen and hard to grab again.
 */
export const DEFAULT_VIEWPORT_MARGIN = 0.95;

/** Bisection steps used to find the boundary. */
const REFINE_STEPS = 16;

const _projected = new Vector3();
const _candidate = new Vector3();
const _center = new Vector3();
const _corner = new Vector3();

/**
 * Whether a camera has a projection worth testing against.
 *
 * A bare `Camera` carries an identity projection matrix, which would put every
 * point at the centre of a one-unit cube and make the bound meaningless. Callers
 * treat this as "no clamp" rather than guessing.
 */
export function canClampToViewport(camera: Camera | null): boolean {
	if (!camera) return false;
	return (
		(camera as PerspectiveCamera).isPerspectiveCamera === true
		|| (camera as OrthographicCamera).isOrthographicCamera === true
	);
}

/** Whether a world point projects inside the viewport. */
export function isPointInViewport(
	point: Vector3,
	camera: Camera,
	margin: number = DEFAULT_VIEWPORT_MARGIN,
): boolean {
	_projected.copy(point).project(camera);
	return (
		Math.abs(_projected.x) <= margin
		&& Math.abs(_projected.y) <= margin
		// Outside this range the point is behind the camera or past the far
		// plane; either way it is no longer on screen.
		&& _projected.z >= -1
		&& _projected.z <= 1
	);
}

/**
 * Walk a parameter back toward 0 until `accept` is satisfied.
 *
 * @returns The largest tested value in `(0, 1]` that was accepted, or 0 when
 * even the smallest step fails.
 */
function refine(accept: (t: number) => boolean): number {
	let low = 0;
	let high = 1;
	for (let step = 0; step < REFINE_STEPS; step += 1) {
		const mid = (low + high) / 2;
		if (accept(mid)) {
			low = mid;
		} else {
			high = mid;
		}
	}
	return low;
}

/**
 * The furthest point along `from` → `to` that is still on screen.
 *
 * @returns `to` unchanged when the whole segment is visible, when the camera
 * cannot project, or when `from` is itself off screen — in that last case there
 * is no visible anchor to retreat toward, and refusing to move would strand a
 * drag the user can see perfectly well.
 */
export function clampPointToViewport(
	from: Vector3,
	to: Vector3,
	camera: Camera | null,
	margin: number = DEFAULT_VIEWPORT_MARGIN,
): Vector3 {
	if (!canClampToViewport(camera)) return to.clone();
	const view = camera as Camera;

	if (isPointInViewport(to, view, margin)) return to.clone();
	if (!isPointInViewport(from, view, margin)) return to.clone();

	const fraction = refine((t) =>
		isPointInViewport(_candidate.copy(from).lerp(to, t), view, margin),
	);
	return from.clone().lerp(to, fraction);
}

/**
 * The largest fraction of a scale-up that keeps `bounds` inside the viewport.
 *
 * Scaling grows the object rather than moving it, so the bound is on the box
 * corners: the entity may grow until it fills the view. Shrinking is always
 * allowed.
 *
 * @param center World point the scaling grows about — the object's own origin,
 * which is not the centre of its bounding box whenever its geometry is offset.
 * @param factor Per-axis multiplier being applied to the drag-start bounds.
 * @returns The multiplier to apply instead, never larger than `factor`.
 */
export function clampScaleToViewport(
	bounds: Box3,
	center: Vector3,
	factor: Vector3,
	camera: Camera | null,
	margin: number = DEFAULT_VIEWPORT_MARGIN,
): Vector3 {
	if (!canClampToViewport(camera)) return factor.clone();
	if (factor.x <= 1 && factor.y <= 1 && factor.z <= 1) return factor.clone();
	if (bounds.isEmpty()) return factor.clone();

	const view = camera as Camera;
	_center.copy(center);

	// Interpolating from unit scale means the accepted fraction is always
	// reachable: an unscaled entity that is already too big for the view can
	// still be shrunk, and the drag simply cannot grow it.
	const scaled = new Vector3(1, 1, 1);
	const fits = (t: number): boolean => {
		scaled.set(
			1 + (factor.x - 1) * t,
			1 + (factor.y - 1) * t,
			1 + (factor.z - 1) * t,
		);
		return boundsFitViewport(bounds, _center, scaled, view, margin);
	};

	if (fits(1)) return factor.clone();

	const fraction = refine(fits);
	return new Vector3(
		1 + (factor.x - 1) * fraction,
		1 + (factor.y - 1) * fraction,
		1 + (factor.z - 1) * fraction,
	);
}

/** Whether every corner of `bounds`, scaled about `center`, is on screen. */
function boundsFitViewport(
	bounds: Box3,
	center: Vector3,
	scale: Vector3,
	camera: Camera,
	margin: number,
): boolean {
	for (let index = 0; index < 8; index += 1) {
		_corner.set(
			index & 1 ? bounds.max.x : bounds.min.x,
			index & 2 ? bounds.max.y : bounds.min.y,
			index & 4 ? bounds.max.z : bounds.min.z,
		);
		_corner
			.sub(center)
			.multiply(scale)
			.add(center);
		if (!isPointInViewport(_corner, camera, margin)) return false;
	}
	return true;
}
