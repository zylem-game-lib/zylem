import { describe, expect, it } from 'vitest';

import {
	degreesToRadians,
	eulerToQuaternion,
	normalizeAngle,
	quaternionToEuler,
	radiansToDegrees,
	snapScale,
	snapToIncrement,
	snapVec3,
} from '../../../src/lib/core/transform-math';

const TRANSLATE_SNAP = 0.25;
const ROTATE_SNAP = Math.PI / 12;
const SCALE_SNAP = 0.1;

describe('snapToIncrement', () => {
	it('snaps onto an absolute lattice, not relative to the input', () => {
		// 0.31 → 0.25 and 0.4 → 0.5: both land on multiples of the increment, so
		// two entities dragged from different offsets end up aligned.
		expect(snapToIncrement(0.31, TRANSLATE_SNAP)).toBeCloseTo(0.25);
		expect(snapToIncrement(0.4, TRANSLATE_SNAP)).toBeCloseTo(0.5);
		expect(snapToIncrement(1.13, TRANSLATE_SNAP)).toBeCloseTo(1.25);
	});

	it('snaps negative values symmetrically', () => {
		expect(snapToIncrement(-0.31, TRANSLATE_SNAP)).toBeCloseTo(-0.25);
		expect(snapToIncrement(-0.4, TRANSLATE_SNAP)).toBeCloseTo(-0.5);
	});

	it('leaves values untouched when the increment is unusable', () => {
		// Zero, negative, and NaN increments would otherwise snap everything onto
		// 0 or produce NaN; the value passes through instead.
		expect(snapToIncrement(1.234, 0)).toBe(1.234);
		expect(snapToIncrement(1.234, -1)).toBe(1.234);
		expect(snapToIncrement(1.234, Number.NaN)).toBe(1.234);
	});

	it('snaps 15-degree rotation steps', () => {
		expect(radiansToDegrees(snapToIncrement(degreesToRadians(20), ROTATE_SNAP))).toBeCloseTo(15);
		expect(radiansToDegrees(snapToIncrement(degreesToRadians(38), ROTATE_SNAP))).toBeCloseTo(45);
		expect(radiansToDegrees(snapToIncrement(degreesToRadians(7), ROTATE_SNAP))).toBeCloseTo(0);
	});
});

describe('snapVec3', () => {
	it('snaps each axis independently', () => {
		expect(snapVec3({ x: 0.3, y: 1.1, z: -0.6 }, TRANSLATE_SNAP)).toEqual({
			x: 0.25,
			y: 1,
			z: -0.5,
		});
	});
});

describe('snapScale', () => {
	it('snaps to the scale increment', () => {
		const snapped = snapScale({ x: 1.04, y: 2.17, z: 0.93 }, SCALE_SNAP);
		expect(snapped.x).toBeCloseTo(1);
		expect(snapped.y).toBeCloseTo(2.2);
		expect(snapped.z).toBeCloseTo(0.9);
	});

	it('clamps away from zero so colliders stay solvable', () => {
		// A zero axis collapses the collider into a degenerate shape, so the
		// smallest representable scale is one increment.
		const snapped = snapScale({ x: 0.02, y: -0.03, z: 0.049 }, SCALE_SNAP);
		expect(snapped.x).toBeCloseTo(SCALE_SNAP);
		expect(snapped.y).toBeCloseTo(SCALE_SNAP);
		expect(snapped.z).toBeCloseTo(SCALE_SNAP);
	});
});

describe('euler/quaternion round-trip', () => {
	it('preserves rotations away from gimbal lock', () => {
		const euler = { x: 0.3, y: -1.1, z: 0.7 };
		const round = quaternionToEuler(eulerToQuaternion(euler));
		expect(round.x).toBeCloseTo(euler.x);
		expect(round.y).toBeCloseTo(euler.y);
		expect(round.z).toBeCloseTo(euler.z);
	});

	it('produces a normalized quaternion', () => {
		const q = eulerToQuaternion({ x: 0.4, y: 1.2, z: -0.9 });
		const length = Math.hypot(q.x, q.y, q.z, q.w);
		expect(length).toBeCloseTo(1);
	});

	it('returns identity for no rotation', () => {
		expect(eulerToQuaternion({ x: 0, y: 0, z: 0 })).toEqual({ x: 0, y: 0, z: 0, w: 1 });
	});

	it('yields an equivalent orientation even where euler angles differ', () => {
		// At gimbal lock the euler values do not round-trip, but the orientation
		// they describe must — which is exactly why the bridge carries the
		// quaternion as authoritative.
		const euler = { x: Math.PI / 2, y: 0.6, z: 0.2 };
		const quaternion = eulerToQuaternion(euler);
		const reconstructed = eulerToQuaternion(quaternionToEuler(quaternion));
		const dot =
			quaternion.x * reconstructed.x
			+ quaternion.y * reconstructed.y
			+ quaternion.z * reconstructed.z
			+ quaternion.w * reconstructed.w;
		expect(Math.abs(dot)).toBeCloseTo(1);
	});
});

describe('normalizeAngle', () => {
	it('wraps to (-PI, PI]', () => {
		expect(normalizeAngle(0)).toBeCloseTo(0);
		expect(normalizeAngle(Math.PI)).toBeCloseTo(Math.PI);
		expect(normalizeAngle(Math.PI * 3)).toBeCloseTo(Math.PI);
		expect(normalizeAngle(Math.PI * 1.5)).toBeCloseTo(-Math.PI / 2);
		expect(normalizeAngle(-Math.PI * 2.5)).toBeCloseTo(-Math.PI / 2);
	});
});

describe('degree conversion', () => {
	it('round-trips', () => {
		expect(radiansToDegrees(degreesToRadians(15))).toBeCloseTo(15);
		expect(degreesToRadians(180)).toBeCloseTo(Math.PI);
	});
});
