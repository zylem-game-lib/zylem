import { createWorld } from 'bitecs';
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EntityAssetLoader } from '../../../src/lib/core/entity-asset-loader';
import { createActor } from '../../../src/lib/entities/actor';
import { createBox } from '../../../src/lib/entities/box';
import { StageEntityDelegate } from '../../../src/lib/stage/stage-entity-delegate';
import { StageEntityModelDelegate } from '../../../src/lib/stage/stage-entity-model-delegate';
import { StageLoadingDelegate } from '../../../src/lib/stage/stage-loading-delegate';

function createDeferredModel() {
	let resolve!: (value: { object: any }) => void;
	const promise = new Promise<{ object: any }>((res) => {
		resolve = res;
	});
	return { promise, resolve };
}

function flushPromises(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('StageEntityDelegate', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('adds spawned entities to the scene after setup has applied spawn transforms', async () => {
		const delegate = new StageEntityDelegate(
			new StageLoadingDelegate(),
			new StageEntityModelDelegate(),
		);
		const addedPositions: Array<{ x: number; y: number; z: number }> = [];
		const scene = {
			addEntityGroup: vi.fn((entity: any) => {
				addedPositions.push(entity.body.translation());
			}),
		};
		const world = {
			addEntity(entity: any) {
				let position = { x: 0, y: 0, z: 0 };
				entity.physicsAttached = true;
				entity.body = {
					translation: () => position,
					setTranslation: (next: { x: number; y: number; z: number }) => {
						position = { ...next };
					},
					rotation: () => ({ x: 0, y: 0, z: 0, w: 1 }),
					setRotation: () => {},
					linvel: () => ({ x: 0, y: 0, z: 0 }),
					setLinvel: () => {},
					setAngvel: () => {},
					lockTranslations: () => {},
					lockRotations: () => {},
				};
			},
		};

		delegate.attach({
			scene: scene as any,
			world: world as any,
			ecs: createWorld(),
			instanceManager: null,
			camera: {} as any,
		});

		const entity = createBox({
			position: new Vector3(0, 0, 0),
		});
		entity.onSetup(({ me }) => {
			me.setPosition(5, 6, 0);
		});

		await delegate.spawnEntity(entity);

		expect(scene.addEntityGroup).toHaveBeenCalledOnce();
		expect(addedPositions[0]).toEqual({ x: 5, y: 6, z: 0 });
	});

	it('attaches deferred actor physics after the model finishes loading', async () => {
		const modelDelegate = new StageEntityModelDelegate();
		const delegate = new StageEntityDelegate(
			new StageLoadingDelegate(),
			modelDelegate,
		);
		const pendingModel = createDeferredModel();
		vi.spyOn(EntityAssetLoader.prototype, 'loadFile')
			.mockImplementation(() => pendingModel.promise as Promise<any>);

		const addEntity = vi.fn((entity: any) => {
			let position = { x: 0, y: 0, z: 0 };
			entity.physicsAttached = true;
			entity.body = {
				translation: () => position,
				setTranslation: (next: { x: number; y: number; z: number }) => {
					position = { ...next };
				},
				rotation: () => ({ x: 0, y: 0, z: 0, w: 1 }),
				setRotation: () => {},
				linvel: () => ({ x: 0, y: 0, z: 0 }),
				setLinvel: () => {},
				setAngvel: () => {},
				lockTranslations: () => {},
				lockRotations: () => {},
			};
		});

		const scene = {
			addEntityGroup: vi.fn(),
		};
		modelDelegate.attach(
			scene as any,
			(entity) => delegate.handleLateModelReady(entity),
		);

		delegate.attach({
			scene: scene as any,
			world: { addEntity } as any,
			ecs: createWorld(),
			instanceManager: null,
			camera: {} as any,
		});

		const actor = createActor({
			models: ['mascot.fbx'],
			collision: { static: false },
			collisionShape: 'capsule',
		});

		await delegate.spawnEntity(actor);
		expect(addEntity).not.toHaveBeenCalled();

		pendingModel.resolve({
			object: new Group().add(
				new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial()),
			),
		});
		await flushPromises();

		expect(addEntity).toHaveBeenCalledTimes(1);
		modelDelegate.dispose();
	});

	it('reattaches physics when a reused entity still has a stale body reference', async () => {
		const delegate = new StageEntityDelegate(
			new StageLoadingDelegate(),
			new StageEntityModelDelegate(),
		);
		const addedPositions: Array<{ x: number; y: number; z: number }> = [];
		const scene = {
			addEntityGroup: vi.fn((entity: any) => {
				addedPositions.push(entity.body.translation());
			}),
		};
		const addEntity = vi.fn((entity: any) => {
			let position = { x: 2, y: 3, z: 4 };
			entity.physicsAttached = true;
			entity.body = {
				translation: () => position,
				setTranslation: (next: { x: number; y: number; z: number }) => {
					position = { ...next };
				},
				rotation: () => ({ x: 0, y: 0, z: 0, w: 1 }),
				setRotation: () => {},
				linvel: () => ({ x: 0, y: 0, z: 0 }),
				setLinvel: () => {},
				setAngvel: () => {},
				lockTranslations: () => {},
				lockRotations: () => {},
			};
		});

		delegate.attach({
			scene: scene as any,
			world: { addEntity } as any,
			ecs: createWorld(),
			instanceManager: null,
			camera: {} as any,
		});

		const entity = createBox({
			position: new Vector3(0, 0, 0),
		});
		entity.body = {
			translation: () => {
				throw new Error('stale body should not be used');
			},
		} as any;
		entity.physicsAttached = false;

		await delegate.spawnEntity(entity);

		expect(addEntity).toHaveBeenCalledOnce();
		expect(scene.addEntityGroup).toHaveBeenCalledOnce();
		expect(addedPositions[0]).toEqual({ x: 2, y: 3, z: 4 });
	});
});
