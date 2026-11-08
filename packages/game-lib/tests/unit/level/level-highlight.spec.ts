import { describe, expect, it } from 'vitest';
import { Line } from 'three';
import { faceHighlight } from '../../../src/lib/level/level-highlight';

describe('face highlight', () => {
	it('closes the outline with a Line, which the WebGPU renderer can draw', () => {
		const mark = faceHighlight(
			[
				{ x: 0, y: 0, z: 0 },
				{ x: 1, y: 0, z: 0 },
				{ x: 1, y: 0, z: 1 },
				{ x: 0, y: 0, z: 1 },
			],
			0xffb020,
			0.35,
		);
		const outline = mark?.children.find((child) => child instanceof Line);
		expect(outline).toBeInstanceOf(Line);
		const position = (outline as Line).geometry.getAttribute('position');
		expect(position.count).toBe(5);
		expect(position.getX(4)).toBe(position.getX(0));
		expect(position.getY(4)).toBe(position.getY(0));
		expect(position.getZ(4)).toBe(position.getZ(0));
	});
});
