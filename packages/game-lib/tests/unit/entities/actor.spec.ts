import {
	AnimationClip,
	Bone,
	BoxGeometry,
	Group,
	Mesh,
	MeshStandardMaterial,
	Vector3,
	VectorKeyframeTrack,
} from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SimulationColliderDefinition } from '@zylem/behaviors/core';

import { EntityAssetLoader } from '../../../src/lib/core/entity-asset-loader';
import { createActor } from '../../../src/lib/entities/actor';
import { AnimationDelegate } from '../../../src/lib/entities/delegates/animation';

/**
 * Flatten a plain collider definition into the same shape/dimensions layout
 * the legacy Rapier `inspectColliderDesc` helper produced, so the assertions
 * below stay expressed in familiar terms.
 */
function inspectColliderDesc(def: SimulationColliderDefinition): {
	shape: string;
	dimensions: number[];
	translation?: number[];
	vertices?: ArrayLike<number>;
	indices?: ArrayLike<number>;
} {
	const shape = def.shape;
	const translation = def.offset ? [...def.offset] : [0, 0, 0];
	switch (shape.type) {
		case 'capsule':
			return { shape: 'capsule', dimensions: [shape.halfHeight, shape.radius], translation };
		case 'box':
			return { shape: 'cuboid', dimensions: [...shape.halfExtents], translation };
		case 'trimesh':
			return {
				shape: 'trimesh',
				dimensions: [],
				translation,
				vertices: shape.vertices,
				indices: shape.indices,
			};
		default:
			return { shape: shape.type, dimensions: [], translation };
	}
}

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

function createVisibleModelWithShiftedOrigin(): Group {
	const root = new Group();
	const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial());
	mesh.position.set(5, 2, 1);
	root.add(mesh);
	return root;
}

function createElevatedMeshModel(): Group {
	const root = new Group();
	const mesh = new Mesh(
		new BoxGeometry(1, 2, 1),
		new MeshStandardMaterial(),
	);
	mesh.position.set(0, 2, 0);
	root.add(mesh);
	return root;
}

function createRigWithHips(hipsY = 37): Group {
	const root = new Group();
	const hips = new Bone();
	hips.name = 'mixamorig:Hips';
	hips.position.y = hipsY;
	root.add(hips);
	root.add(new Mesh(new BoxGeometry(1, 2, 1), new MeshStandardMaterial()));
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
				: createVisibleModelWithShiftedOrigin(),
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

		const serialized = inspectColliderDesc(actor.colliderDesc!);
		expect(serialized.shape).toBe('capsule');
		expect(serialized.dimensions[0]).toBeCloseTo(0, 5);
		expect(serialized.dimensions[1]).toBeCloseTo(3.5, 5);
		expect(serialized.translation?.[0]).toBeCloseTo(10, 5);
		expect(serialized.translation?.[1]).toBeCloseTo(6, 5);
		expect(serialized.translation?.[2]).toBeCloseTo(4, 5);
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

		const serialized = inspectColliderDesc(actor.colliderDesc!);
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
				: createVisibleModelWithShiftedOrigin(),
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

		const serialized = inspectColliderDesc(actor.colliderDesc!);
		expect(serialized.shape).toBe('capsule');
		expect(serialized.dimensions[0]).toBeCloseTo(2, 5);
		expect(serialized.dimensions[1]).toBeCloseTo(1, 5);
		expect(serialized.translation).toEqual([0, 4, 0]);
	});

	it('aligns animated auto capsules to the visible model center when origins differ', async () => {
		vi.spyOn(EntityAssetLoader.prototype, 'loadFile').mockImplementation(async (file) => ({
			object: file === 'mascot-idle.fbx'
				? createModelWithOffsetMeshes()
				: createVisibleModelWithShiftedOrigin(),
		}));

		const actor = createActor({
			models: ['mascot.fbx'],
			animations: [{ key: 'idle', path: 'mascot-idle.fbx' }],
			scale: new Vector3(1, 1, 1),
			collision: { static: false },
			collisionShape: 'capsule',
		});

		await flushPromises();
		actor.synchronizeRuntimeCollider();

		const serialized = inspectColliderDesc(actor.colliderDesc!);
		expect(serialized.translation).toEqual([5, 2, 1]);
		expect(serialized.dimensions[1]).toBeCloseTo(1.75, 5);
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
		const firstCollider = inspectColliderDesc(actor.colliderDesc!);

		actor.group?.position.set(0, -12, 0);
		actor.nodeDestroy({ me: actor, globals: {} } as any);
		actor.create();
		await flushPromises();

		expect(actor.group?.position.y ?? 0).toBe(0);

		actor.synchronizeRuntimeCollider();
		const secondCollider = inspectColliderDesc(actor.colliderDesc!);
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

		const serialized = inspectColliderDesc(actor.colliderDesc!);
		expect(serialized.shape).toBe('cuboid');
		expect(serialized.dimensions[0]).toBeCloseTo(3.5, 5);
		expect(serialized.dimensions[1]).toBeCloseTo(3, 5);
		expect(serialized.dimensions[2]).toBeCloseTo(2, 5);
		expect(serialized.translation?.[0]).toBeCloseTo(2.5, 5);
		expect(serialized.translation?.[1]).toBeCloseTo(3, 5);
		expect(serialized.translation?.[2]).toBeCloseTo(0, 5);
	});

	it('builds static trimesh colliders with raw mesh geometry', async () => {
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

		const inspected = inspectColliderDesc(actor.colliderDesc!);
		expect(inspected.shape).toBe('trimesh');
		expect(inspected.vertices?.length ?? 0).toBeGreaterThan(0);
		expect(inspected.indices?.length ?? 0).toBeGreaterThan(0);
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

		const serialized = inspectColliderDesc(actor.colliderDesc!);
		expect(serialized.shape).toBe('cuboid');
		expect(warnSpy).toHaveBeenCalledTimes(1);
	});

	it('grounds elevated visual models to the group origin', async () => {
		vi.spyOn(EntityAssetLoader.prototype, 'loadFile').mockImplementation(async () => ({
			object: createElevatedMeshModel(),
		}));

		const actor = createActor({
			models: ['mascot.fbx'],
			scale: new Vector3(1, 1, 1),
			collision: { static: false },
			collisionShape: 'capsule',
		});

		await flushPromises();

		expect(actor.object?.position.y).toBeCloseTo(-1, 5);
	});

	it('grounds visual models after animations load', async () => {
		const clip = new AnimationClip('idle', 1, []);
		vi.spyOn(EntityAssetLoader.prototype, 'loadFile').mockImplementation(async () => ({
			object: createElevatedMeshModel(),
			animation: clip,
		}));

		const actor = createActor({
			models: ['mascot.fbx'],
			animations: [{ key: 'idle', path: 'mascot-walk.fbx' }],
			scale: new Vector3(1, 1, 1),
			collision: { static: false },
			collisionShape: 'capsule',
		});

		await flushPromises();

		expect(actor.object?.position.y).toBeCloseTo(-1, 5);
	});

	it('auto-enables stripRootMotionY when the model file matches any animation', async () => {
		const loadAnimations = vi.spyOn(AnimationDelegate.prototype, 'loadAnimations')
			.mockResolvedValue(undefined);
		vi.spyOn(EntityAssetLoader.prototype, 'loadFile').mockImplementation(async () => ({
			object: createRigWithHips(37),
			animation: new AnimationClip('idle', 1, []),
		}));

		createActor({
			models: ['idle.fbx'],
			animations: [
				{ key: 'idle', path: 'idle.fbx' },
				{ key: 'walk', path: 'walk.fbx' },
			],
			collision: { static: false },
			collisionShape: 'capsule',
		});

		await flushPromises();

		expect(loadAnimations).toHaveBeenCalledWith(
			[
				{ key: 'idle', path: 'idle.fbx' },
				{ key: 'walk', path: 'walk.fbx' },
			],
			{ stripRootMotionY: true, referenceAnimationPath: 'idle.fbx' },
		);
	});

	it('resolves referenceRootY from the model clip when stripping without an explicit value', async () => {
		const root = new Group();
		const hips = new Bone();
		hips.name = 'mixamorig:Hips';
		root.add(hips);

		const clipA = new AnimationClip('a', 1, [
			new VectorKeyframeTrack('mixamorig:Hips.position', [0, 1], [0, 90, 0, 0, 100, 0]),
		]);
		const clipB = new AnimationClip('b', 1, [
			new VectorKeyframeTrack('mixamorig:Hips.position', [0, 1], [0, 85, 0, 0, 95, 0]),
		]);

		vi.spyOn(EntityAssetLoader.prototype, 'loadFile')
			.mockResolvedValueOnce({ animation: clipA })
			.mockResolvedValueOnce({ animation: clipB });

		const delegate = new AnimationDelegate(root);
		await delegate.loadAnimations(
			[{ key: 'idle', path: 'a.fbx' }, { key: 'walk', path: 'b.fbx' }],
			{ stripRootMotionY: true, referenceAnimationPath: 'a.fbx' },
		);

		for (const clip of delegate.animations) {
			const track = clip.tracks.find((t) => t.name.endsWith('.position'));
			expect(track?.values[1]).toBe(90);
			expect(track?.values[4]).toBe(90);
		}
	});

	it('normalizes root Y across clips to explicit referenceRootY when stripping', async () => {
		const root = new Group();
		const hips = new Bone();
		hips.name = 'mixamorig:Hips';
		root.add(hips);

		const clipA = new AnimationClip('a', 1, [
			new VectorKeyframeTrack('mixamorig:Hips.position', [0, 1], [0, 90, 0, 0, 100, 0]),
		]);
		const clipB = new AnimationClip('b', 1, [
			new VectorKeyframeTrack('mixamorig:Hips.position', [0, 1], [0, 85, 0, 0, 95, 0]),
		]);

		vi.spyOn(EntityAssetLoader.prototype, 'loadFile')
			.mockResolvedValueOnce({ animation: clipA })
			.mockResolvedValueOnce({ animation: clipB });

		const delegate = new AnimationDelegate(root);
		await delegate.loadAnimations(
			[{ key: 'idle', path: 'a.fbx' }, { key: 'walk', path: 'b.fbx' }],
			{ stripRootMotionY: true, referenceRootY: 42 },
		);

		for (const clip of delegate.animations) {
			const track = clip.tracks.find((t) => t.name.endsWith('.position'));
			expect(track?.values[1]).toBe(42);
			expect(track?.values[4]).toBe(42);
		}
	});
});
