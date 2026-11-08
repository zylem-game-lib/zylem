import type { BrushVec3 } from './brush';

/** Distance under which two points or a point and a plane count as touching. */
export const EPS = 1e-5;

export const ZERO: BrushVec3 = Object.freeze({ x: 0, y: 0, z: 0 });

export function vec(x: number, y: number, z: number): BrushVec3 {
	return { x, y, z };
}

export function dot(a: BrushVec3, b: BrushVec3): number {
	return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function cross(a: BrushVec3, b: BrushVec3): BrushVec3 {
	return {
		x: a.y * b.z - a.z * b.y,
		y: a.z * b.x - a.x * b.z,
		z: a.x * b.y - a.y * b.x,
	};
}

export function sub(a: BrushVec3, b: BrushVec3): BrushVec3 {
	return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function add(a: BrushVec3, b: BrushVec3): BrushVec3 {
	return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function scale(a: BrushVec3, factor: number): BrushVec3 {
	return { x: a.x * factor, y: a.y * factor, z: a.z * factor };
}

export function length(a: BrushVec3): number {
	return Math.hypot(a.x, a.y, a.z);
}

export function normalize(a: BrushVec3): BrushVec3 | null {
	const magnitude = length(a);
	if (magnitude < EPS) return null;
	return scale(a, 1 / magnitude);
}

export function samePoint(a: BrushVec3, b: BrushVec3): boolean {
	return Math.abs(a.x - b.x) <= EPS && Math.abs(a.y - b.y) <= EPS && Math.abs(a.z - b.z) <= EPS;
}

export function copyVec(value: BrushVec3): BrushVec3 {
	return { x: value.x, y: value.y, z: value.z };
}

export function centroid(points: readonly BrushVec3[]): BrushVec3 {
	const sum = points.reduce((acc, point) => add(acc, point), { x: 0, y: 0, z: 0 });
	return scale(sum, 1 / points.length);
}

/** `v` turned by `angle` radians about the unit `axis` (right-handed). */
export function rotateVec(v: BrushVec3, axis: BrushVec3, angle: number): BrushVec3 {
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	const along = scale(axis, dot(axis, v) * (1 - cos));
	return add(add(scale(v, cos), scale(cross(axis, v), sin)), along);
}

/** Drop rounding residue such as `6e-17` (and `-0`) so axis-aligned values stay exact. */
export function cleanNumber(value: number): number {
	return Math.abs(value) < 1e-12 ? 0 : value;
}

export function cleanVec(v: BrushVec3): BrushVec3 {
	return { x: cleanNumber(v.x), y: cleanNumber(v.y), z: cleanNumber(v.z) };
}
