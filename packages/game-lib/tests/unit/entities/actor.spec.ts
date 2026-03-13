import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EntityAssetLoader } from '../../../src/lib/core/entity-asset-loader';
import { createActor } from '../../../src/lib/entities/actor';
import { reconstructColliderDesc } from '../../../src/lib/physics/physics-worker';
import { serializeColliderDesc } from '../../../src/lib/physics/serialize-descriptors';

function createModelWithOffsetMeshes(): Group {
	const root = new Group();

	const left = new Mesh(
		new BoxGeometry(1, 2, 1),
		new MeshStandardMaterial(),
	);
	left.position.set(0, 1, 0);

	const right = new Mesh(
		new BoxGeometry(2, 1, 1),
		new MeshStandardMaterial(),
	);
	right.position.set(2, 0.5, 0);

	root.add(left, right);
	return root;
}

function createSingleMeshModel(): Group {
	const root = new Group();
	root.add(new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial()));
	return root;
}

function flushPromises(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

describe('ZylemActor', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('builds capsule colliders from the first animation asset when animations exist', async () => {
		vi.spyOn(EntityAssetLoader.prototype, 'loadFile').mockImplementation(async (file) => ({
			object: file === 'mascot-idle.fbx'
				? createModelWithOffsetMeshes()
				: createSingleMeshModel(),
		}));

		const actor = createActor({
			models: ['mascot.fbx'],
			animations: [{ key: 'idle', path: 'mascot-idle.fbx' }],
			scale: new Vector3(2, 3, 4),
			collision: { static: false },
			collisionShape: 'capsule',
		});

		await flushPromises();

		actor.group?.position.set(25, -14, 8);
		actor.synchronizeRuntimeCollider();

		const serialized = serializeColliderDesc(actor.colliderDesc!);
		expect(serialized.shape).toBe('capsule');
		expect(serialized.dimensions[0]).toBeCloseTo(0, 5);
		expect(serialized.dimensions[1]).toBeCloseTo(3.5, 5);
		expect(serialized.translation?.[0]).toBeCloseTo(2.5, 5);
		expect(serialized.translation?.[1]).toBeCloseTo(3, 5);
		expect(serialized.translation?.[2]).toBeCloseTo(0, 5);
	});

	it('falls back to the model asset for capsule sizing when no animations exist', async () => {
		vi.spyOn(EntityAssetLoader.prototype, 'loadFile').mockImplementation(async () => ({
			object: createModelWithOffsetMeshes(),
		}));

		const actor = createActor({
			models: ['prop.gltf'],
			scale: new Vector3(1, 1, 1),
			collision: { static: false },
			collisionShape: 'capsule',
		});

		await flushPromises();
		actor.synchronizeRuntimeCollider();

		const serialized = serializeColliderDesc(actor.colliderDesc!);
		expect(serialized.shape).toBe('capsule');
		expect(serialized.dimensions[0]).toBeCloseTo(0, 5);
		expect(serialized.dimensions[1]).toBeCloseTo(1.75, 5);
		expect(serialized.translation?.[0]).toBeCloseTo(1.25, 5);
		expect(serialized.translation?.[1]).toBeCloseTo(1, 5);
		expect(serialized.translation?.[2]).toBeCloseTo(0, 5);
	});

	it('honors explicit capsule size and position overrides', async () => {
		vi.spyOn(EntityAssetLoader.prototype, 'loadFile').mockImplementation(async (file) => ({
			object: file === 'mascot-idle.fbx'
				? createModelWithOffsetMeshes()
				: createSingleMeshModel(),
		}));

		const actor = createActor({
			models: ['mascot.fbx'],
			animations: [{ key: 'idle', path: 'mascot-idle.fbx' }],
			collision: {
				static: false,
				size: new Vector3(2, 6, 2),
				position: new Vector3(0, 4, 0),
			},
			collisionShape: 'capsule',
		});

		await flushPromises();
		actor.synchronizeRuntimeCollider();

		const serialized = serializeColliderDesc(actor.colliderDesc!);
		expect(serialized.shape).toBe('capsule');
		expect(serialized.dimensions[0]).toBeCloseTo(2, 5);
		expect(serialized.dimensions[1]).toBeCloseTo(1, 5);
		expect(serialized.translation).toEqual([0, 4, 0]);
	});

	it('ignores stale load completions after the actor is destroyed and re-created', async () => {
		const firstLoad = deferred<{ object: Group }>();
		const secondLoad = deferred<{ object: Group }>();
		const loadSpy = vi.spyOn(EntityAssetLoader.prototype, 'loadFile')
			.mockImplementationOnce(() => firstLoad.promise)
			.mockImplementationOnce(() => secondLoad.promise);

		const actor = createActor({
			models: ['mascot.fbx'],
			collision: { static: false },
			collisionShape: 'bounds',
		});

		actor.nodeDestroy({ me: actor, globals: {} } as any);
		actor.create();

		const freshModel = createSingleMeshModel();
		secondLoad.resolve({ object: freshModel });
		await flushPromises();

		expect(loadSpy).toHaveBeenCalledTimes(2);
		expect(actor.object).toBe(freshModel);

		firstLoad.resolve({ object: createModelWithOffsetMeshes() });
		await flushPromises();

		expect(actor.object).toBe(freshModel);
	});

	it('resets render state across reloads on the same actor instance', async () => {
		vi.spyOn(EntityAssetLoader.prototype, 'loadFile').mockImplementation(async () => ({
			object: createModelWithOffsetMeshes(),
		}));

		const actor = createActor({
			models: ['mascot.fbx'],
			scale: new Vector3(1, 1, 1),
			collision: { static: false },
			collisionShape: 'capsule',
		});

		await flushPromises();
		actor.synchronizeRuntimeCollider();
		const firstCollider = serializeColliderDesc(actor.colliderDesc!);

		actor.group?.position.set(0, -12, 0);
		actor.nodeDestroy({ me: actor, globals: {} } as any);
		actor.create();
		await flushPromises();

		expect(actor.group?.position.y ?? 0).toBe(0);

		actor.synchronizeRuntimeCollider();
		const secondCollider = serializeColliderDesc(actor.colliderDesc!);
		expect(secondCollider.translation).toEqual(firstCollider.translation);
		expect(secondCollider.dimensions).toEqual(firstCollider.dimensions);
	});

	it('keeps explicit bounds colliders available as an opt-in shape', async () => {
		vi.spyOn(EntityAssetLoader.prototype, 'loadFile').mockImplementation(async () => ({
			object: createModelWithOffsetMeshes(),
		}));

		const actor = createActor({
			models: ['mascot.fbx'],
			scale: new Vector3(2, 3, 4),
			collision: { static: false },
			collisionShape: 'bounds',
		});

		await flushPromises();
		actor.group?.position.set(25, -14, 8);
		actor.synchronizeRuntimeCollider();

		const serialized = serializeColliderDesc(actor.colliderDesc!);
		expect(serialized.shape).toBe('cuboid');
		expect(serialized.dimensions[0]).toBeCloseTo(3.5, 5);
		expect(serialized.dimensions[1]).toBeCloseTo(3, 5);
		expect(serialized.dimensions[2]).toBeCloseTo(2, 5);
		expect(serialized.translation?.[0]).toBeCloseTo(2.5, 5);
		expect(serialized.translation?.[1]).toBeCloseTo(3, 5);
		expect(serialized.translation?.[2]).toBeCloseTo(0, 5);
	});

	it('serializes and reconstructs static trimesh colliders', async () => {
		vi.spyOn(EntityAssetLoader.prototype, 'loadFile').mockImplementation(async () => ({
			object: createSingleMeshModel(),
		}));

		const actor = createActor({
			models: ['prop.gltf'],
			collision: { static: true },
			collisionShape: 'trimesh',
		});

		await flushPromises();
		actor.synchronizeRuntimeCollider();

		const serialized = serializeColliderDesc(actor.colliderDesc!);
		expect(serialized.shape).toBe('trimesh');
		expect(serialized.vertices?.length ?? 0).toBeGreaterThan(0);
		expect(serialized.indices?.length ?? 0).toBeGreaterThan(0);

		const reconstructed = reconstructColliderDesc(serialized);
		const roundTrip = serializeColliderDesc(reconstructed);

		expect(roundTrip.shape).toBe('trimesh');
		expect(roundTrip.vertices).toEqual(serialized.vertices);
		expect(roundTrip.indices).toEqual(serialized.indices);
	});

	it('downgrades dynamic trimesh requests to bounds and warns once', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		vi.spyOn(EntityAssetLoader.prototype, 'loadFile').mockImplementation(async () => ({
			object: createSingleMeshModel(),
		}));

		const actor = createActor({
			models: ['mascot.fbx'],
			collision: { static: false },
			collisionShape: 'trimesh',
		});

		await flushPromises();
		actor.synchronizeRuntimeCollider();
		actor.synchronizeRuntimeCollider();

		const serialized = serializeColliderDesc(actor.colliderDesc!);
		expect(serialized.shape).toBe('cuboid');
		expect(warnSpy).toHaveBeenCalledTimes(1);
	});
});
