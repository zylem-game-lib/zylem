import { describe, expect, it, vi } from 'vitest';

import {
	GroundProbe3D,
	getGroundSnapTargetY,
} from '../../../src/lib/behaviors/shared/ground-probe-3d';

describe('GroundProbe3D', () => {
	it('supports center and any-hit grounding modes', () => {
		const probe = new GroundProbe3D({
			world: {
				castRay: (ray: any) => {
					if (Math.abs(ray.origin.x) > 0.1) {
						return {
							toi: 0.5,
							collider: { _parent: { userData: { uuid: 'ground' } } },
						};
					}
					return null;
				},
			},
		});

		const entity = {
			uuid: 'player',
			body: {
				translation: () => ({ x: 0, y: 2, z: 0 }),
			},
		};

		expect(
			probe.detect(entity, {
				rayLength: 1,
				offsets: [
					{ x: 0, z: 0 },
					{ x: 0.5, z: 0 },
					{ x: -0.5, z: 0 },
				],
				mode: 'center',
			}),
		).toBe(false);

		expect(
			probe.detect(entity, {
				rayLength: 1,
				offsets: [
					{ x: 0, z: 0 },
					{ x: 0.5, z: 0 },
					{ x: -0.5, z: 0 },
				],
				mode: 'any',
			}),
		).toBe(true);
	});

	it('returns the closest support hit and computes a snap target height', () => {
		const probe = new GroundProbe3D({
			world: {
				castRay: (ray: any) => {
					if (Math.abs(ray.origin.x) < 0.1) {
						return null;
					}
					if (ray.origin.x > 0) {
						return {
							toi: 0.6,
							collider: { _parent: { userData: { uuid: 'far-ground' } } },
						};
					}
					return {
						toi: 0.2,
						collider: { _parent: { userData: { uuid: 'near-ground' } } },
					};
				},
			},
		});

		const entity = {
			uuid: 'player',
			body: {
				translation: () => ({ x: 0, y: 3, z: 0 }),
			},
			options: {
				size: { x: 2, y: 2, z: 1 },
			},
		};

		const support = probe.probeSupport(entity, {
			rayLength: 1,
			offsets: [
				{ x: 0, z: 0 },
				{ x: 0.5, z: 0 },
				{ x: -0.5, z: 0 },
			],
			mode: 'any',
		});

		expect(support?.toi).toBe(0.2);
		expect(support?.colliderUuid).toBe('near-ground');
		expect(support?.point.y).toBeCloseTo(2.8);
		expect(getGroundSnapTargetY(entity, support!)).toBeCloseTo(3.801);
		expect(
			getGroundSnapTargetY(
				{ controlledRotation: true },
				support!,
			),
		).toBeCloseTo(2.801);
	});

	it('creates debug lines only when debug output is enabled', () => {
		const scene = { add: vi.fn() };
		const probe = new GroundProbe3D({
			world: {
				castRay: (_ray: any) => {
					return {
						toi: 0.5,
						collider: { _parent: { userData: { uuid: 'ground' } } },
					};
				},
			},
		});

		const entity = {
			uuid: 'debug-player',
			body: {
				translation: () => ({ x: 0, y: 1, z: 0 }),
			},
		};

		probe.detect(entity, { rayLength: 1, debug: true, scene });
		expect(scene.add).toHaveBeenCalled();

		probe.detect(entity, { rayLength: 1, debug: false });
	});
});
