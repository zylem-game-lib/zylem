import { beforeAll, describe, expect, it } from 'vitest';
import RAPIER, { ColliderDesc } from '@dimforge/rapier3d-compat';

import { serializeColliderDesc } from '../../../src/lib/physics/serialize-descriptors';
import { reconstructColliderDesc } from '../../../src/lib/physics/physics-worker';

describe('serializeColliderDesc', () => {
	beforeAll(async () => {
		await RAPIER.init();
	});

	it('preserves convex hull metadata for worker reconstruction', () => {
		const vertices = new Float32Array([
			-0.5, -0.5, -0.5,
			0.5, -0.5, -0.5,
			0.0, 0.5, -0.5,
			0.0, 0.0, 0.5,
		]);
		const collider = ColliderDesc.convexHull(vertices);
		expect(collider).not.toBeNull();

		(collider as any).__zylemShapeData = {
			shape: 'convexHull',
			vertices: Array.from(vertices),
		};
		collider!.setTranslation(1, 2, 3);

		const serialized = serializeColliderDesc(collider!);
		expect(serialized.shape).toBe('convexHull');
		expect(serialized.vertices).toEqual(Array.from(vertices));
		expect(serialized.translation).toEqual([1, 2, 3]);

		const rebuilt = reconstructColliderDesc(serialized);
		expect((rebuilt as any).__zylemShapeData).toEqual({
			shape: 'convexHull',
			vertices: Array.from(vertices),
		});
	});
});
