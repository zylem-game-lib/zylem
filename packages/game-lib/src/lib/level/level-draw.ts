/**
 * Grid geometry for the level tools.
 *
 * Pure: a ray and a view in, a box or a clip plane out. Top looks down onto
 * XZ and extrudes one grid step on Y. Side looks along X onto YZ and extrudes
 * one grid step on X. Front looks along Z onto XY and extrudes one grid step
 * on Z. Top and Side cameras are locked to those planes; every other camera
 * uses whichever axis it faces most directly.
 */

import { EDITOR_CAMERAS } from '../camera/editor-camera-session';
import type { BrushPlane, BrushVec3 } from './brush';

export type DrawView = 'top' | 'side' | 'front';

export interface DrawRay {
	origin: BrushVec3;
	direction: BrushVec3;
}

/** `editor:top` and `editor:side`, or null when the camera should follow its facing. */
export function drawViewForCamera(cameraId: string | null): DrawView | null {
	if (cameraId === EDITOR_CAMERAS.top) return 'top';
	if (cameraId === EDITOR_CAMERAS.side) return 'side';
	return null;
}

/**
 * The axis plane a camera faces.
 *
 * Mostly Y draws on XZ, mostly X on YZ, mostly Z on XY. A tie prefers top,
 * then side, so an isometric view draws on the ground.
 */
export function drawViewForDirection(direction: BrushVec3): DrawView {
	const ax = Math.abs(direction.x);
	const ay = Math.abs(direction.y);
	const az = Math.abs(direction.z);
	if (ay >= ax && ay >= az) return 'top';
	if (ax >= az) return 'side';
	return 'front';
}

/** The axis a view extrudes, and the one its drag plane is constant along. */
export function drawPlaneAxis(view: DrawView): 'x' | 'y' | 'z' {
	if (view === 'top') return 'y';
	if (view === 'side') return 'x';
	return 'z';
}

/** Where a ray meets an axis-aligned plane, or null when it never will. */
export function rayHitAxisPlane(
	ray: DrawRay,
	axis: 'x' | 'y' | 'z',
	value: number,
): BrushVec3 | null {
	const origin = ray.origin[axis];
	const direction = ray.direction[axis];
	if (Math.abs(direction) < 1e-8) return null;
	const distance = (value - origin) / direction;
	if (distance < 0) return null;
	return {
		x: ray.origin.x + ray.direction.x * distance,
		y: ray.origin.y + ray.direction.y * distance,
		z: ray.origin.z + ray.direction.z * distance,
	};
}

function snap(value: number, step: number): number {
	return Math.round(value / step) * step;
}

/**
 * An axis-aligned box from a drag on the view plane.
 *
 * The two dragged axes snap to the grid and grow to at least one cell. The
 * third axis is one grid step out from the plane the drag started on: +Y in
 * the top view, +X in the side view, +Z in the front view.
 */
export function boxFromDrag(
	view: DrawView,
	start: BrushVec3,
	end: BrushVec3,
	step: number,
): { min: BrushVec3; max: BrushVec3 } {
	const grid = Math.max(step, 1e-4);
	const pair = (a: number, b: number): [number, number] => {
		const lo = snap(Math.min(a, b), grid);
		let hi = snap(Math.max(a, b), grid);
		if (hi - lo < grid * 0.5) hi = lo + grid;
		return [lo, hi];
	};

	if (view === 'top') {
		const [x0, x1] = pair(start.x, end.x);
		const [z0, z1] = pair(start.z, end.z);
		const y0 = snap(start.y, grid);
		return {
			min: { x: x0, y: y0, z: z0 },
			max: { x: x1, y: y0 + grid, z: z1 },
		};
	}

	if (view === 'front') {
		const [x0, x1] = pair(start.x, end.x);
		const [y0, y1] = pair(start.y, end.y);
		const z0 = snap(start.z, grid);
		return {
			min: { x: x0, y: y0, z: z0 },
			max: { x: x1, y: y1, z: z0 + grid },
		};
	}

	const [y0, y1] = pair(start.y, end.y);
	const [z0, z1] = pair(start.z, end.z);
	const x0 = snap(start.x, grid);
	return {
		min: { x: x0, y: y0, z: z0 },
		max: { x: x0 + grid, y: y1, z: z1 },
	};
}

/**
 * A clip plane through two points, standing perpendicular to the view.
 *
 * Top makes a vertical plane (the line on XZ, extended through Y). Side makes
 * a plane that contains the X axis (the line on YZ). Front makes a plane that
 * contains the Z axis (the line on XY).
 */
export function clipPlaneFromPoints(view: DrawView, start: BrushVec3, end: BrushVec3): BrushPlane | null {
	if (view === 'top') {
		const dx = end.x - start.x;
		const dz = end.z - start.z;
		const span = Math.hypot(dx, dz);
		if (span < 1e-6) return null;
		const normal = { x: -dz / span, y: 0, z: dx / span };
		return {
			normal,
			distance: normal.x * start.x + normal.z * start.z,
		};
	}

	if (view === 'front') {
		const dx = end.x - start.x;
		const dy = end.y - start.y;
		const span = Math.hypot(dx, dy);
		if (span < 1e-6) return null;
		const normal = { x: -dy / span, y: dx / span, z: 0 };
		return {
			normal,
			distance: normal.x * start.x + normal.y * start.y,
		};
	}

	const dy = end.y - start.y;
	const dz = end.z - start.z;
	const span = Math.hypot(dy, dz);
	if (span < 1e-6) return null;
	const normal = { x: 0, y: -dz / span, z: dy / span };
	return {
		normal,
		distance: normal.y * start.y + normal.z * start.z,
	};
}

/** Snap each component. A non-positive step is left alone. */
export function snapPoint(point: BrushVec3, step: number): BrushVec3 {
	if (step <= 0) return { x: point.x, y: point.y, z: point.z };
	return { x: snap(point.x, step), y: snap(point.y, step), z: snap(point.z, step) };
}
