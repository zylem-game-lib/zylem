import { describe, expect, it, beforeAll, vi } from 'vitest';
import type { IWorld } from 'bitecs';
import RAPIER, {
	ColliderDesc,
	RigidBodyDesc,
} from '@dimforge/rapier3d-compat';
import {
	BoxGeometry,
	Mesh,
	MeshBasicMaterial,
} from 'three';

import { GameEntity } from '../../../src/lib/entities/entity';
import {
	Destructible3DBehavior,
	FractureOptions,
	type Destructible3DHandle,
} from '../../../src/lib/behaviors/destructible-3d';

function createBodySnapshot() {
	let translation = { x: 3, y: 4, z: 5 };
	let rotation = { x: 0, y: 0, z: 0, w: 1 };
	let linearVelocity = { x: 1, y: 2, z: 3 };
	let angularVelocity = { x: 0.1, y: 0.2, z: 0.3 };

	return {
		translation: () => ({ ...translation }),
		rotation: () => ({ ...rotation }),
		linvel: () => ({ ...linearVelocity }),
		angvel: () => ({ ...angularVelocity }),
		setTranslation: vi.fn((value: { x: number; y: number; z: number }) => {
			translation = { ...value };
		}),
		setRotation: vi.fn(
			(value: { x: number; y: number; z: number; w: number }) => {
				rotation = { ...value };
			},
		),
		setLinvel: vi.fn((value: { x: number; y: number; z: number }) => {
			linearVelocity = { ...value };
		}),
		setAngvel: vi.fn((value: { x: number; y: number; z: number }) => {
			angularVelocity = { ...value };
		}),
	};
}

describe('Destructible3DBehavior', () => {
	beforeAll(async () => {
		await RAPIER.init();
	});

	it('fractures and repairs a mesh while swapping colliders', () => {
		const entity = new GameEntity<any>();
		entity.name = 'crate';
		entity.mesh = new Mesh(
			new BoxGeometry(1, 1, 1),
			new MeshBasicMaterial(),
		);
		entity.bodyDesc = RigidBodyDesc.dynamic();
		const originalCollider = ColliderDesc.cuboid(0.5, 0.5, 0.5);
		entity.colliderDesc = originalCollider;
		entity.colliderDescs = [originalCollider];
		entity.physicsAttached = true;
		entity.body = createBodySnapshot() as any;

		const handle = entity.use(Destructible3DBehavior, {
			fractureOptions: new FractureOptions({
				fractureMethod: 'simple',
				fragmentCount: 4,
			}),
		}) as Destructible3DHandle;
		const ref = entity.getBehaviorRefs()[0];
		const replacementBodies: any[] = [];
		const world = {
			destroyEntity: vi.fn((target: GameEntity<any>) => {
				target.physicsAttached = false;
				target.body = null;
			}),
			addEntity: vi.fn((target: GameEntity<any>) => {
				target.physicsAttached = true;
				const body = createBodySnapshot();
				replacementBodies.push(body);
				target.body = body as any;
			}),
		};

		Destructible3DBehavior.systemFactory({
			world,
			scene: {},
			ecs: {} as IWorld,
			getBehaviorLinks: (key: symbol) =>
				key === Destructible3DBehavior.key
					? [{ entity, ref }]
					: [],
		});

		const fragments = handle.fracture();

		expect(handle.isFractured()).toBe(true);
		expect(fragments.length).toBeGreaterThan(1);
		expect(entity.group).toBeDefined();
		expect(entity.colliderDescs.length).toBe(fragments.length);
		expect(world.destroyEntity).toHaveBeenCalledTimes(1);
		expect(world.addEntity).toHaveBeenCalledTimes(1);
		expect(replacementBodies[0].setTranslation).toHaveBeenCalledWith(
			{ x: 3, y: 4, z: 5 },
			true,
		);

		handle.repair();

		expect(handle.isFractured()).toBe(false);
		expect(handle.getFragments()).toHaveLength(0);
		expect(entity.group).toBeUndefined();
		expect(entity.colliderDesc).toBe(originalCollider);
		expect(entity.colliderDescs).toEqual([originalCollider]);
		expect(world.destroyEntity).toHaveBeenCalledTimes(2);
		expect(world.addEntity).toHaveBeenCalledTimes(2);
	});
});
