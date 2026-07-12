import { describe, expect, it } from 'vitest';
import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera } from 'three';
import { frameObject, framingDistance, getObjectBounds } from '../../../src/lib/debug/frame-object';

describe('frame-object', () => {
	it('computes AABB bounds for a unit box', () => {
		const mesh = new Mesh(new BoxGeometry(2, 4, 6), new MeshBasicMaterial());
		const bounds = getObjectBounds(mesh);
		expect(bounds.width).toBeCloseTo(2, 5);
		expect(bounds.height).toBeCloseTo(4, 5);
		expect(bounds.depth).toBeCloseTo(6, 5);
		expect(bounds.maxDim).toBeCloseTo(6, 5);
	});

	it('frames a perspective camera to look at the object center', () => {
		const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
		mesh.position.set(10, 0, 0);
		mesh.updateMatrixWorld(true);

		const camera = new PerspectiveCamera(50, 1, 0.1, 100);
		const bounds = frameObject(mesh, camera);

		expect(bounds.center.x).toBeCloseTo(10, 4);
		expect(camera.position.x).toBeGreaterThan(10);
		expect(camera.position.y).toBeGreaterThan(0);
		expect(camera.position.z).toBeGreaterThan(0);

		const expected = framingDistance(bounds.maxDim, camera);
		const distance = camera.position.distanceTo(bounds.center);
		expect(distance).toBeCloseTo(expected * Math.sqrt(3), 4);
	});

	it('uses a positive framing distance', () => {
		const camera = new PerspectiveCamera(60, 1, 0.1, 100);
		expect(framingDistance(0, camera)).toBeGreaterThan(0);
		expect(framingDistance(2, camera)).toBeGreaterThan(1);
	});
});
