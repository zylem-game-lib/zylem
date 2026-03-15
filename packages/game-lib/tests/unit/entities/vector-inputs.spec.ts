import { Vector2, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { createBox } from '../../../src/lib/entities/box';
import { createPlane } from '../../../src/lib/entities/plane';

describe('entity vector inputs', () => {
	it('merges partial entity vectors against per-field defaults', () => {
		const box = createBox({
			position: { y: 5 },
			size: { x: 2 },
		});

		expect(box.options.position).toBeInstanceOf(Vector3);
		expect((box.options.position as Vector3).toArray()).toEqual([0, 5, 0]);
		expect(box.options.size).toBeInstanceOf(Vector3);
		expect((box.options.size as Vector3).toArray()).toEqual([2, 1, 1]);
	});

	it('normalizes plane tile and repeat options from tuples and partial objects', () => {
		const plane = createPlane({
			tile: [12, 4],
			repeat: { x: 3 },
		});

		expect(plane.options.tile).toBeInstanceOf(Vector2);
		expect((plane.options.tile as Vector2).toArray()).toEqual([12, 4]);
		expect(plane.options.repeat).toBeInstanceOf(Vector2);
		expect((plane.options.repeat as Vector2).toArray()).toEqual([3, 1]);
	});
});
