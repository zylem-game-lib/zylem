import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Scene, Vector3 } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
	Destructible3DBehavior,
	type Destructible3DHandle,
	FractureOptions,
} from '@zylem/behaviors/destructible-3d';
import { EntityAssetLoader } from '../../../src/lib/core/entity-asset-loader';
import { createActor } from '../../../src/lib/entities/actor';
import { createBox } from '../../../src/lib/entities/box';
import { RenderStrategyManager } from '../../../src/lib/graphics/render-strategy-manager';
import { StageEntityDelegate } from '../../../src/lib/stage/stage-entity-delegate';
import { StageEntityModelDelegate } from '../../../src/lib/stage/stage-entity-model-delegate';
import { StageLoadingDelegate } from '../../../src/lib/stage/stage-loading-delegate';

/** Minimal simulation stub satisfying `attach()`'s adapter lookup. */
const fakeSimulation = { adapter: {} } as any;

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
			world: { ...world, simulation: fakeSimulation } as any,
			renderStrategy: null,
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
			world: { addEntity, simulation: fakeSimulation } as any,
			renderStrategy: null,
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
			world: { addEntity, simulation: fakeSimulation } as any,
			renderStrategy: null,
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

	it('attaches new behavior links before setup callbacks on existing systems', async () => {
		const delegate = new StageEntityDelegate(
			new StageLoadingDelegate(),
			new StageEntityModelDelegate(),
		);
		const scene = {
			addEntityGroup: vi.fn(),
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
					angvel: () => ({ x: 0, y: 0, z: 0 }),
					setAngvel: () => {},
					lockTranslations: () => {},
					lockRotations: () => {},
				};
			},
			destroyEntity(entity: any) {
				entity.physicsAttached = false;
				entity.body = null;
			},
		};

		delegate.attach({
			scene: scene as any,
			world: { ...world, simulation: fakeSimulation } as any,
			renderStrategy: null,
			camera: {} as any,
		});

		const first = createBox({ name: 'first-destructible-box' });
		first.use(Destructible3DBehavior, {
			fractureOptions: new FractureOptions({
				fractureMethod: 'simple',
				fragmentCount: 4,
			}),
		});
		await delegate.spawnEntity(first);

		const second = createBox({ name: 'second-destructible-box' });
		const secondHandle = second.use(Destructible3DBehavior, {
			fractureOptions: new FractureOptions({
				fractureMethod: 'simple',
				fragmentCount: 4,
			}),
		}) as Destructible3DHandle;
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		second.onSetup(() => {
			secondHandle.prebake();
		});

		await expect(delegate.spawnEntity(second)).resolves.toBeUndefined();
		expect(warnSpy).not.toHaveBeenCalled();
		expect(secondHandle.isFractured()).toBe(false);
		expect(secondHandle.getFragments()).toHaveLength(0);
	});

	it('registers pack entities with render strategy and skips scene add', async () => {
		const modelDelegate = new StageEntityModelDelegate();
		const onEntityReady = vi.fn();
		const delegate = new StageEntityDelegate(
			new StageLoadingDelegate(),
			modelDelegate,
		);
		const scene = new Scene();
		const renderStrategy = new RenderStrategyManager();
		renderStrategy.setScene(scene);
		const addEntityGroup = vi.fn();
		const world = {
			addEntity(entity: any) {
				entity.physicsAttached = true;
				entity.body = {
					translation: () => ({ x: 0, y: 0, z: 0 }),
					rotation: () => ({ x: 0, y: 0, z: 0, w: 1 }),
				};
			},
		};

		modelDelegate.attach(
			{ addEntityGroup, scene } as any,
			(entity) => {
				onEntityReady(entity);
				delegate.handleLateModelReady(entity);
			},
		);

		delegate.attach({
			scene: { addEntityGroup, scene } as any,
			world: { ...world, simulation: fakeSimulation } as any,
			renderStrategy,
			camera: {} as any,
		});

		const entity = createBox({ category: 'pack' });
		await delegate.spawnEntity(entity);

		expect(entity.isInstanced).toBe(true);
		expect(addEntityGroup).not.toHaveBeenCalled();
		expect(onEntityReady).not.toHaveBeenCalled();
	});

	it('registers environment entities into bundles and forces static collision', async () => {
		const delegate = new StageEntityDelegate(
			new StageLoadingDelegate(),
			new StageEntityModelDelegate(),
		);
		const scene = new Scene();
		const renderStrategy = new RenderStrategyManager();
		renderStrategy.setScene(scene);
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const addEntityGroup = vi.fn();
		const world = {
			addEntity(entity: any) {
				entity.physicsAttached = true;
				entity.body = {
					translation: () => ({ x: 0, y: 0, z: 0 }),
					rotation: () => ({ x: 0, y: 0, z: 0, w: 1 }),
				};
			},
		};

		delegate.attach({
			scene: { addEntityGroup, scene } as any,
			world: { ...world, simulation: fakeSimulation } as any,
			renderStrategy,
			camera: {} as any,
		});

		const entity = createBox({ category: 'environment' });
		await delegate.spawnEntity(entity);

		expect(warnSpy).toHaveBeenCalled();
		expect(entity.options.collision?.static).toBe(true);
		expect(entity.isBundled).toBe(true);
		expect(addEntityGroup).not.toHaveBeenCalled();
	});

	it('awaits all spawns before runEntityLoadGenerator resolves', async () => {
		const delegate = new StageEntityDelegate(
			new StageLoadingDelegate(),
			new StageEntityModelDelegate(),
		);
		const addEntity = vi.fn((entity: any) => {
			entity.physicsAttached = true;
			entity.body = {
				translation: () => ({ x: 0, y: 0, z: 0 }),
				rotation: () => ({ x: 0, y: 0, z: 0, w: 1 }),
			};
		});
		const scene = { addEntityGroup: vi.fn() };
		const world = { addEntity };

		delegate.attach({
			scene: scene as any,
			world: { ...world, simulation: fakeSimulation } as any,
			renderStrategy: null,
			camera: {} as any,
		});

		const entities = Array.from({ length: 8 }, (_, i) =>
			createBox({ name: `box-${i}` }),
		);
		for (const entity of entities) {
			(delegate as any).children.push(entity);
		}

		let inFlightSpawns = 0;
		let maxInFlight = 0;
		const originalSpawn = delegate.spawnEntity.bind(delegate);
		vi.spyOn(delegate, 'spawnEntity').mockImplementation(async (child) => {
			inFlightSpawns++;
			maxInFlight = Math.max(maxInFlight, inFlightSpawns);
			await originalSpawn(child);
			inFlightSpawns--;
		});

		expect((delegate as any).children.length).toBe(8);
		await delegate.runEntityLoadGenerator();

		expect(addEntity).toHaveBeenCalledTimes(8);
		expect(maxInFlight).toBe(1);
	});

	it('reveals entities without an explicit spawn position once spawn finalizes', async () => {
		const delegate = new StageEntityDelegate(
			new StageLoadingDelegate(),
			new StageEntityModelDelegate(),
		);
		const scene = {
			addEntityGroup: vi.fn((entity: any) => {
				const target = entity.group ?? entity.mesh;
				if (!target || target.parent != null) {
					return;
				}
				target.parent = {};
			}),
		};
		const world = {
			addEntity(entity: any) {
				entity.physicsAttached = true;
				entity.body = {
					translation: () => ({ x: 0, y: 0, z: 0 }),
					setTranslation: (next: { x: number; y: number; z: number }) => {
						entity._translation = next;
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
			world: { ...world, simulation: fakeSimulation } as any,
			renderStrategy: null,
			camera: {} as any,
		});

		const entity = createBox();
		await delegate.spawnEntity(entity);

		expect(entity.mesh?.visible).toBe(true);
	});

	it('keeps hideUntilPositioned:true entities hidden until setPosition', async () => {
		const delegate = new StageEntityDelegate(
			new StageLoadingDelegate(),
			new StageEntityModelDelegate(),
		);
		const scene = {
			addEntityGroup: vi.fn((entity: any) => {
				const target = entity.group ?? entity.mesh;
				if (!target || target.parent != null) {
					return;
				}
				target.parent = {};
			}),
		};
		const world = {
			addEntity(entity: any) {
				entity.physicsAttached = true;
				entity.body = {
					translation: () => ({ x: 0, y: 0, z: 0 }),
					setTranslation: (next: { x: number; y: number; z: number }) => {
						entity._translation = next;
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
			world: { ...world, simulation: fakeSimulation } as any,
			renderStrategy: null,
			camera: {} as any,
		});

		const entity = createBox({ hideUntilPositioned: true });
		await delegate.spawnEntity(entity);

		expect(entity.mesh?.visible).toBe(false);
		entity.setPosition(4, 5, 6);
		expect(entity.mesh?.visible).toBe(true);
	});

	it('clears spawn placement pending for instanced (pack) entities', async () => {
		const delegate = new StageEntityDelegate(
			new StageLoadingDelegate(),
			new StageEntityModelDelegate(),
		);
		const scene = { addEntityGroup: vi.fn() };
		const world = {
			addEntity(entity: any) {
				entity.physicsAttached = true;
				entity.body = {
					translation: () => ({ x: 2, y: 3, z: 4 }),
					setTranslation: () => {},
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
		const renderStrategy = {
			register: vi.fn((entity: any) => {
				entity.isInstanced = true;
				return true;
			}),
			unregister: vi.fn(),
		};

		delegate.attach({
			scene: scene as any,
			world: { ...world, simulation: fakeSimulation } as any,
			renderStrategy: renderStrategy as any,
			camera: {} as any,
		});

		const entity = createBox({
			position: new Vector3(2, 3, 4),
			category: 'pack',
		});
		await delegate.spawnEntity(entity);

		expect(renderStrategy.register).toHaveBeenCalled();
		expect(scene.addEntityGroup).not.toHaveBeenCalled();
		expect((entity as any)._spawnPlacementPending).toBe(false);
	});

	it('reveals entities with an explicit create-time position after spawn', async () => {
		const delegate = new StageEntityDelegate(
			new StageLoadingDelegate(),
			new StageEntityModelDelegate(),
		);
		const scene = { addEntityGroup: vi.fn() };
		const world = {
			addEntity(entity: any) {
				entity.physicsAttached = true;
				entity.body = {
					translation: () => ({ x: 2, y: 3, z: 4 }),
					setTranslation: () => {},
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
			world: { ...world, simulation: fakeSimulation } as any,
			renderStrategy: null,
			camera: {} as any,
		});

		const entity = createBox({
			position: new Vector3(2, 3, 4),
		});
		await delegate.spawnEntity(entity);

		expect(entity.mesh?.visible).toBe(true);
	});

	it('reveals entities positioned in onSetup before scene attachment', async () => {
		const delegate = new StageEntityDelegate(
			new StageLoadingDelegate(),
			new StageEntityModelDelegate(),
		);
		const scene = {
			addEntityGroup: vi.fn((entity: any) => {
				const target = entity.group ?? entity.mesh;
				if (!target || !entity.body) {
					return;
				}
				const translation = entity.body.translation();
				target.position.set(translation.x, translation.y, translation.z);
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
			world: { ...world, simulation: fakeSimulation } as any,
			renderStrategy: null,
			camera: {} as any,
		});

		const entity = createBox();
		entity.onSetup(({ me }) => {
			me.setPosition(5, 6, 0);
		});

		await delegate.spawnEntity(entity);

		expect(entity.mesh?.position.x).toBe(5);
		expect(entity.mesh?.position.y).toBe(6);
		expect(entity.mesh?.position.z).toBe(0);
		expect(entity.mesh?.visible).toBe(true);
	});

	it('shows entities immediately when hideUntilPositioned is false', async () => {
		const delegate = new StageEntityDelegate(
			new StageLoadingDelegate(),
			new StageEntityModelDelegate(),
		);
		const scene = { addEntityGroup: vi.fn() };
		const world = {
			addEntity(entity: any) {
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
			},
		};

		delegate.attach({
			scene: scene as any,
			world: { ...world, simulation: fakeSimulation } as any,
			renderStrategy: null,
			camera: {} as any,
		});

		const entity = createBox({ hideUntilPositioned: false });
		await delegate.spawnEntity(entity);

		expect(entity.mesh?.visible).toBe(true);
	});

	it('keeps visible:false entities hidden until reveal()', async () => {
		const delegate = new StageEntityDelegate(
			new StageLoadingDelegate(),
			new StageEntityModelDelegate(),
		);
		const scene = { addEntityGroup: vi.fn() };
		const world = {
			addEntity(entity: any) {
				entity.physicsAttached = true;
				entity.body = {
					translation: () => ({ x: 1, y: 2, z: 3 }),
					setTranslation: () => {},
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
			world: { ...world, simulation: fakeSimulation } as any,
			renderStrategy: null,
			camera: {} as any,
		});

		const entity = createBox({
			position: new Vector3(1, 2, 3),
			visible: false,
		});
		await delegate.spawnEntity(entity);

		expect(entity.mesh?.visible).toBe(false);
		entity.reveal();
		expect(entity.mesh?.visible).toBe(true);
	});

	it('keeps hideUntilPositioned:true deferred actor groups hidden until setPosition after the model loads', async () => {
		const modelDelegate = new StageEntityModelDelegate();
		const delegate = new StageEntityDelegate(
			new StageLoadingDelegate(),
			modelDelegate,
		);
		const pendingModel = createDeferredModel();
		vi.spyOn(EntityAssetLoader.prototype, 'loadFile')
			.mockImplementation(() => pendingModel.promise as Promise<any>);

		const scene = {
			addEntityGroup: vi.fn((entity: any) => {
				const target = entity.group ?? entity.mesh;
				if (!target || target.parent != null) {
					return;
				}
				target.parent = {};
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

		modelDelegate.attach(
			scene as any,
			(entity) => delegate.handleLateModelReady(entity),
		);

		delegate.attach({
			scene: scene as any,
			world: { ...world, simulation: fakeSimulation } as any,
			renderStrategy: null,
			camera: {} as any,
		});

		const actor = createActor({
			models: ['mascot.fbx'],
			collision: { static: false },
			collisionShape: 'capsule',
			hideUntilPositioned: true,
		});

		await delegate.spawnEntity(actor);

		pendingModel.resolve({
			object: new Group().add(
				new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial()),
			),
		});
		await flushPromises();

		expect(actor.group?.visible).toBe(false);
		actor.setPosition(8, 9, 0);
		expect(actor.group?.visible).toBe(true);
		modelDelegate.dispose();
	});
});
