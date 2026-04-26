import { ColliderDesc } from '@dimforge/rapier3d-compat';
import { describe, expect, it, vi } from 'vitest';

import {
	GroundProbe3D,
	getGroundAnchorOffsetY,
	getGroundSnapTargetY,
} from '../../../src/lib/behaviors/shared/ground-probe-3d';

describe('GroundProbe3D', () => {
	it('reports a hit when the boxcast finds ground below', () => {
		const castShape = vi.fn(() => ({
			toi: 0.4,
			collider: { _parent: { userData: { uuid: 'ground' } } },
		}));
		const probe = new GroundProbe3D({ world: { castShape } });

		const entity = {
			uuid: 'player',
			body: {
				translation: () => ({ x: 0, y: 2, z: 0 }),
			},
		};

		expect(probe.detect(entity, { rayLength: 1 })).toBe(true);
		expect(castShape).toHaveBeenCalledTimes(1);
	});

	it('reports no hit when the boxcast returns null', () => {
		const probe = new GroundProbe3D({ world: { castShape: () => null } });

		const entity = {
			uuid: 'player',
			body: {
				translation: () => ({ x: 0, y: 2, z: 0 }),
			},
		};

		expect(probe.detect(entity, { rayLength: 1 })).toBe(false);
	});

	it('returns the contact toi and computes a snap target height', () => {
		const probe = new GroundProbe3D({
			world: {
				castShape: () => ({
					toi: 0.2,
					collider: { _parent: { userData: { uuid: 'near-ground' } } },
				}),
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
			box: { x: 0.5, y: 0.05, z: 0.5 },
		});

		expect(support?.toi).toBe(0.2);
		expect(support?.colliderUuid).toBe('near-ground');
		// point.y = shapePos.y - toi - box.y = 3 - 0.2 - 0.05 = 2.75
		expect(support?.point.y).toBeCloseTo(2.75);
		// snapTarget = point.y + groundAnchorOffsetY + epsilon = 2.75 + 0 + 0.001
		expect(getGroundSnapTargetY(entity, support!)).toBeCloseTo(2.751);
		expect(
			getGroundSnapTargetY({ controlledRotation: true }, support!),
		).toBeCloseTo(2.751);
	});

	it('passes the entity body as the rigid-body exclusion to castShape', () => {
		const castShape = vi.fn(() => null);
		const probe = new GroundProbe3D({ world: { castShape } });

		const body = { translation: () => ({ x: 0, y: 1, z: 0 }) };
		probe.detect({ uuid: 'p', body }, { rayLength: 1 });

		expect(castShape).toHaveBeenCalledTimes(1);
		const args = castShape.mock.calls[0];
		// Args: shapePos, shapeRot, shapeVel, shape, maxToi, stopAtPenetration,
		//       filterFlags, filterGroups, filterExcludeCollider, filterExcludeRigidBody
		expect(args[2]).toEqual({ x: 0, y: -1, z: 0 });
		expect(args[4]).toBe(1);
		expect(args[9]).toBe(body);
	});

	it('derives ground-anchor offsets from explicit collider centers', () => {
		expect(
			getGroundAnchorOffsetY({
				options: {
					collision: {
						size: { x: 0.8, y: 0.8, z: 0.8 },
						position: { x: 0, y: 0, z: 0 },
					},
				},
			}),
		).toBeCloseTo(0.4);

		expect(
			getGroundAnchorOffsetY({
				options: {
					collision: {
						size: { x: 2.9, y: 4.9, z: 0.1 },
						position: { x: 3.15, y: 3.25, z: 0 },
					},
				},
			}),
		).toBeCloseTo(-0.8);
	});

	it('derives ground-anchor offsets from runtime-generated collider descriptors', () => {
		const colliderDesc = ColliderDesc.capsule(1, 1.45);
		colliderDesc.setTranslation(3.15, 3.25, 0);

		expect(
			getGroundAnchorOffsetY({
				colliderDesc,
			}),
		).toBeCloseTo(-0.8);
	});

	it('creates a debug wireframe mesh only when debug output is enabled', () => {
		const scene = { add: vi.fn() };
		const probe = new GroundProbe3D({
			world: {
				castShape: () => ({
					toi: 0.5,
					collider: { _parent: { userData: { uuid: 'ground' } } },
				}),
			},
		});

		const entity = {
			uuid: 'debug-player',
			body: {
				translation: () => ({ x: 0, y: 1, z: 0 }),
			},
		};

		probe.detect(entity, { rayLength: 1, debug: true, scene });
		expect(scene.add).toHaveBeenCalledTimes(1);

		probe.detect(entity, { rayLength: 1, debug: false });
	});
});
