import { describe, expect, it, vi } from 'vitest';
import { defineBehavior, type BehaviorEntityLink } from '@zylem/behaviors/core';

import { createBox } from '../../../src/lib/entities/box';
import { StageEntityDelegate } from '../../../src/lib/stage/stage-entity-delegate';
import { StageEntityModelDelegate } from '../../../src/lib/stage/stage-entity-model-delegate';
import { StageLoadingDelegate } from '../../../src/lib/stage/stage-loading-delegate';

/** A behavior whose system records attach/detach calls, one per descriptor. */
function recordingBehavior(name: string) {
	const attach = vi.fn<(link: BehaviorEntityLink) => void>();
	const detach = vi.fn<(link: BehaviorEntityLink) => void>();
	const descriptor = defineBehavior({
		name,
		defaultOptions: { value: 0 },
		systemFactory: () => ({ attach, detach, update() {} }),
	});
	return { descriptor, attach, detach };
}

function attachedDelegate() {
	const delegate = new StageEntityDelegate(
		new StageLoadingDelegate(),
		new StageEntityModelDelegate(),
	);
	const world = {
		collisionMap: new Map<string, unknown>(),
		addEntity(entity: any) {
			world.collisionMap.set(entity.uuid, entity);
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
		},
		destroyEntity(entity: any) {
			world.collisionMap.delete(entity.uuid);
			entity.physicsAttached = false;
			entity.body = null;
		},
		simulation: { adapter: {} },
	};
	delegate.attach({
		scene: { addEntityGroup: vi.fn(), scene: { remove: vi.fn() } } as any,
		world: world as any,
		renderStrategy: null,
		camera: {} as any,
	});
	return delegate;
}

/** A behavior whose system has no `detach`, like the older built-in ones. */
function permanentBehavior(name: string) {
	const attach = vi.fn<(link: BehaviorEntityLink) => void>();
	const descriptor = defineBehavior({
		name,
		defaultOptions: { value: 0 },
		systemFactory: () => ({ attach, update() {} }),
	});
	return { descriptor, attach };
}

describe('StageEntityDelegate as behavior host', () => {
	it('starts every enabled behavior at spawn with the slot\'s own link', async () => {
		const thruster = recordingBehavior('host-thruster-spawn');
		const wrap = recordingBehavior('host-wrap-spawn');
		const off = recordingBehavior('host-off-spawn');
		const delegate = attachedDelegate();

		const box = createBox({});
		box.use(thruster.descriptor);
		box.use(wrap.descriptor);
		box.use(off.descriptor).disable();
		await delegate.spawnEntity(box);

		expect(thruster.attach).toHaveBeenCalledTimes(1);
		expect(wrap.attach).toHaveBeenCalledTimes(1);
		expect(off.attach).not.toHaveBeenCalled();
		expect(thruster.attach.mock.calls[0]![0]).toBe(box.getBehaviorSlots()[0]!.link);
		expect(box.behaviorHost).toBe(delegate);
	});

	it('starts a behavior used after spawn without touching the others', async () => {
		const thruster = recordingBehavior('host-thruster-late');
		const wrap = recordingBehavior('host-wrap-late');
		const delegate = attachedDelegate();

		const box = createBox({});
		box.use(thruster.descriptor);
		await delegate.spawnEntity(box);

		const handle = box.use(wrap.descriptor, { value: 3 });

		expect(wrap.attach).toHaveBeenCalledTimes(1);
		expect(wrap.attach.mock.calls[0]![0]).toMatchObject({ entity: box, ref: handle.ref });
		expect(thruster.detach).not.toHaveBeenCalled();
		expect(thruster.attach).toHaveBeenCalledTimes(1);
		expect(delegate.behaviorEntityIndex.get(wrap.descriptor.key)?.size).toBe(1);
	});

	it('disable() detaches one behavior at once and enable() attaches the same link again', async () => {
		const thruster = recordingBehavior('host-thruster-toggle');
		const wrap = recordingBehavior('host-wrap-toggle');
		const delegate = attachedDelegate();

		const box = createBox({});
		const handle = box.use(thruster.descriptor);
		box.use(wrap.descriptor);
		await delegate.spawnEntity(box);
		const link = thruster.attach.mock.calls[0]![0];

		handle.disable();

		expect(thruster.detach).toHaveBeenCalledTimes(1);
		expect(thruster.detach.mock.calls[0]![0]).toBe(link);
		expect(wrap.detach).not.toHaveBeenCalled();
		expect(delegate.behaviorEntityIndex.has(thruster.descriptor.key)).toBe(false);
		expect(delegate.behaviorEntityIndex.get(wrap.descriptor.key)?.size).toBe(1);

		handle.disable();
		expect(thruster.detach).toHaveBeenCalledTimes(1);

		handle.enable();
		handle.enable();

		expect(thruster.attach).toHaveBeenCalledTimes(2);
		expect(thruster.attach.mock.calls[1]![0]).toBe(link);
		expect(delegate.behaviorEntityIndex.get(thruster.descriptor.key)?.size).toBe(1);
	});

	it('setOptions restarts a running behavior with the merged options', async () => {
		const thruster = recordingBehavior('host-thruster-options');
		const delegate = attachedDelegate();
		const box = createBox({});
		const handle = box.use(thruster.descriptor, { value: 1 });
		await delegate.spawnEntity(box);
		let optionsAtAttach: unknown;
		thruster.attach.mockImplementation((link) => {
			optionsAtAttach = { ...link.ref.options };
		});

		handle.setOptions({ value: 2 });

		expect(thruster.detach).toHaveBeenCalledTimes(1);
		expect(thruster.attach).toHaveBeenCalledTimes(2);
		expect(optionsAtAttach).toEqual({ value: 2 });
	});

	it('setOptions on a disabled behavior only records the options', async () => {
		const thruster = recordingBehavior('host-thruster-options-off');
		const delegate = attachedDelegate();
		const box = createBox({});
		const handle = box.use(thruster.descriptor);
		await delegate.spawnEntity(box);
		handle.disable();

		handle.setOptions({ value: 9 });

		expect(thruster.attach).toHaveBeenCalledTimes(1);
		expect(handle.getOptions()).toEqual({ value: 9 });
	});

	it('unuse() detaches the behavior and forgets it', async () => {
		const thruster = recordingBehavior('host-thruster-unuse');
		const delegate = attachedDelegate();
		const box = createBox({});
		box.use(thruster.descriptor);
		await delegate.spawnEntity(box);

		expect(box.unuse(thruster.descriptor)).toBe(true);

		expect(thruster.detach).toHaveBeenCalledTimes(1);
		expect(box.getBehaviorSlots()).toHaveLength(0);
	});

	it('refuses to disable, re-option or unuse a running behavior whose system cannot detach', async () => {
		const permanent = permanentBehavior('host-permanent');
		const delegate = attachedDelegate();
		const box = createBox({});
		const handle = box.use(permanent.descriptor, { value: 1 });
		await delegate.spawnEntity(box);

		expect(() => handle.disable()).toThrow('Behavior "host-permanent" is not removable at runtime');
		expect(() => handle.setOptions({ value: 2 })).toThrow('not removable at runtime');
		expect(() => box.unuse(permanent.descriptor)).toThrow('not removable at runtime');

		expect(handle.enabled).toBe(true);
		expect(handle.getOptions()).toEqual({ value: 1 });
		expect(box.hasBehavior(permanent.descriptor)).toBe(true);
		expect(delegate.behaviorEntityIndex.get(permanent.descriptor.key)?.size).toBe(1);
	});

	it('lets a behavior whose system cannot detach be switched off before spawn', async () => {
		const permanent = permanentBehavior('host-permanent-prespawn');
		const delegate = attachedDelegate();
		const box = createBox({});
		box.use(permanent.descriptor).disable();

		await delegate.spawnEntity(box);

		expect(permanent.attach).not.toHaveBeenCalled();
	});

	it('stops the behaviors of an entity that leaves the stage and starts them when it comes back', async () => {
		const thruster = recordingBehavior('host-thruster-restore');
		const permanent = permanentBehavior('host-permanent-restore');
		const delegate = attachedDelegate();
		const box = createBox({});
		const handle = box.use(thruster.descriptor);
		box.use(permanent.descriptor);
		await delegate.spawnEntity(box);

		expect(delegate.detachEntity(box.uuid)).toBe(true);

		expect(thruster.detach).toHaveBeenCalledTimes(1);
		expect(box.behaviorHost).toBeNull();
		expect(delegate.behaviorEntityIndex.size).toBe(0);
		// Off stage, a toggle only records the state.
		handle.disable();
		handle.enable();
		expect(thruster.attach).toHaveBeenCalledTimes(1);

		expect(delegate.restoreEntity(box.uuid)).toBe(true);

		expect(thruster.attach).toHaveBeenCalledTimes(2);
		expect(permanent.attach).toHaveBeenCalledTimes(2);
		expect(box.behaviorHost).toBe(delegate);
	});

	it('lets go of its entities at teardown; their behaviors and state stay for the next stage', async () => {
		const thruster = recordingBehavior('host-thruster-reload');
		const wrap = recordingBehavior('host-wrap-reload');
		const delegate = attachedDelegate();
		const box = createBox({});
		const handle = box.use(thruster.descriptor, { value: 4 });
		const disabled = box.use(wrap.descriptor);
		disabled.disable();
		await delegate.spawnEntity(box);

		delegate.destroyAll();

		expect(box.behaviorHost).toBeNull();
		expect(box.getBehaviorHandle(thruster.descriptor)).toBe(handle);
		expect(handle.enabled).toBe(true);
		expect(handle.getOptions()).toEqual({ value: 4 });
		expect(disabled.enabled).toBe(false);

		const next = attachedDelegate();
		await next.spawnEntity(box);

		expect(thruster.attach).toHaveBeenCalledTimes(2);
		expect(wrap.attach).not.toHaveBeenCalled();
		expect(box.behaviorHost).toBe(next);
	});

	it('takes over an entity that is still live in another stage', async () => {
		const thruster = recordingBehavior('host-thruster-handover');
		const first = attachedDelegate();
		const second = attachedDelegate();
		const box = createBox({});
		box.use(thruster.descriptor);
		await first.spawnEntity(box);

		await second.spawnEntity(box);

		// The first stage's system let go before the second stage's took the link.
		expect(thruster.detach).toHaveBeenCalledTimes(1);
		expect(thruster.attach).toHaveBeenCalledTimes(2);
		expect(box.behaviorHost).toBe(second);
		expect(first.behaviorEntityIndex.size).toBe(0);
	});
});

describe('toggling behaviors in bursts', () => {
	it('reuses the same handle, ref and link, and leaves every collection its original size', async () => {
		const thruster = recordingBehavior('burst-thruster');
		const wrap = recordingBehavior('burst-wrap');
		const delegate = attachedDelegate();
		const boxes = Array.from({ length: 100 }, () => createBox({}));
		const handles = boxes.map((box) => {
			box.use(wrap.descriptor);
			return box.use(thruster.descriptor);
		});
		for (const box of boxes) await delegate.spawnEntity(box);

		const slots = boxes.map((box) => box.getBehaviorSlots()[1]!);
		const slotLists = boxes.map((box) => box.getBehaviorSlots());
		const indexed = delegate.behaviorEntityIndex.get(wrap.descriptor.key)!;
		const systemCount = delegate.behaviorSystems.length;

		for (let round = 0; round < 50; round++) {
			for (const handle of handles) handle.disable();
			expect(delegate.behaviorEntityIndex.has(thruster.descriptor.key)).toBe(false);
			for (const handle of handles) handle.enable();
		}

		boxes.forEach((box, i) => {
			const slot = box.getBehaviorSlots()[1]!;
			expect(box.getBehaviorSlots()).toBe(slotLists[i]);
			expect(box.getBehaviorSlots()).toHaveLength(2);
			expect(slot).toBe(slots[i]);
			expect(slot.handle).toBe(handles[i]);
			expect(slot.ref).toBe(handles[i]!.ref);
			expect(box.use(thruster.descriptor)).toBe(handles[i]);
			expect(box.getBehaviorRefs()).toHaveLength(2);
		});
		// Every attach and detach of a slot passed that slot's one link.
		const links = new Set(slots.map((slot) => slot.link));
		expect(thruster.attach).toHaveBeenCalledTimes(100 * 51);
		expect(thruster.detach).toHaveBeenCalledTimes(100 * 50);
		for (const [link] of [...thruster.attach.mock.calls, ...thruster.detach.mock.calls]) {
			expect(links.has(link)).toBe(true);
		}
		expect(delegate.behaviorEntityIndex.get(thruster.descriptor.key)?.size).toBe(100);
		expect(delegate.behaviorEntityIndex.get(wrap.descriptor.key)).toBe(indexed);
		expect(indexed.size).toBe(100);
		expect(delegate.behaviorSystems).toHaveLength(systemCount);
		expect(delegate.behaviorSystemByKey.size).toBe(2);
	});
});
