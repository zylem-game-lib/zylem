import { describe, expect, it } from 'vitest';

import {
	CollisionBuilder,
	normalizeLockAxes,
} from '../../../src/lib/collision/collision-builder';
import { sphereCollision } from '../../../src/lib/entities/parts/collision-factories';

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

describe('normalizeLockAxes', () => {
	it('expands booleans to all-axes tuples and passes tuples through', () => {
		expect(normalizeLockAxes(undefined)).toBeUndefined();
		expect(normalizeLockAxes(true)).toEqual([true, true, true]);
		expect(normalizeLockAxes(false)).toEqual([false, false, false]);
		expect(normalizeLockAxes([false, false, true])).toEqual([false, false, true]);
	});
});

describe('spawn-time body options', () => {
	it('CollisionBuilder forwards gravityScale and locks into the body definition', () => {
		const builder = new CollisionBuilder();
		builder.withCollision({
			gravityScale: 0,
			lockRotations: true,
			lockTranslations: [false, false, true],
		});
		const [bodyDef] = builder.build({});

		expect(bodyDef.gravityScale).toBe(0);
		expect(bodyDef.lockRotation).toEqual([true, true, true]);
		expect(bodyDef.lockTranslation).toEqual([false, false, true]);
	});

	it('CollisionBuilder leaves lock fields undefined when unspecified', () => {
		const builder = new CollisionBuilder();
		const [bodyDef] = builder.build({});

		expect(bodyDef.gravityScale).toBe(1);
		expect(bodyDef.lockRotation).toBeUndefined();
		expect(bodyDef.lockTranslation).toBeUndefined();
	});

	it('collision factories forward gravityScale and locks into bodyDesc', () => {
		const component = sphereCollision({
			radius: 0.5,
			gravityScale: 0,
			lockRotations: true,
		});

		expect(component.bodyDesc.gravityScale).toBe(0);
		expect(component.bodyDesc.lockRotation).toEqual([true, true, true]);
		expect(component.bodyDesc.lockTranslation).toBeUndefined();
	});
});
