/**
 * Plane and grid math for the level tools.
 *
 * Pure: rays, planes, and grid steps in; points, frames, and planes out.
 * Drawing starts on the face under the cursor. Off every face, the Top and
 * Bottom cameras draw on XZ, the Left and Side cameras on YZ, and every other
 * camera on the ground. Element drags move on the axis plane a camera faces.
 */

import { Vector3 } from 'three';
import {
	frameForPlane,
	pointInFrame,
	type BrushFrame,
	type BrushPlane,
	type BrushVec3,
} from '@zylem/bridge';
import { EDITOR_CAMERAS } from '../camera/editor-camera-session';
import { closestAxisValue } from '../debug/transform-gizmo';

export type DrawView = 'top' | 'side' | 'front';

export interface DrawRay {
	origin: BrushVec3;
	direction: BrushVec3;
}

/** The camera's facing, for measures that fall back to the screen. */
export interface ViewBasis {
	/** World direction the camera looks. */
	direction: BrushVec3;
	/** World direction of the screen's up. */
	up: BrushVec3;
}

/** Hits where a ray meets a plane at a lower |cos| than this race across it, so they are refused. */
export const MIN_PLANE_INCIDENCE = 0.05;

/**
 * How close two facing components count as tied. Isometric cameras look
 * along (±1, ±1, ±1)/√3, and rounding must not tip them off the ground.
 */
const FACING_TIE = 1e-3;

/** Values this close to zero are rounding residue. */
const RESIDUE = 1e-9;

function dot(a: BrushVec3, b: BrushVec3): number {
	return a.x * b.x + a.y * b.y + a.z * b.z;
}

function sub(a: BrushVec3, b: BrushVec3): BrushVec3 {
	return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function length(a: BrushVec3): number {
	return Math.hypot(a.x, a.y, a.z);
}

/** Drop rounding residue, `-0` included, so grid values stay exact. */
export function cleanNumber(value: number): number {
	return Math.abs(value) < RESIDUE ? 0 : value;
}

export function cleanVec(value: BrushVec3): BrushVec3 {
	return { x: cleanNumber(value.x), y: cleanNumber(value.y), z: cleanNumber(value.z) };
}

/** Top and bottom draw on XZ. Left and right (the original side camera) draw on YZ. */
export function drawViewForCamera(cameraId: string | null): DrawView | null {
	if (cameraId === EDITOR_CAMERAS.top || cameraId === EDITOR_CAMERAS.bottom) return 'top';
	if (cameraId === EDITOR_CAMERAS.side || cameraId === EDITOR_CAMERAS.left) return 'side';
	return null;
}

/**
 * The axis plane a camera faces.
 *
 * Mostly Y faces XZ, mostly X faces YZ, mostly Z faces XY. A tie prefers top,
 * then side, so an isometric view faces the ground.
 */
export function drawViewForDirection(direction: BrushVec3): DrawView {
	const ax = Math.abs(direction.x);
	const ay = Math.abs(direction.y);
	const az = Math.abs(direction.z);
	if (ay >= ax - FACING_TIE && ay >= az - FACING_TIE) return 'top';
	if (ax >= az - FACING_TIE) return 'side';
	return 'front';
}

/** The axis a view's plane is constant along. */
export function drawPlaneAxis(view: DrawView): 'x' | 'y' | 'z' {
	if (view === 'top') return 'y';
	if (view === 'side') return 'x';
	return 'z';
}

/**
 * Where a ray meets the plane `normal · p = distance`.
 *
 * `null` when the hit is behind the ray (unless `behind`) or the ray grazes
 * the plane more than `minIncidence` allows.
 */
export function rayHitPlane(
	ray: DrawRay,
	normal: BrushVec3,
	distance: number,
	options: { minIncidence?: number; behind?: boolean } = {},
): BrushVec3 | null {
	const span = length(normal) * length(ray.direction);
	if (span < 1e-12) return null;
	const facing = dot(normal, ray.direction);
	if (Math.abs(facing) < Math.max(options.minIncidence ?? MIN_PLANE_INCIDENCE, 1e-9) * span) {
		return null;
	}
	const along = (distance - dot(normal, ray.origin)) / facing;
	if (along < 0 && !options.behind) return null;
	return {
		x: ray.origin.x + ray.direction.x * along,
		y: ray.origin.y + ray.direction.y * along,
		z: ray.origin.z + ray.direction.z * along,
	};
}

/** Where a ray meets an axis-aligned plane. */
export function rayHitAxisPlane(
	ray: DrawRay,
	axis: 'x' | 'y' | 'z',
	value: number,
): BrushVec3 | null {
	const normal = { x: 0, y: 0, z: 0 };
	normal[axis] = 1;
	return rayHitPlane(ray, normal, value);
}

/** A view's axis plane through the world origin, its normal toward the camera. */
export function viewPlaneFrame(view: DrawView, viewDirection: BrushVec3): BrushFrame {
	const axis = drawPlaneAxis(view);
	const normal = { x: 0, y: 0, z: 0 };
	normal[axis] = viewDirection[axis] > 0 ? -1 : 1;
	return frameForPlane(normal, 0);
}

/** The ground, `y = 0`, facing up. */
export function groundFrame(): BrushFrame {
	return frameForPlane({ x: 0, y: 1, z: 0 }, 0);
}

/** Where a draw or clip lands off every face: the locked cameras' view plane, else the ground. */
export function fallbackDrawFrame(cameraId: string | null, viewDirection: BrushVec3): BrushFrame {
	const view = drawViewForCamera(cameraId);
	return view ? viewPlaneFrame(view, viewDirection) : groundFrame();
}

/** The plane a frame lies on. */
export function framePlane(frame: BrushFrame): BrushPlane {
	return { normal: { ...frame.normal }, distance: dot(frame.normal, frame.origin) };
}

/**
 * The axis plane through `point` that a camera faces: locked cameras keep
 * their view plane, every other camera takes its most-facing axis.
 */
export function facingAxisPlane(
	cameraId: string | null,
	viewDirection: BrushVec3,
	point: BrushVec3,
): BrushPlane {
	const axis = drawPlaneAxis(drawViewForCamera(cameraId) ?? drawViewForDirection(viewDirection));
	const normal = { x: 0, y: 0, z: 0 };
	normal[axis] = 1;
	return { normal, distance: point[axis] };
}

/** Round to the nearest multiple of `step`. A non-positive step is left alone. */
export function snapValue(value: number, step: number): number {
	if (!(step > 0)) return value;
	return cleanNumber(Math.round(value / step) * step);
}

/** Snap each component. A non-positive step is left alone. */
export function snapPoint(point: BrushVec3, step: number): BrushVec3 {
	return {
		x: snapValue(point.x, step),
		y: snapValue(point.y, step),
		z: snapValue(point.z, step),
	};
}

/**
 * A point snapped on the world grid, then put back on the plane.
 * Snapping in world space keeps axis-aligned planes on the world grid.
 */
export function snapOntoPlane(point: BrushVec3, plane: BrushPlane, step: number): BrushVec3 {
	const snapped = snapPoint(point, step);
	const magnitude = length(plane.normal);
	if (magnitude < 1e-12) return snapped;
	const offset = (dot(plane.normal, snapped) - plane.distance) / (magnitude * magnitude);
	return cleanVec({
		x: snapped.x - plane.normal.x * offset,
		y: snapped.y - plane.normal.y * offset,
		z: snapped.z - plane.normal.z * offset,
	});
}

/** Frame coordinates of a point snapped on the world grid. */
export function snapInFrame(
	frame: BrushFrame,
	point: BrushVec3,
	step: number,
): { u: number; v: number } {
	const local = pointInFrame(frame, snapPoint(point, step));
	return { u: cleanNumber(local.u), v: cleanNumber(local.v) };
}

/**
 * The ray's closest point on an axis line, as a distance along it, or `null`
 * when the ray runs too nearly along the line; see `closestAxisValue`.
 */
export function axisValue(ray: DrawRay, anchor: BrushVec3, axis: BrushVec3): number | null {
	const direction = new Vector3(ray.direction.x, ray.direction.y, ray.direction.z);
	const unit = new Vector3(axis.x, axis.y, axis.z);
	if (direction.lengthSq() < 1e-24 || unit.lengthSq() < 1e-24) return null;
	return closestAxisValue(
		{
			origin: new Vector3(ray.origin.x, ray.origin.y, ray.origin.z),
			direction: direction.normalize(),
		},
		new Vector3(anchor.x, anchor.y, anchor.z),
		unit.normalize(),
	);
}

/**
 * Travel along an axis, measured from pointer rays.
 *
 * Follows the ray's closest point on the axis line, as the gizmo does. When
 * the axis points too nearly at the viewer for that to hold (a face seen head
 * on, a height drawn in the top view), the pointer's travel up the screen
 * stands in, positive toward the viewer.
 */
export class AxisDrag {
	private readonly startValue: number | null;
	private readonly startHit: BrushVec3 | null = null;
	private readonly sign: number = 1;

	constructor(
		private readonly anchor: BrushVec3,
		private readonly axis: BrushVec3,
		start: DrawRay,
		private readonly view: ViewBasis,
	) {
		this.startValue = axisValue(start, anchor, axis);
		if (this.startValue !== null) return;
		this.startHit = this.screenHit(start);
		this.sign = dot(axis, view.direction) <= 0 ? 1 : -1;
	}

	/** Whether the axis is read on screen rather than along its line. */
	get onScreen(): boolean {
		return this.startValue === null;
	}

	/** Signed travel since the start ray, or `null` when this ray cannot be read. */
	measure(ray: DrawRay): number | null {
		if (this.startValue !== null) {
			const value = axisValue(ray, this.anchor, this.axis);
			return value === null ? null : value - this.startValue;
		}
		if (!this.startHit) return null;
		const hit = this.screenHit(ray);
		if (!hit) return null;
		return dot(sub(hit, this.startHit), this.view.up) * this.sign;
	}

	private screenHit(ray: DrawRay): BrushVec3 | null {
		return rayHitPlane(ray, this.view.direction, dot(this.view.direction, this.anchor), {
			behind: true,
		});
	}
}
