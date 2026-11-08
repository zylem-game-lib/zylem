import { Scene, Vector3, type Object3D } from 'three';
import { describe, expect, it } from 'vitest';
import { frameForPlane } from '@zylem/bridge';
import { ConstructionGrid } from '../../../src/lib/debug/construction-grid';

function gridIn(scene: Scene): Object3D {
	const grid = scene.getObjectByName('__zylem_construction_grid__');
	if (!grid) throw new Error('grid is not in the scene');
	return grid;
}

describe('ConstructionGrid on a draw plane', () => {
	it('lies on the plane, on lines nearest the focus, and goes back to the ground', () => {
		const scene = new Scene();
		const grid = new ConstructionGrid();
		grid.addTo(scene);
		grid.setIncrement(0.25);
		const top = frameForPlane({ x: 0, y: 1, z: 0 }, 1);

		grid.setPlane(top, { x: 10.3, y: 1, z: -5.2 });
		const object = gridIn(scene);
		expect(object.position.x).toBeCloseTo(10, 9);
		expect(object.position.y).toBeCloseTo(1, 2);
		expect(object.position.y).toBeGreaterThan(1);
		expect(object.position.z).toBeCloseTo(-5, 9);

		grid.setPlane(null);
		expect(object.position.toArray()).toEqual([0, 0, 0]);
		expect(object.quaternion.toArray()).toEqual([0, 0, 0, 1]);
		grid.dispose();
	});

	it('turns the grid to face a wall, its X along the frame u', () => {
		const scene = new Scene();
		const grid = new ConstructionGrid();
		grid.addTo(scene);
		grid.setIncrement(1);
		const wall = frameForPlane({ x: 1, y: 0, z: 0 }, 2);

		grid.setPlane(wall, { x: 2, y: 3.4, z: 0.6 });
		const object = gridIn(scene);
		const normal = new Vector3(0, 1, 0).applyQuaternion(object.quaternion);
		const along = new Vector3(1, 0, 0).applyQuaternion(object.quaternion);
		expect(normal.x).toBeCloseTo(1, 9);
		expect(along.z).toBeCloseTo(wall.u.z, 9);
		expect(object.position.x).toBeCloseTo(2, 2);
		expect(object.position.y).toBeCloseTo(3, 9);
		expect(object.position.z).toBeCloseTo(1, 9);
		grid.dispose();
	});
});
