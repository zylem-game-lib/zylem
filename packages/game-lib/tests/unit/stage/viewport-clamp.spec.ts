import { Box3, Camera, OrthographicCamera, PerspectiveCamera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import {
	canClampToViewport,
	clampPointToViewport,
	clampScaleToViewport,
	isPointInViewport,
} from '../../../src/lib/stage/viewport-clamp';

/** A camera looking down -Z at the origin from 10 units back. */
function lookingAtOrigin(): PerspectiveCamera {
	const camera = new PerspectiveCamera(50, 1, 0.1, 100);
	camera.position.set(0, 0, 10);
	camera.lookAt(0, 0, 0);
	camera.updateMatrixWorld(true);
	return camera;
}

describe('canClampToViewport', () => {
	it('accepts the projecting camera types', () => {
		expect(canClampToViewport(lookingAtOrigin())).toBe(true);
		expect(canClampToViewport(new OrthographicCamera(-5, 5, 5, -5, 0.1, 100))).toBe(
			true,
		);
	});

	it('rejects a bare camera, whose identity projection would clamp everything', () => {
		expect(canClampToViewport(new Camera())).toBe(false);
		expect(canClampToViewport(null)).toBe(false);
	});
});

describe('isPointInViewport', () => {
	it('accepts a point at the centre of the view', () => {
		expect(isPointInViewport(new Vector3(0, 0, 0), lookingAtOrigin())).toBe(true);
	});

	it('rejects a point off the side of the view', () => {
		expect(isPointInViewport(new Vector3(40, 0, 0), lookingAtOrigin())).toBe(false);
	});

	it('rejects a point behind the camera', () => {
		// Off screen by depth rather than by angle, which a 2D-only test would
		// miss: an entity dragged toward the viewer passes through the near plane
		// while its projected x and y stay near the centre.
		expect(isPointInViewport(new Vector3(0, 0, 20), lookingAtOrigin())).toBe(false);
	});

	it('rejects a point past the far plane', () => {
		expect(isPointInViewport(new Vector3(0, 0, -200), lookingAtOrigin())).toBe(false);
	});

	it('honours a tighter margin', () => {
		const camera = lookingAtOrigin();
		const nearEdge = new Vector3(4, 0, 0);

		expect(isPointInViewport(nearEdge, camera, 0.95)).toBe(true);
		expect(isPointInViewport(nearEdge, camera, 0.2)).toBe(false);
	});
});

describe('clampPointToViewport', () => {
	it('passes a visible target through untouched', () => {
		const camera = lookingAtOrigin();
		const to = new Vector3(1, 0, 0);

		expect(clampPointToViewport(new Vector3(0, 0, 0), to, camera)).toEqual(to);
	});

	it('stops an overshooting drag at the edge of the view', () => {
		const camera = lookingAtOrigin();
		const clamped = clampPointToViewport(
			new Vector3(0, 0, 0),
			new Vector3(500, 0, 0),
			camera,
		);

		expect(isPointInViewport(clamped, camera)).toBe(true);
		// Still moved a long way toward the target, just not off screen.
		expect(clamped.x).toBeGreaterThan(1);
	});

	it('converges close to the boundary rather than barely moving', () => {
		const camera = lookingAtOrigin();
		const clamped = clampPointToViewport(
			new Vector3(0, 0, 0),
			new Vector3(500, 0, 0),
			camera,
		);

		// One step past the clamp must be off screen, which is what makes this a
		// boundary and not just some arbitrary shorter move.
		const past = clamped.clone().multiplyScalar(1.05);
		expect(isPointInViewport(past, camera)).toBe(false);
	});

	it('passes through when the start point is already off screen', () => {
		const camera = lookingAtOrigin();
		const to = new Vector3(600, 0, 0);

		// There is no visible anchor to retreat toward, so the clamp gets out of
		// the way instead of pinning the entity to an arbitrary point.
		expect(clampPointToViewport(new Vector3(500, 0, 0), to, camera)).toEqual(to);
	});

	it('does nothing for a camera that cannot project', () => {
		const to = new Vector3(500, 0, 0);
		expect(clampPointToViewport(new Vector3(0, 0, 0), to, new Camera())).toEqual(to);
		expect(clampPointToViewport(new Vector3(0, 0, 0), to, null)).toEqual(to);
	});

	it('returns a copy, leaving the caller vectors independent', () => {
		const to = new Vector3(1, 0, 0);
		const result = clampPointToViewport(new Vector3(0, 0, 0), to, lookingAtOrigin());

		result.x = 99;
		expect(to.x).toBe(1);
	});
});

describe('clampScaleToViewport', () => {
	const unitBox = () =>
		new Box3(new Vector3(-0.5, -0.5, -0.5), new Vector3(0.5, 0.5, 0.5));
	const origin = () => new Vector3(0, 0, 0);

	it('allows a growth that still fits the view', () => {
		const factor = new Vector3(2, 2, 2);
		const clamped = clampScaleToViewport(
			unitBox(),
			origin(),
			factor,
			lookingAtOrigin(),
		);

		expect(clamped.x).toBeCloseTo(2);
	});

	it('caps a growth that would overflow the view', () => {
		const camera = lookingAtOrigin();
		const clamped = clampScaleToViewport(
			unitBox(),
			origin(),
			new Vector3(400, 400, 400),
			camera,
		);

		expect(clamped.x).toBeLessThan(400);
		expect(clamped.x).toBeGreaterThan(1);
	});

	it('never blocks shrinking, even from a box larger than the view', () => {
		const huge = new Box3(new Vector3(-50, -50, -50), new Vector3(50, 50, 50));
		const clamped = clampScaleToViewport(
			huge,
			origin(),
			new Vector3(0.5, 0.5, 0.5),
			lookingAtOrigin(),
		);

		expect(clamped.x).toBeCloseTo(0.5);
	});

	it('caps per the tightest axis, keeping the growth proportional', () => {
		const camera = lookingAtOrigin();
		const clamped = clampScaleToViewport(
			unitBox(),
			origin(),
			new Vector3(400, 1, 1),
			camera,
		);

		// The Y and Z factors were already 1, so only X moves; the interpolation
		// must not push them away from 1.
		expect(clamped.y).toBeCloseTo(1);
		expect(clamped.z).toBeCloseTo(1);
		expect(clamped.x).toBeLessThan(400);
	});

	it('grows about the given centre, not the centre of the box', () => {
		const camera = lookingAtOrigin();
		// Geometry offset well to one side of its own origin, as a mesh with a
		// baked translation would be: scaling swings it outward, so it runs out of
		// room sooner than the same box centred on the origin.
		const offset = new Box3(new Vector3(2, -0.5, -0.5), new Vector3(3, 0.5, 0.5));

		const aboutOrigin = clampScaleToViewport(
			offset,
			origin(),
			new Vector3(400, 400, 400),
			camera,
		);
		const aboutBox = clampScaleToViewport(
			offset,
			new Vector3(2.5, 0, 0),
			new Vector3(400, 400, 400),
			camera,
		);

		expect(aboutOrigin.x).toBeLessThan(aboutBox.x);
	});

	it('passes the factor through for an empty box or a non-projecting camera', () => {
		const factor = new Vector3(400, 400, 400);
		expect(
			clampScaleToViewport(new Box3(), origin(), factor, lookingAtOrigin()),
		).toEqual(factor);
		expect(clampScaleToViewport(unitBox(), origin(), factor, new Camera())).toEqual(
			factor,
		);
	});
});
