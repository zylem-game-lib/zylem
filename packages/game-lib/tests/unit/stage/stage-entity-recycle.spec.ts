import { Scene, Vector3 } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createBox } from '../../../src/lib/entities/box';
import { StageEntityDelegate } from '../../../src/lib/stage/stage-entity-delegate';
import { StageEntityModelDelegate } from '../../../src/lib/stage/stage-entity-model-delegate';
import { StageLoadingDelegate } from '../../../src/lib/stage/stage-loading-delegate';

/** Minimal simulation stub satisfying `attach()`'s adapter lookup. */
const fakeSimulation = { adapter: {} } as any;

/**
 * World stub that tracks spawns and despawns, and models the one behavior the
 * recycle bin depends on: a body is created from `bodyDesc`, so its position
 * comes from wherever that definition points at spawn time.
 */
function createWorld() {
	const collisionMap = new Map<string, any>();
	const spawns: string[] = [];

	const addEntity = vi.fn((entity: any) => {
		const start = entity.bodyDesc?.position ?? [0, 0, 0];
		let position = { x: start[0], y: start[1], z: start[2] };
		let rotation = { x: 0, y: 0, z: 0, w: 1 };
		const desc = entity.bodyDesc?.rotation;
		if (desc) {
			rotation = { x: desc[0], y: desc[1], z: desc[2], w: desc[3] };
		}
		entity.physicsAttached = true;
		entity.body = {
			translation: () => position,
			setTranslation: (next: { x: number; y: number; z: number }) => {
				position = { ...next };
			},
			rotation: () => rotation,
			setRotation: (next: { x: number; y: number; z: number; w: number }) => {
				rotation = { ...next };
			},
			linvel: () => ({ x: 0, y: 0, z: 0 }),
			setLinvel: () => {},
			setAngvel: () => {},
			lockTranslations: () => {},
			lockRotations: () => {},
		};
		collisionMap.set(entity.uuid, entity);
		spawns.push(entity.uuid);
	});

	const destroyEntity = vi.fn((entity: any) => {
		collisionMap.delete(entity.uuid);
		entity.physicsAttached = false;
	});

	return {
		collisionMap,
		spawns,
		addEntity,
		destroyEntity,
		simulation: fakeSimulation,
	};
}

function createSceneStub() {
	const scene = new Scene();
	return {
		scene,
		addEntityGroup: vi.fn((entity: any) => {
			if (entity.group) scene.add(entity.group);
		}),
	};
}

async function createAttachedDelegate() {
	const delegate = new StageEntityDelegate(
		new StageLoadingDelegate(),
		new StageEntityModelDelegate(),
	);
	const scene = createSceneStub();
	const world = createWorld();

	delegate.attach({
		scene: scene as any,
		world: world as any,
		renderStrategy: null,
		camera: {} as any,
	});

	return { delegate, scene, world };
}

describe('StageEntityDelegate detach/restore', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('detaches an entity without destroying the instance', async () => {
		const { delegate, world } = await createAttachedDelegate();
		const entity = createBox({ position: new Vector3(1, 2, 3) });
		await delegate.spawnEntity(entity);
		const { uuid } = entity;

		expect(delegate.removeEntityByUuid(uuid)).toBe(true);

		// Gone from the stage, but still held for undo.
		expect(delegate.childrenMap.has(uuid)).toBe(false);
		expect(world.collisionMap.has(uuid)).toBe(false);
		expect(delegate.isDetached(uuid)).toBe(true);
	});

	it('restores the same instance under the same uuid', async () => {
		const { delegate } = await createAttachedDelegate();
		const entity = createBox({ position: new Vector3(1, 2, 3) });
		await delegate.spawnEntity(entity);
		const { uuid } = entity;

		delegate.detachEntity(uuid);
		expect(delegate.restoreEntity(uuid)).toBe(true);

		// Identity matters: every other entry in the undo stack refers to this
		// uuid, and the editor cannot rebuild the entity from a summary.
		expect(delegate.childrenMap.get(uuid)).toBe(entity);
		expect(entity.uuid).toBe(uuid);
		expect(delegate.isDetached(uuid)).toBe(false);
	});

	it('restores at the pose the entity was detached at', async () => {
		const { delegate } = await createAttachedDelegate();
		const entity = createBox({ position: new Vector3(0, 0, 0) });
		await delegate.spawnEntity(entity);

		entity.setPose({ position: { x: 4, y: 1.5, z: -2 } });
		const detachedAt = entity.getPose();

		delegate.detachEntity(entity.uuid);
		delegate.restoreEntity(entity.uuid);

		// Not the original spawn point: the body is recreated from `bodyDesc`,
		// which has to be repointed at where the entity actually was.
		const restored = entity.getPose();
		expect(restored?.position.x).toBeCloseTo(detachedAt!.position.x);
		expect(restored?.position.y).toBeCloseTo(detachedAt!.position.y);
		expect(restored?.position.z).toBeCloseTo(detachedAt!.position.z);
	});

	it('survives repeated detach/restore cycles', async () => {
		const { delegate } = await createAttachedDelegate();
		const entity = createBox({ position: new Vector3(0, 1, 0) });
		await delegate.spawnEntity(entity);
		const { uuid } = entity;

		for (let i = 0; i < 3; i += 1) {
			expect(delegate.detachEntity(uuid)).toBe(true);
			expect(delegate.restoreEntity(uuid)).toBe(true);
		}

		expect(delegate.childrenMap.get(uuid)).toBe(entity);
		expect(delegate.detachedMap.size).toBe(0);
	});

	it('re-adds the entity to the physics world on restore', async () => {
		const { delegate, world } = await createAttachedDelegate();
		const entity = createBox({ position: new Vector3(0, 1, 0) });
		await delegate.spawnEntity(entity);

		delegate.detachEntity(entity.uuid);
		delegate.restoreEntity(entity.uuid);

		expect(world.collisionMap.get(entity.uuid)).toBe(entity);
		expect(world.spawns.filter((uuid) => uuid === entity.uuid)).toHaveLength(2);
	});

	it('reports failure for an unknown uuid', async () => {
		const { delegate } = await createAttachedDelegate();
		expect(delegate.detachEntity('nope')).toBe(false);
		expect(delegate.restoreEntity('nope')).toBe(false);
	});

	it('cannot restore an entity that was never detached', async () => {
		const { delegate } = await createAttachedDelegate();
		const entity = createBox({});
		await delegate.spawnEntity(entity);

		expect(delegate.restoreEntity(entity.uuid)).toBe(false);
	});

	it('caps the recycle bin above the editor undo depth', async () => {
		const { delegate } = await createAttachedDelegate();

		// The bin holds 200, comfortably more than the editor's 100-entry
		// history, so a uuid still reachable from the stack stays restorable.
		for (let i = 0; i < 205; i += 1) {
			const entity = createBox({ position: new Vector3(i, 0, 0) });
			await delegate.spawnEntity(entity);
			delegate.detachEntity(entity.uuid);
		}

		expect(delegate.detachedMap.size).toBe(200);
	});

	it('evicts the oldest detachments first', async () => {
		const { delegate } = await createAttachedDelegate();
		const uuids: string[] = [];

		for (let i = 0; i < 202; i += 1) {
			const entity = createBox({ position: new Vector3(i, 0, 0) });
			await delegate.spawnEntity(entity);
			delegate.detachEntity(entity.uuid);
			uuids.push(entity.uuid);
		}

		expect(delegate.isDetached(uuids[0]!)).toBe(false);
		expect(delegate.isDetached(uuids[1]!)).toBe(false);
		expect(delegate.isDetached(uuids.at(-1)!)).toBe(true);
	});

	it('disposes detached entities when the stage is torn down', async () => {
		const { delegate } = await createAttachedDelegate();
		const entity = createBox({ position: new Vector3(0, 1, 0) });
		await delegate.spawnEntity(entity);
		delegate.detachEntity(entity.uuid);

		delegate.destroyAll();

		// Detachments are only meaningful within a stage; holding them past
		// teardown would leak their meshes and materials.
		expect(delegate.detachedMap.size).toBe(0);
	});
});
