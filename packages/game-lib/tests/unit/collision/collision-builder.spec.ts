import { describe, expect, it } from 'vitest';

import { CollisionBuilder } from '../../../src/lib/collision/collision-builder';
import { serializeColliderDesc } from '../../../src/lib/physics/serialize-descriptors';

describe('CollisionBuilder vector inputs', () => {
	it('normalizes tuple and object collision vectors', () => {
		const builder = new CollisionBuilder();
		const [, colliderDesc] = builder.build({
			size: { x: 4, y: 2, z: 6 },
			position: [1, 2],
		});

		const serialized = serializeColliderDesc(colliderDesc);
		expect(serialized.shape).toBe('cuboid');
		expect(serialized.dimensions).toEqual([2, 1, 3]);
		expect(serialized.translation).toEqual([1, 2, 0]);
	});
});
