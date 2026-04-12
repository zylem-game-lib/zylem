import { describe, expect, it } from 'vitest';
import { FractureOptions } from '@dgreenheck/three-pinata';
import { BoxGeometry, BufferAttribute, BufferGeometry, Vector3 } from 'three';

import {
	bufferGeometryToPlain,
	pinataFractureOptionsToPlain,
	plainFractureOptionsToPinata,
	plainToBufferGeometry,
} from '../../../src/lib/behaviors/destructible-3d/destructible-prebake-payload';

describe('destructible-prebake-payload', () => {
	it('round-trips FractureOptions through plain JSON-shaped data', () => {
		const original = new FractureOptions({
			fractureMethod: 'voronoi',
			fragmentCount: 8,
			voronoiOptions: {
				mode: '3D',
				seedPoints: [new Vector3(0.1, -0.2, 0.3)],
				impactPoint: new Vector3(0.5, 0, -0.25),
				impactRadius: 0.4,
				projectionAxis: 'y',
				projectionNormal: new Vector3(0, 1, 0),
				useApproximation: true,
				approximationNeighborCount: 9,
			},
			seed: 42,
		});

		const plain = pinataFractureOptionsToPlain(original);
		const restored = plainFractureOptionsToPinata(plain);

		expect(restored.fractureMethod).toBe(original.fractureMethod);
		expect(restored.fragmentCount).toBe(original.fragmentCount);
		expect(restored.seed).toBe(original.seed);
		expect(restored.voronoiOptions?.mode).toBe(original.voronoiOptions?.mode);
		expect(restored.voronoiOptions?.impactRadius).toBe(
			original.voronoiOptions?.impactRadius,
		);
		expect(restored.voronoiOptions?.seedPoints?.[0]?.x).toBeCloseTo(0.1);
		expect(restored.voronoiOptions?.useApproximation).toBe(true);
		expect(restored.voronoiOptions?.approximationNeighborCount).toBe(9);
	});

	it('round-trips a non-indexed buffer geometry through plain buffers', () => {
		const source = new BoxGeometry(1, 1, 1);
		source.deleteAttribute('uv');
		const { payload, transferables } = bufferGeometryToPlain(source);
		expect(transferables.length).toBeGreaterThan(0);

		const rebuilt = plainToBufferGeometry(payload);
		const posIn = source.getAttribute('position') as BufferAttribute;
		const posOut = rebuilt.getAttribute('position') as BufferAttribute;
		expect(posOut.count).toBe(posIn.count);
		expect(posOut.array.byteLength).toBe(posIn.array.byteLength);
		rebuilt.dispose();
		source.dispose();
	});
});
