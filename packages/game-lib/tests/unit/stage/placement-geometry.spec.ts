import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import {
	computePlacementPose,
	resolvePlacementPoint,
	restPositionOnSurface,
	surfaceRestOffset,
} from '../../../src/lib/stage/placement-geometry';

function ray(origin: [number, number, number], direction: [number, number, number]) {
	return {
		origin: new Vector3(...origin),
		direction: new Vector3(...direction).normalize(),
	};
}

describe('resolvePlacementPoint', () => {
	it('uses the physics hit when the click lands on geometry', () => {
		const down = ray([0, 10, 0], [0, -1, 0]);
		const resolved = resolvePlacementPoint(down, {
			distance: 8,
			normal: [0, 1, 0],
		});

		expect(resolved?.position.y).toBeCloseTo(2);
		expect(resolved?.normal.toArray()).toEqual([0, 1, 0]);
	});

	it('carries the hit normal through, including sloped surfaces', () => {
		const normal: [number, number, number] = [0, 0.7071, 0.7071];
		const resolved = resolvePlacementPoint(ray([0, 5, 5], [0, -1, 0]), {
			distance: 1,
			normal,
		});

		expect(resolved?.normal.toArray()).toEqual(normal);
	});

	it('falls back to the y=0 plane when the click hits nothing', () => {
		// Clicking into empty sky is the normal case when building a scene from
		// nothing; before the fallback existed it did nothing at all.
		const resolved = resolvePlacementPoint(ray([2, 4, -3], [0, -1, 0]), null);

		expect(resolved?.position.x).toBeCloseTo(2);
		expect(resolved?.position.y).toBeCloseTo(0);
		expect(resolved?.position.z).toBeCloseTo(-3);
		expect(resolved?.normal.toArray()).toEqual([0, 1, 0]);
	});

	it('resolves an angled ray against the plane', () => {
		const resolved = resolvePlacementPoint(ray([0, 4, 0], [1, -1, 0]), null);

		// Descending one unit per unit travelled forward: from y=4 the plane is
		// met four units along X.
		expect(resolved?.position.x).toBeCloseTo(4);
		expect(resolved?.position.y).toBeCloseTo(0);
	});

	it('gives up on a ray parallel to the plane', () => {
		expect(resolvePlacementPoint(ray([0, 3, 0], [1, 0, 0]), null)).toBeNull();
	});

	it('gives up on a ray pointing away from the plane', () => {
		// Looking at the sky from above the plane: the intersection is behind the
		// camera, so placing there would drop the entity out of view.
		expect(resolvePlacementPoint(ray([0, 3, 0], [0, 1, 0]), null)).toBeNull();
	});

	it('resolves upward against the plane from below it', () => {
		const resolved = resolvePlacementPoint(ray([0, -3, 0], [0, 1, 0]), null);
		expect(resolved?.position.y).toBeCloseTo(0);
	});
});

describe('surfaceRestOffset', () => {
	it('lifts a cube by half its height on a floor', () => {
		expect(surfaceRestOffset(new Vector3(1, 1, 1), new Vector3(0, 1, 0))).toBeCloseTo(0.5);
	});

	it('measures the extent along the normal, not the largest axis', () => {
		// A wide, thin plate on the floor lifts by its thin axis.
		const plate = new Vector3(4, 0.2, 4);
		expect(surfaceRestOffset(plate, new Vector3(0, 1, 0))).toBeCloseTo(0.1);
		// Against a wall it lifts by its wide axis instead.
		expect(surfaceRestOffset(plate, new Vector3(1, 0, 0))).toBeCloseTo(2);
	});

	it('handles an unnormalized normal', () => {
		expect(surfaceRestOffset(new Vector3(2, 2, 2), new Vector3(0, 5, 0))).toBeCloseTo(1);
	});

	it('returns zero for a degenerate normal', () => {
		expect(surfaceRestOffset(new Vector3(1, 1, 1), new Vector3(0, 0, 0))).toBe(0);
	});
});

describe('restPositionOnSurface', () => {
	it('rests a cube on top of the point it was dropped at', () => {
		const rested = restPositionOnSurface(
			new Vector3(1, 0, 2),
			new Vector3(1, 1, 1),
			new Vector3(0, 1, 0),
		);
		expect(rested.toArray()).toEqual([1, 0.5, 2]);
	});

	it('pushes out along a wall normal', () => {
		const rested = restPositionOnSurface(
			new Vector3(0, 2, 0),
			new Vector3(1, 1, 1),
			new Vector3(-1, 0, 0),
		);
		expect(rested.x).toBeCloseTo(-0.5);
		expect(rested.y).toBeCloseTo(2);
	});

	it('leaves the point alone when there is no offset to apply', () => {
		const position = new Vector3(1, 2, 3);
		expect(restPositionOnSurface(position, new Vector3(1, 1, 1), new Vector3(0, 0, 0))).toEqual(
			position,
		);
	});
});

describe('computePlacementPose', () => {
	const SNAP_ON = { enabled: true, translate: 0.25 };
	const SNAP_OFF = { enabled: false, translate: 0.25 };
	const FLOOR_HIT = { distance: 8, normal: [0, 1, 0] as [number, number, number] };

	it('snaps the resolved point onto the translation lattice', () => {
		const pose = computePlacementPose(ray([1.13, 4, -0.31], [0, -1, 0]), null, SNAP_ON)!;

		expect(pose.position.x).toBeCloseTo(1.25);
		expect(pose.position.y).toBeCloseTo(0);
		expect(pose.position.z).toBeCloseTo(-0.25);
	});

	it('leaves the point unsnapped when snapping is off', () => {
		const pose = computePlacementPose(ray([1.13, 4, -0.31], [0, -1, 0]), null, SNAP_OFF)!;

		expect(pose.position.x).toBeCloseTo(1.13);
		expect(pose.position.z).toBeCloseTo(-0.31);
	});

	it('lifts the entity to rest on the surface once its size is known', () => {
		const pose = computePlacementPose(
			ray([0, 10, 0], [0, -1, 0]),
			FLOOR_HIT,
			SNAP_OFF,
			new Vector3(2, 2, 2),
		)!;

		// The hit is at y=2, and a two-unit cube sits a unit above it.
		expect(pose.position.y).toBeCloseTo(3);
	});

	it('reports the un-lifted point when no size is given', () => {
		const pose = computePlacementPose(ray([0, 10, 0], [0, -1, 0]), FLOOR_HIT, SNAP_OFF)!;

		expect(pose.position.y).toBeCloseTo(2);
	});

	it('gives up where the ray can never reach the plane', () => {
		expect(computePlacementPose(ray([0, 3, 0], [1, 0, 0]), null, SNAP_OFF)).toBeNull();
	});

	it('previews exactly where the click will put the entity', () => {
		// The reason this is one function. The ghost measures itself, so it gets
		// the lift up front; a real placement spawns at the un-lifted point and
		// is lifted afterwards, once its bounds exist. Both have to land on the
		// same spot or the preview is a lie.
		const size = new Vector3(1, 3, 1);
		const cursor = ray([1.13, 10, -0.31], [0.2, -1, 0.1]);

		for (const snap of [SNAP_ON, SNAP_OFF]) {
			for (const hit of [null, FLOOR_HIT]) {
				const preview = computePlacementPose(cursor, hit, snap, size)!;
				const spawn = computePlacementPose(cursor, hit, snap)!;
				const landed = restPositionOnSurface(spawn.position, size, spawn.normal);

				expect(preview.position.toArray()).toEqual(landed.toArray());
				expect(preview.normal.toArray()).toEqual(spawn.normal.toArray());
			}
		}
	});

	it('carries a sloped hit normal through to the lift direction', () => {
		const pose = computePlacementPose(
			ray([0, 10, 0], [0, -1, 0]),
			{ distance: 8, normal: [1, 0, 0] },
			SNAP_OFF,
			new Vector3(2, 2, 2),
		)!;

		// Dropped against a wall, the entity pushes out sideways rather than up.
		expect(pose.position.x).toBeCloseTo(1);
		expect(pose.position.y).toBeCloseTo(2);
	});
});
