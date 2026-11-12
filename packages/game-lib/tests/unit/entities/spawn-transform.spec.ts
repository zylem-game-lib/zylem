import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Quaternion, Vector3 } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EntityAssetLoader } from '../../../src/lib/core/entity-asset-loader';
import { createActor } from '../../../src/lib/entities/actor';
import { createBox } from '../../../src/lib/entities/box';
import {
	applyLateSpawnTransform,
	applySpawnTransformOptions,
	type SpawnTransformEntity,
} from '../../../src/lib/entities/spawn-transform';
import { StageEntityDelegate } from '../../../src/lib/stage/stage-entity-delegate';
import { StageEntityModelDelegate } from '../../../src/lib/stage/stage-entity-model-delegate';
import { StageLoadingDelegate } from '../../../src/lib/stage/stage-loading-delegate';

const QUARTER_TURN_Y = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);

function asSpawnTransform(entity: unknown): SpawnTransformEntity {
	return entity as SpawnTransformEntity;
}

/** The body rotation an entity would spawn with, as a quaternion. */
function bodyRotation(entity: { bodyDesc: { rotation?: readonly number[] } | null }): Quaternion {
	const [x, y, z, w] = entity.bodyDesc?.rotation ?? [0, 0, 0, 1];
	return new Quaternion(x, y, z, w);
}

function boxHalfExtents(entity: { colliderDescs: Array<{ shape: unknown }> }): number[] {
	return (entity.colliderDescs[0]!.shape as { halfExtents: number[] }).halfExtents;
}

/** A world that records the definitions each body was spawned from. */
function recordingWorld() {
	const spawned: Array<{ rotation: readonly number[] | undefined; shapes: unknown[] }> = [];
	const addEntity = vi.fn((entity: any) => {
		spawned.push({
			rotation: entity.bodyDesc?.rotation,
			shapes: entity.colliderDescs.map((definition: { shape: unknown }) => definition.shape),
		});
		entity.physicsAttached = true;
		entity.body = {
			translation: () => ({ x: 0, y: 0, z: 0 }),
			setTranslation: () => {},
			rotation: () => ({ x: 0, y: 0, z: 0, w: 1 }),
			setRotation: () => {},
			linvel: () => ({ x: 0, y: 0, z: 0 }),
			setLinvel: () => {},
			setAngvel: () => {},
			lockTranslations: () => {},
			lockRotations: () => {},
		};
	});
	return { spawned, addEntity, simulation: { adapter: {} } };
}

function attachedDelegate(world: ReturnType<typeof recordingWorld>) {
	const modelDelegate = new StageEntityModelDelegate();
	const delegate = new StageEntityDelegate(new StageLoadingDelegate(), modelDelegate);
	const scene = { addEntityGroup: vi.fn() };
	modelDelegate.attach(scene as any, (entity) => delegate.handleLateModelReady(entity));
	delegate.attach({
		scene: scene as any,
		world: world as any,
		renderStrategy: null,
		camera: {} as any,
	});
	return { delegate, modelDelegate };
}

function flushPromises(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('applySpawnTransformOptions', () => {
	it('writes the rotation option to the body definition and the render object', () => {
		const box = createBox({ rotation: { x: 0, y: Math.PI / 2, z: 0 } });

		applySpawnTransformOptions(asSpawnTransform(box));

		expect(bodyRotation(box).angleTo(QUARTER_TURN_Y)).toBeCloseTo(0);
		expect(box.mesh!.quaternion.angleTo(QUARTER_TURN_Y)).toBeCloseTo(0);
	});

	it('fills in the axes a partial rotation leaves out', () => {
		const box = createBox({ rotation: { y: Math.PI / 2 } });

		applySpawnTransformOptions(asSpawnTransform(box));

		expect(bodyRotation(box).angleTo(QUARTER_TURN_Y)).toBeCloseTo(0);
	});

	it('sets the scale option on the entity and scales its collider', () => {
		const box = createBox({ size: new Vector3(1, 1, 1), scale: { x: 2, y: 3, z: 0.5 } });

		applySpawnTransformOptions(asSpawnTransform(box));

		expect(box.getScale()).toEqual({ x: 2, y: 3, z: 0.5 });
		expect(box.mesh!.scale.toArray()).toEqual([2, 3, 0.5]);
		expect(boxHalfExtents(box)).toEqual([1, 1.5, 0.25]);
	});

	it('does not compound the scale when an entity spawns twice', () => {
		const box = createBox({ size: new Vector3(1, 1, 1), scale: { x: 2, y: 2, z: 2 } });

		applySpawnTransformOptions(asSpawnTransform(box));
		applySpawnTransformOptions(asSpawnTransform(box));

		expect(boxHalfExtents(box)).toEqual([1, 1, 1]);
	});

	it('leaves an entity with neither option at its defaults', () => {
		const box = createBox({ size: new Vector3(1, 1, 1) });

		applySpawnTransformOptions(asSpawnTransform(box));

		expect(box.bodyDesc?.rotation).toBeUndefined();
		expect(box.mesh!.quaternion.angleTo(new Quaternion())).toBeCloseTo(0);
		expect(box.getScale()).toEqual({ x: 1, y: 1, z: 1 });
		expect(boxHalfExtents(box)).toEqual([0.5, 0.5, 0.5]);
		expect(box.colliderScaleDirty).toBe(false);
	});

	it('leaves the scale option alone when asked to', () => {
		const box = createBox({ size: new Vector3(1, 1, 1), scale: { x: 2, y: 2, z: 2 } });

		applySpawnTransformOptions(asSpawnTransform(box), { skipScale: true });

		expect(box.getScale()).toEqual({ x: 1, y: 1, z: 1 });
		expect(boxHalfExtents(box)).toEqual([0.5, 0.5, 0.5]);
	});
});

describe('applyLateSpawnTransform', () => {
	it('rotates a render object that did not exist at spawn', () => {
		const box = createBox({ rotation: { x: 0, y: Math.PI / 2, z: 0 } });
		const mesh = box.mesh!;
		box.mesh = undefined;
		applySpawnTransformOptions(asSpawnTransform(box));

		box.mesh = mesh;
		applyLateSpawnTransform(asSpawnTransform(box));

		expect(mesh.quaternion.angleTo(QUARTER_TURN_Y)).toBeCloseTo(0);
	});

	it('leaves a render object that was rotated at spawn as setup left it', () => {
		const box = createBox({ rotation: { x: 0, y: Math.PI / 2, z: 0 } });
		applySpawnTransformOptions(asSpawnTransform(box));
		const turnedInSetup = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), 1);
		box.mesh!.quaternion.copy(turnedInSetup);

		applyLateSpawnTransform(asSpawnTransform(box));

		expect(box.mesh!.quaternion.angleTo(turnedInSetup)).toBeCloseTo(0);
	});
});

describe('spawning with rotation and scale options', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('spawns the body rotated and with scaled colliders', async () => {
		const world = recordingWorld();
		const { delegate } = attachedDelegate(world);
		const box = createBox({
			size: new Vector3(1, 1, 1),
			rotation: { x: 0, y: Math.PI / 2, z: 0 },
			scale: { x: 2, y: 2, z: 2 },
		});

		await delegate.spawnEntity(box);

		// One spawn: the scale is in the definitions the body is built from,
		// not applied by respawning it afterwards.
		expect(world.addEntity).toHaveBeenCalledOnce();
		const [x, y, z, w] = world.spawned[0]!.rotation!;
		expect(new Quaternion(x, y, z, w).angleTo(QUARTER_TURN_Y)).toBeCloseTo(0);
		expect(world.spawned[0]!.shapes).toEqual([{ type: 'box', halfExtents: [1, 1, 1] }]);
	});

	it('does not scale an actor a second time, and rotates its group once the model loads', async () => {
		const world = recordingWorld();
		const { delegate, modelDelegate } = attachedDelegate(world);
		let resolveModel!: (value: { object: any }) => void;
		vi.spyOn(EntityAssetLoader.prototype, 'loadFile').mockImplementation(
			() =>
				new Promise<any>((resolve) => {
					resolveModel = resolve;
				}),
		);
		const actor = createActor({
			models: ['mascot.fbx'],
			collision: { static: false },
			collisionShape: 'capsule',
			scale: { x: 2, y: 2, z: 2 },
			rotation: { x: 0, y: Math.PI / 2, z: 0 },
		});

		await delegate.spawnEntity(actor);
		resolveModel({
			object: new Group().add(new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial())),
		});
		await flushPromises();

		// The actor applied its own `scale` to the group. `setScale` would have
		// multiplied the collision bounds it already sized from that option.
		expect(actor.group!.scale.toArray()).toEqual([2, 2, 2]);
		expect(actor.getScale()).toEqual({ x: 1, y: 1, z: 1 });
		expect(actor.colliderScaleDirty).toBe(false);
		expect(actor.group!.quaternion.angleTo(QUARTER_TURN_Y)).toBeCloseTo(0);
		const [x, y, z, w] = world.spawned[0]!.rotation!;
		expect(new Quaternion(x, y, z, w).angleTo(QUARTER_TURN_Y)).toBeCloseTo(0);
		modelDelegate.dispose();
	});
});
