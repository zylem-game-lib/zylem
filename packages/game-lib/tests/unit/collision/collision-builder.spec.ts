import { describe, expect, it } from 'vitest';

import { CollisionBuilder } from '../../../src/lib/collision/collision-builder';

describe('CollisionBuilder vector inputs', () => {
	it('normalizes tuple and object collision vectors', () => {
		const builder = new CollisionBuilder();
		const [, colliderDef] = builder.build({
			size: { x: 4, y: 2, z: 6 },
			position: [1, 2],
		});

		expect(colliderDef.shape).toEqual({ type: 'box', halfExtents: [2, 1, 3] });
		expect(colliderDef.offset).toEqual([1, 2, 0]);
	});
});
