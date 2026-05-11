import { describe, expect, it } from 'vitest';

import { CollisionBuilder } from '../../../src/lib/collision/collision-builder';
import { inspectColliderDesc } from '../../../src/lib/physics/collider-desc-inspect';

describe('CollisionBuilder vector inputs', () => {
	it('normalizes tuple and object collision vectors', () => {
		const builder = new CollisionBuilder();
		const [, colliderDesc] = builder.build({
			size: { x: 4, y: 2, z: 6 },
			position: [1, 2],
		});

		const inspected = inspectColliderDesc(colliderDesc);
		expect(inspected.shape).toBe('cuboid');
		expect(inspected.dimensions).toEqual([2, 1, 3]);
		expect(inspected.translation).toEqual([1, 2, 0]);
	});
});
