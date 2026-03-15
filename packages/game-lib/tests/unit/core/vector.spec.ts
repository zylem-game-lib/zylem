import { Vector2, Vector3 as ThreeVector3 } from 'three';
import { Vector3 as RapierVector3 } from '@dimforge/rapier3d-compat';
import { describe, expect, it } from 'vitest';

import {
	VEC2_ONE,
	VEC3_ONE,
	VEC3_ZERO,
	normalizeVec2,
	normalizeVec3,
	toRapierVector3,
	toThreeVector2,
	toThreeVector3,
} from '../../../src/lib/core/vector';

describe('vector helpers', () => {
	it('normalizes partial vec3 objects and tuples with zero defaults', () => {
		expect(normalizeVec3({ y: 2 }, VEC3_ZERO)).toEqual({ x: 0, y: 2, z: 0 });
		expect(normalizeVec3([1, 2], VEC3_ZERO)).toEqual({ x: 1, y: 2, z: 0 });
	});

	it('applies one-default profiles when requested', () => {
		expect(normalizeVec2([5], VEC2_ONE)).toEqual({ x: 5, y: 1 });
		expect(normalizeVec3({ x: 4, z: 2 }, VEC3_ONE)).toEqual({
			x: 4,
			y: 1,
			z: 2,
		});
	});

	it('converts Three and Rapier vectors into concrete runtime vectors', () => {
		const three = toThreeVector3(new RapierVector3(1, 2, 3), VEC3_ZERO);
		const rapier = toRapierVector3(new ThreeVector3(4, 5, 6), VEC3_ZERO);
		const two = toThreeVector2(new Vector2(7, 8), VEC2_ONE);

		expect(three).toBeInstanceOf(ThreeVector3);
		expect(three.toArray()).toEqual([1, 2, 3]);
		expect(rapier).toBeInstanceOf(RapierVector3);
		expect(rapier).toMatchObject({ x: 4, y: 5, z: 6 });
		expect(two).toBeInstanceOf(Vector2);
		expect(two.toArray()).toEqual([7, 8]);
	});
});
