/**
 * Clip points and the plane they make.
 *
 * Two points cut along the screen line: the plane through both that contains
 * the view direction, which in an orthographic view is the plane standing
 * straight out of the screen. Holding Shift on the second point waits for a
 * third, and three points make an oblique plane through all of them.
 */

import type { BrushPlane, BrushVec3 } from '@zylem/bridge';
import { cleanNumber, cleanVec } from './level-draw';

/** Points closer than this are the same point. */
const SAME_POINT = 1e-6;

function sub(a: BrushVec3, b: BrushVec3): BrushVec3 {
	return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function cross(a: BrushVec3, b: BrushVec3): BrushVec3 {
	return {
		x: a.y * b.z - a.z * b.y,
		y: a.z * b.x - a.x * b.z,
		z: a.x * b.y - a.y * b.x,
	};
}

function planeThrough(point: BrushVec3, normal: BrushVec3): BrushPlane | null {
	const magnitude = Math.hypot(normal.x, normal.y, normal.z);
	if (magnitude < 1e-9) return null;
	const unit = cleanVec({
		x: normal.x / magnitude,
		y: normal.y / magnitude,
		z: normal.z / magnitude,
	});
	return {
		normal: unit,
		distance: cleanNumber(unit.x * point.x + unit.y * point.y + unit.z * point.z),
	};
}

function samePoint(a: BrushVec3, b: BrushVec3): boolean {
	return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < SAME_POINT;
}

/** The plane through `a` and `b` that contains `viewDirection`; `null` when the line runs along it. */
export function clipPlaneThroughLine(
	a: BrushVec3,
	b: BrushVec3,
	viewDirection: BrushVec3
): BrushPlane | null {
	const line = sub(b, a);
	const span = Math.hypot(line.x, line.y, line.z);
	const view = Math.hypot(viewDirection.x, viewDirection.y, viewDirection.z);
	if (span < SAME_POINT || view < 1e-9) return null;
	const normal = cross(line, viewDirection);
	if (Math.hypot(normal.x, normal.y, normal.z) < 1e-6 * span * view) return null;
	return planeThrough(a, normal);
}

/** The plane through three points; `null` when they are in a line. */
export function clipPlaneThroughPoints(
	a: BrushVec3,
	b: BrushVec3,
	c: BrushVec3
): BrushPlane | null {
	const ab = sub(b, a);
	const ac = sub(c, a);
	const normal = cross(ab, ac);
	const scale = Math.hypot(ab.x, ab.y, ab.z) * Math.hypot(ac.x, ac.y, ac.z);
	if (scale < 1e-12 || Math.hypot(normal.x, normal.y, normal.z) < 1e-6 * scale) return null;
	return planeThrough(a, normal);
}

export class LevelClipTool {
	private points: BrushVec3[] = [];

	/** Whether any point is down. */
	get active(): boolean {
		return this.points.length > 0;
	}

	get placed(): readonly BrushVec3[] {
		return this.points;
	}

	/**
	 * Place a point. A point that would make no plane is ignored.
	 *
	 * @param waitForThird Keep the second point and wait for a third (Shift).
	 * @returns The plane once the cut is complete, then the tool is empty again.
	 */
	click(point: BrushVec3, viewDirection: BrushVec3, waitForThird: boolean): BrushPlane | null {
		const [a, b] = this.points;
		if (!a) {
			this.points = [{ ...point }];
			return null;
		}
		if (this.points.some((placed) => samePoint(placed, point))) return null;
		if (!b) {
			if (waitForThird) {
				this.points.push({ ...point });
				return null;
			}
			const plane = clipPlaneThroughLine(a, point, viewDirection);
			if (plane) this.points = [];
			return plane;
		}
		const plane = clipPlaneThroughPoints(a, b, point);
		if (plane) this.points = [];
		return plane;
	}

	/** The plane a click at `point` would complete, for the preview. */
	preview(point: BrushVec3, viewDirection: BrushVec3): BrushPlane | null {
		const [a, b] = this.points;
		if (!a) return null;
		return b ? clipPlaneThroughPoints(a, b, point) : clipPlaneThroughLine(a, point, viewDirection);
	}

	cancel(): void {
		this.points = [];
	}
}
