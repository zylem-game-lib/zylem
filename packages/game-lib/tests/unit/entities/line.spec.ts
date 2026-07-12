import { Raycaster, Vector3 } from 'three';
import { describe, expect, it, vi } from 'vitest';

import {
	createLine,
	pickZylemLine,
	ZylemLine,
} from '../../../src/lib/entities/line';

describe('createLine', () => {
	it('throws when fewer than two points are provided', () => {
		expect(() => createLine({ points: [{ x: 0, y: 0, z: 0 }] })).toThrow(
			/at least two points/i,
		);
	});

	it('builds a Line2 object after create()', () => {
		const line = createLine({
			points: [
				{ x: 0, y: 0, z: 0 },
				{ x: 2, y: 0, z: 0 },
				{ x: 4, y: 0, z: 0 },
			],
			linewidth: 0.5,
			worldUnits: true,
		});

		line.create();

		const lineObject = line.getLineObject();
		expect(lineObject).not.toBeNull();
		expect(lineObject?.isLine2).toBe(true);
		expect(line.group?.children).toHaveLength(1);
	});

	it('updates geometry when setPoints is called', () => {
		const line = createLine({
			points: [
				{ x: 0, y: 0, z: 0 },
				{ x: 1, y: 0, z: 0 },
			],
		});
		line.create();

		line.setPoints([
			{ x: 0, y: 0, z: 0 },
			{ x: 3, y: 1, z: 0 },
			{ x: 6, y: 0, z: 0 },
		]);

		const geometry = line.getLineObject()?.geometry;
		expect(geometry?.attributes.instanceStart.count).toBe(2);
	});

	it('pickFromRaycaster returns a hit for a ray crossing the polyline', () => {
		const line = createLine({
			points: [
				{ x: 0, y: 0, z: 0 },
				{ x: 5, y: 0, z: 0 },
			],
			linewidth: 1,
			worldUnits: true,
			pickThreshold: 0.25,
		});
		line.create();

		const raycaster = new Raycaster();
		raycaster.set(new Vector3(2.5, 2, 0), new Vector3(0, -1, 0).normalize());

		const hit = pickZylemLine(raycaster, line);
		expect(hit).not.toBeNull();
		expect(hit?.pointOnLine.x).toBeCloseTo(2.5, 1);
		expect(hit?.pointOnLine.y).toBeCloseTo(0, 1);
		expect(hit?.faceIndex).toBe(0);
	});

	it('clone preserves polyline options', () => {
		const source = createLine({
			points: [
				{ x: 0, y: 0, z: 0 },
				{ x: 2, y: 1, z: 0 },
			],
			color: '#ff00aa',
			linewidth: 0.2,
		});

		const clone = source.clone();
		expect(clone).toBeInstanceOf(ZylemLine);
		expect(clone.options.points).toEqual(source.options.points);
		expect(clone.options.color).toBe('#ff00aa');
		expect(clone.options.linewidth).toBe(0.2);
	});

	it('disposes geometry and material on cleanup', () => {
		const line = createLine({
			points: [
				{ x: 0, y: 0, z: 0 },
				{ x: 1, y: 0, z: 0 },
			],
		});
		line.create();

		const lineObject = line.getLineObject();
		const geometry = lineObject?.geometry;
		const material = lineObject?.material;
		const geometryDispose = vi.spyOn(geometry!, 'dispose');
		const materialDispose = vi.spyOn(material as object, 'dispose');

		(line as any)._cleanup({ me: line, globals: {} });

		expect(geometryDispose).toHaveBeenCalled();
		expect(materialDispose).toHaveBeenCalled();
		expect(line.getLineObject()).toBeNull();
	});
});
