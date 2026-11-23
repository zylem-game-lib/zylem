import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EntityAssetLoader } from '../../../src/lib/core/entity-asset-loader';
import { vessel } from '../../../src/lib/core/vessel';
import { createActor } from '../../../src/lib/entities/actor';
import { createBox } from '../../../src/lib/entities/primitives/box';
import { AnimationDelegate } from '../../../src/lib/entities/delegates/animation';
import { StageEntityDelegate } from '../../../src/lib/stage/stage-entity-delegate';
import { StageEntityModelDelegate } from '../../../src/lib/stage/stage-entity-model-delegate';
import { StageLoadingDelegate } from '../../../src/lib/stage/stage-loading-delegate';

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

function flushPromises(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

function loadedModel() {
	return {
		object: new Group().add(
			new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial()),
		),
	};
}

/** A delegate wired to its model delegate the way the stage wires them. */
function attachedDelegate() {
	const modelDelegate = new StageEntityModelDelegate();
	const delegate = new StageEntityDelegate(new StageLoadingDelegate(), modelDelegate);
	const scene = { addEntityGroup: vi.fn() };
	const world = {
		addEntity: vi.fn((entity: any) => {
			entity.physicsAttached = true;
			entity.body = {
				translation: () => ({ x: 0, y: 0, z: 0 }),
				setTranslation: () => {},
				rotation: () => ({ x: 0, y: 0, z: 0, w: 1 }),
				setRotation: () => {},
				linvel: () => ({ x: 0, y: 0, z: 0 }),
				setLinvel: () => {},
				angvel: () => ({ x: 0, y: 0, z: 0 }),
				setAngvel: () => {},
				lockTranslations: () => {},
				lockRotations: () => {},
			};
		}),
		simulation: { adapter: {} },
	};
	modelDelegate.attach(
		scene as any,
		(entity) => delegate.handleLateModelReady(entity),
		(entityId) => delegate.handleLoadSettled(entityId),
	);
	delegate.attach({
		scene: scene as any,
		world: world as any,
		renderStrategy: null,
		camera: {} as any,
	});
	return { delegate, modelDelegate, world };
}

describe('loaded callbacks', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('run once at the end of spawn for an entity with nothing to load', async () => {
		const { delegate, modelDelegate } = attachedDelegate();
		const box = createBox({});
		const order: string[] = [];
		const loaded = vi.fn();
		box.onSetup(() => order.push('setup'));
		box.onLoaded(({ me }) => {
			order.push('loaded');
			loaded(me, me.physicsAttached, delegate.childrenMap.has(me.uuid));
		});

		await delegate.spawnEntity(box);

		expect(order).toEqual(['setup', 'loaded']);
		expect(loaded).toHaveBeenCalledTimes(1);
		expect(loaded).toHaveBeenCalledWith(box, true, true);
		modelDelegate.dispose();
	});

	it('run for a child with the child as `me`', async () => {
		const { delegate, modelDelegate } = attachedDelegate();
		const parent = createBox({});
		const child = createBox({});
		parent.add(child);
		const loaded = vi.fn();
		child.onLoaded(({ me }) => loaded(me));

		await delegate.spawnEntity(parent);

		expect(loaded).toHaveBeenCalledTimes(1);
		expect(loaded).toHaveBeenCalledWith(child);
		modelDelegate.dispose();
	});

	it('run for a vessel once its children have spawned', async () => {
		const { delegate, modelDelegate } = attachedDelegate();
		const child = createBox({});
		const group = vessel(child);
		const loaded = vi.fn();
		group.onLoaded(() => loaded(delegate.childrenMap.has(child.uuid)));

		await delegate.spawnEntity(group);

		expect(loaded).toHaveBeenCalledTimes(1);
		expect(loaded).toHaveBeenCalledWith(true);
		modelDelegate.dispose();
	});

	it('run again when the entity is spawned again', async () => {
		const { delegate, modelDelegate } = attachedDelegate();
		const box = createBox({});
		const loaded = vi.fn();
		box.onLoaded(loaded);

		await delegate.spawnEntity(box);
		await delegate.spawnEntity(box);

		expect(loaded).toHaveBeenCalledTimes(2);
		modelDelegate.dispose();
	});

	it('wait for a late model and the physics that depend on it', async () => {
		const { delegate, modelDelegate } = attachedDelegate();
		const pendingModel = deferred<{ object: any }>();
		vi.spyOn(EntityAssetLoader.prototype, 'loadFile')
			.mockImplementation(() => pendingModel.promise as Promise<any>);
		const actor = createActor({
			models: ['mascot.fbx'],
			collision: { static: false },
			collisionShape: 'capsule',
		});
		const loaded = vi.fn();
		actor.onLoaded(({ me }) => loaded(me.physicsAttached, me.object !== null));

		await delegate.spawnEntity(actor);
		expect(loaded).not.toHaveBeenCalled();

		pendingModel.resolve(loadedModel());
		await flushPromises();

		expect(loaded).toHaveBeenCalledTimes(1);
		expect(loaded).toHaveBeenCalledWith(true, true);
		modelDelegate.dispose();
	});

	it('wait for animation clips after the model', async () => {
		const { delegate, modelDelegate } = attachedDelegate();
		const pendingClips = deferred<void>();
		vi.spyOn(EntityAssetLoader.prototype, 'loadFile')
			.mockImplementation(() => Promise.resolve(loadedModel()) as Promise<any>);
		vi.spyOn(AnimationDelegate.prototype, 'loadAnimations')
			.mockImplementation(() => pendingClips.promise);
		const actor = createActor({
			models: ['mascot.fbx'],
			animations: [{ key: 'idle', path: 'idle.fbx' }],
			collision: { static: false },
			collisionShape: 'capsule',
			collisionSize: { x: 1, y: 2, z: 1 },
		});
		const loaded = vi.fn();
		actor.onLoaded(loaded);

		await delegate.spawnEntity(actor);
		await flushPromises();
		expect(actor.object).not.toBeNull();
		expect(loaded).not.toHaveBeenCalled();

		pendingClips.resolve();
		await flushPromises();

		expect(loaded).toHaveBeenCalledTimes(1);
		modelDelegate.dispose();
	});

	it('do not run when the model fails to load', async () => {
		const { delegate, modelDelegate } = attachedDelegate();
		const pendingModel = deferred<{ object: any }>();
		vi.spyOn(EntityAssetLoader.prototype, 'loadFile')
			.mockImplementation(() => pendingModel.promise as Promise<any>);
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const actor = createActor({ models: ['missing.fbx'] });
		const loaded = vi.fn();
		actor.onLoaded(loaded);

		await delegate.spawnEntity(actor);
		pendingModel.reject(new Error('404'));
		await flushPromises();

		expect(actor.getLoadState()).toBe('failed');
		expect(loaded).not.toHaveBeenCalled();
		modelDelegate.dispose();
	});

	it('still run when only the animation clips fail to load', async () => {
		const { delegate, modelDelegate } = attachedDelegate();
		const pendingClips = deferred<void>();
		vi.spyOn(EntityAssetLoader.prototype, 'loadFile')
			.mockImplementation(() => Promise.resolve(loadedModel()) as Promise<any>);
		vi.spyOn(AnimationDelegate.prototype, 'loadAnimations')
			.mockImplementation(() => pendingClips.promise);
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const actor = createActor({
			models: ['mascot.fbx'],
			animations: [{ key: 'idle', path: 'missing.fbx' }],
		});
		const loaded = vi.fn();
		actor.onLoaded(loaded);

		await delegate.spawnEntity(actor);
		await flushPromises();
		expect(loaded).not.toHaveBeenCalled();

		pendingClips.reject(new Error('404'));
		await flushPromises();

		expect(actor.getLoadState()).toBe('ready');
		expect(loaded).toHaveBeenCalledTimes(1);
		modelDelegate.dispose();
	});
});
