import { describe, expect, it, vi } from 'vitest';

import { GroundProbe3D } from '../../../src/lib/behaviors/shared/ground-probe-3d';

describe('GroundProbe3D', () => {
	it('supports center and any-hit grounding modes', () => {
		const probe = new GroundProbe3D({
			world: {
				castRay: (ray: any, ...rest: any[]) => {
					const callback = rest[rest.length - 1];
					if (Math.abs(ray.origin.x) > 0.1) {
						callback({ _parent: { userData: { uuid: 'ground' } } });
					}
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

	it('creates debug lines only when debug output is enabled', () => {
		const scene = { add: vi.fn() };
		const probe = new GroundProbe3D({
			world: {
				castRay: (_ray: any, ...rest: any[]) => {
					const callback = rest[rest.length - 1];
					callback({ _parent: { userData: { uuid: 'ground' } } });
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
