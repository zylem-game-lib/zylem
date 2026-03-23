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
	type Object3D,
} from 'three';

import { GameEntity } from '../../../src/lib/entities/entity';
import {
	Destructible3DBehavior,
	DestructibleMesh,
	FractureOptions,
	type Destructible3DHandle,
} from '../../../src/lib/behaviors/destructible-3d';

type PhysicsSeed = {
	translation?: { x: number; y: number; z: number };
	rotation?: { x: number; y: number; z: number; w: number };
	linearVelocity?: { x: number; y: number; z: number };
	angularVelocity?: { x: number; y: number; z: number };
};

function createBodySnapshot(seed: PhysicsSeed = {}) {
	let translation = seed.translation
		? { ...seed.translation }
		: { x: 3, y: 4, z: 5 };
	let rotation = seed.rotation
		? { ...seed.rotation }
		: { x: 0, y: 0, z: 0, w: 1 };
	let linearVelocity = seed.linearVelocity
		? { ...seed.linearVelocity }
		: { x: 1, y: 2, z: 3 };
	let angularVelocity = seed.angularVelocity
		? { ...seed.angularVelocity }
		: { x: 0.1, y: 0.2, z: 0.3 };

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

function createDestructibleEntity() {
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
	return {
		entity,
		originalCollider,
	};
}

function attachBehaviorRuntime(
	entity: GameEntity<any>,
) {
	const ref = entity.getBehaviorRefs()[0];
	const addedEntities: GameEntity<any>[] = [];
	const destroyedEntities: GameEntity<any>[] = [];
	const replacementBodies: Array<{ target: GameEntity<any>; body: any }> = [];
	const addedSceneObjects: Object3D[] = [];
	const removedSceneObjects: Object3D[] = [];

	const world = {
		interpolationAlpha: 0.25,
		destroyEntity: vi.fn((target: GameEntity<any>) => {
			destroyedEntities.push(target);
			target.physicsAttached = false;
			target.body = null;
		}),
		addEntity: vi.fn((target: GameEntity<any>) => {
			addedEntities.push(target);
			target.physicsAttached = true;

			const translation = ((target.bodyDesc as any)?.translation ?? {
				x: 0,
				y: 0,
				z: 0,
			}) as { x: number; y: number; z: number };
			const body = createBodySnapshot({
				translation,
			});
			replacementBodies.push({ target, body });
			target.body = body as any;
		}),
	};

	const scene = {
		scene: {
			add: vi.fn((object: Object3D) => {
				addedSceneObjects.push(object);
			}),
			remove: vi.fn((object: Object3D) => {
				removedSceneObjects.push(object);
			}),
		},
	};

	Destructible3DBehavior.systemFactory({
		world,
		scene,
		ecs: {} as IWorld,
		getBehaviorLinks: (key: symbol) =>
			key === Destructible3DBehavior.key
				? [{ entity, ref }]
				: [],
	});

	return {
		world,
		scene,
		addedEntities,
		destroyedEntities,
		replacementBodies,
		addedSceneObjects,
		removedSceneObjects,
	};
}

describe('Destructible3DBehavior', () => {
	beforeAll(async () => {
		await RAPIER.init();
	});

	it('fractures and repairs a mesh while swapping colliders in compound mode', () => {
		const { entity, originalCollider } = createDestructibleEntity();
		const handle = entity.use(Destructible3DBehavior, {
			fractureOptions: new FractureOptions({
				fractureMethod: 'simple',
				fragmentCount: 4,
			}),
		}) as Destructible3DHandle;
		const runtime = attachBehaviorRuntime(entity);

		const fragments = handle.fracture();

		expect(handle.isFractured()).toBe(true);
		expect(fragments.length).toBeGreaterThan(1);
		expect(entity.group).toBeDefined();
		expect(entity.colliderDescs.length).toBe(fragments.length);
		expect(runtime.world.destroyEntity).toHaveBeenCalledTimes(1);
		expect(runtime.world.addEntity).toHaveBeenCalledTimes(1);
		expect(runtime.replacementBodies[0]?.target).toBe(entity);
		expect(runtime.replacementBodies[0]?.body.setTranslation).toHaveBeenCalledWith(
			{ x: 3, y: 4, z: 5 },
			true,
		);

		handle.repair();

		expect(handle.isFractured()).toBe(false);
		expect(handle.getFragments()).toHaveLength(0);
		expect(entity.group).toBeUndefined();
		expect(entity.colliderDesc).toBe(originalCollider);
		expect(entity.colliderDescs).toEqual([originalCollider]);
		expect(runtime.world.destroyEntity).toHaveBeenCalledTimes(2);
		expect(runtime.world.addEntity).toHaveBeenCalledTimes(2);
	});

	it('spawns independent fragment entities and detaches the source body', () => {
		const { entity } = createDestructibleEntity();
		const handle = entity.use(Destructible3DBehavior, {
			fractureOptions: new FractureOptions({
				fractureMethod: 'simple',
				fragmentCount: 5,
			}),
			fragmentPhysics: {
				mode: 'independent',
			},
		}) as Destructible3DHandle;
		const runtime = attachBehaviorRuntime(entity);

		const fragments = handle.fracture();

		expect(handle.isFractured()).toBe(true);
		expect(fragments.length).toBeGreaterThan(1);
		expect(entity.physicsAttached).toBe(false);
		expect(entity.body).toBeNull();
		expect(entity.mesh?.visible).toBe(false);
		expect(runtime.world.destroyEntity).toHaveBeenCalledTimes(1);
		expect(runtime.world.addEntity).toHaveBeenCalledTimes(fragments.length);
		expect(runtime.addedEntities).toHaveLength(fragments.length);
		expect(runtime.addedSceneObjects).toHaveLength(fragments.length);
		expect(
			runtime.addedEntities.every((fragmentEntity) =>
				fragmentEntity !== entity
				&& Boolean(fragmentEntity.bodyDesc)
				&& Boolean(fragmentEntity.colliderDesc)
				&& Boolean(fragmentEntity.mesh)),
		).toBe(true);
	});

	it('repairs independent fragments by destroying runtime bodies and restoring the source', () => {
		const { entity, originalCollider } = createDestructibleEntity();
		const handle = entity.use(Destructible3DBehavior, {
			fractureOptions: new FractureOptions({
				fractureMethod: 'simple',
				fragmentCount: 5,
			}),
			fragmentPhysics: {
				mode: 'independent',
			},
		}) as Destructible3DHandle;
		const runtime = attachBehaviorRuntime(entity);

		const fragments = handle.fracture();
		const fragmentCount = fragments.length;

		handle.repair();

		expect(handle.isFractured()).toBe(false);
		expect(handle.getFragments()).toHaveLength(0);
		expect(entity.physicsAttached).toBe(true);
		expect(entity.body).not.toBeNull();
		expect(entity.mesh?.visible).toBe(true);
		expect(entity.colliderDesc).toBe(originalCollider);
		expect(entity.colliderDescs).toEqual([originalCollider]);
		expect(runtime.world.destroyEntity).toHaveBeenCalledTimes(1 + fragmentCount);
		expect(runtime.world.addEntity).toHaveBeenCalledTimes(fragmentCount + 1);
		expect(runtime.replacementBodies.at(-1)?.target).toBe(entity);
		expect(runtime.replacementBodies.at(-1)?.body.setTranslation).toHaveBeenCalledWith(
			{ x: 3, y: 4, z: 5 },
			true,
		);
	});

	it('applies inherited outward launch velocity and angular velocity in independent mode', () => {
		const { entity } = createDestructibleEntity();
		const handle = entity.use(Destructible3DBehavior, {
			fractureOptions: new FractureOptions({
				fractureMethod: 'simple',
				fragmentCount: 4,
			}),
			fragmentPhysics: {
				mode: 'independent',
				inheritSourceVelocity: true,
				outwardVelocity: 4,
				angularVelocity: 2,
			},
		}) as Destructible3DHandle;
		const runtime = attachBehaviorRuntime(entity);

		handle.fracture();

		const firstFragmentBody = runtime.replacementBodies[0]?.body;
		expect(firstFragmentBody?.setLinvel).toHaveBeenCalled();
		expect(firstFragmentBody?.setAngvel).toHaveBeenCalled();

		const linearVelocity = firstFragmentBody?.setLinvel.mock.calls[0]?.[0] as
			| { x: number; y: number; z: number }
			| undefined;
		const angularVelocity = firstFragmentBody?.setAngvel.mock.calls[0]?.[0] as
			| { x: number; y: number; z: number }
			| undefined;

		expect(linearVelocity).toBeDefined();
		expect(angularVelocity).toBeDefined();

		const inheritedDelta = Math.sqrt(
			(linearVelocity!.x - 1) ** 2
			+ (linearVelocity!.y - 2) ** 2
			+ (linearVelocity!.z - 3) ** 2,
		);
		const angularMagnitude = Math.sqrt(
			angularVelocity!.x ** 2
			+ angularVelocity!.y ** 2
			+ angularVelocity!.z ** 2,
		);

		expect(inheritedDelta).toBeGreaterThan(0.001);
		expect(angularMagnitude).toBeGreaterThan(0.001);
	});

	it('prebakes fragment templates and reuses them across impact overrides', () => {
		const fractureSpy = vi.spyOn(DestructibleMesh.prototype, 'fracture');
		const { entity } = createDestructibleEntity();
		const handle = entity.use(Destructible3DBehavior, {
			fractureOptions: new FractureOptions({
				fractureMethod: 'voronoi',
				fragmentCount: 6,
				voronoiOptions: {
					mode: '3D',
				},
				seed: 23,
			}),
			fragmentPhysics: {
				mode: 'independent',
			},
		}) as Destructible3DHandle;
		attachBehaviorRuntime(entity);

		handle.prebake();

		expect(handle.isFractured()).toBe(false);
		expect(handle.getFragments()).toHaveLength(0);
		expect(fractureSpy).toHaveBeenCalledTimes(1);

		handle.fracture({
			fractureMethod: 'voronoi',
			fragmentCount: 6,
			voronoiOptions: {
				mode: '3D',
				impactPoint: entity.mesh!.position.clone(),
				impactRadius: 0.45,
			},
			seed: 23,
		});
		expect(fractureSpy).toHaveBeenCalledTimes(1);

		handle.repair();
		handle.fracture({
			fractureMethod: 'voronoi',
			fragmentCount: 6,
			voronoiOptions: {
				mode: '3D',
				impactPoint: entity.mesh!.position.clone().set(0.2, 0.1, -0.15),
				impactRadius: 0.62,
			},
			seed: 23,
		});
		expect(fractureSpy).toHaveBeenCalledTimes(1);

		fractureSpy.mockRestore();
	});
});
