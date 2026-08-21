/**
 * Pure transform math shared by the editor gizmo, the bridge adapter, and
 * their tests. No THREE scene state and no simulation access, so it can be
 * exercised in a plain node environment.
 */

import { Euler, Quaternion } from 'three';
import type { Vec3 } from './vector';

/** Quaternion as carried by the bridge and the wasm runtime. */
export interface Quat {
	x: number;
	y: number;
	z: number;
	w: number;
}

const _euler = new Euler();
const _quaternion = new Quaternion();

/** Convert Euler angles (radians, XYZ order) to a quaternion. */
export function eulerToQuaternion(rotation: Vec3): Quat {
	_euler.set(rotation.x, rotation.y, rotation.z, 'XYZ');
	_quaternion.setFromEuler(_euler);
	return {
		x: _quaternion.x,
		y: _quaternion.y,
		z: _quaternion.z,
		w: _quaternion.w,
	};
}

/** Convert a quaternion to Euler angles (radians, XYZ order). */
export function quaternionToEuler(rotation: Quat): Vec3 {
	_quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
	_euler.setFromQuaternion(_quaternion, 'XYZ');
	return { x: _euler.x, y: _euler.y, z: _euler.z };
}

/**
 * Snap a value onto an absolute lattice of `increment`-sized steps.
 *
 * Absolute rather than relative to where the drag started: the result is
 * always a multiple of the increment, so independently placed entities line up
 * with each other instead of each keeping its own arbitrary offset.
 */
export function snapToIncrement(value: number, increment: number): number {
	if (!Number.isFinite(increment) || increment <= 0) return value;
	return Math.round(value / increment) * increment;
}

/** {@link snapToIncrement} across all three components. */
export function snapVec3(value: Vec3, increment: number): Vec3 {
	return {
		x: snapToIncrement(value.x, increment),
		y: snapToIncrement(value.y, increment),
		z: snapToIncrement(value.z, increment),
	};
}

/**
 * Snap a scale, clamped away from zero.
 *
 * A snapped-to-zero axis would collapse the collider into a degenerate shape
 * that the physics runtime cannot solve, so the smallest representable scale
 * is one increment.
 */
export function snapScale(value: Vec3, increment: number): Vec3 {
	const snapAxis = (axis: number) => {
		const snapped = snapToIncrement(axis, increment);
		if (snapped !== 0) return snapped;
		return increment > 0 ? increment : axis;
	};
	return { x: snapAxis(value.x), y: snapAxis(value.y), z: snapAxis(value.z) };
}

/** Wrap an angle to `(-PI, PI]`. */
export function normalizeAngle(radians: number): number {
	const wrapped = radians % (Math.PI * 2);
	if (wrapped > Math.PI) return wrapped - Math.PI * 2;
	if (wrapped <= -Math.PI) return wrapped + Math.PI * 2;
	return wrapped;
}

/** Degrees to radians. */
export function degreesToRadians(degrees: number): number {
	return (degrees * Math.PI) / 180;
}

/** Radians to degrees. */
export function radiansToDegrees(radians: number): number {
	return (radians * 180) / Math.PI;
}
