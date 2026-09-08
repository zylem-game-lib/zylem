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
		addEntity(entity: any) {
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
			entity.physicsAttached = false;
			entity.body = null;
		},
		simulation: { adapter: {} },
	};
	delegate.attach({
		scene: { addEntityGroup: vi.fn() } as any,
		world: world as any,
		renderStrategy: null,
		camera: {} as any,
	});
	return delegate;
}

describe('StageEntityDelegate per-ref behavior links', () => {
	it('attaches a late ref without detaching the entity\'s other behaviors', async () => {
		const thruster = recordingBehavior('links-thruster');
		const wrap = recordingBehavior('links-wrap');
		const delegate = attachedDelegate();

		const box = createBox({});
		box.use(thruster.descriptor);
		await delegate.spawnEntity(box);
		expect(thruster.attach).toHaveBeenCalledTimes(1);

		const wrapRef = box.use(wrap.descriptor, { value: 3 }).ref;
		expect(delegate.attachBehaviorLink(box, wrapRef)).toBe(true);

		expect(wrap.attach).toHaveBeenCalledTimes(1);
		expect(wrap.attach.mock.calls[0]![0]).toMatchObject({ entity: box, ref: wrapRef });
		// Unlike syncBehaviorLinks, the existing behavior was left alone.
		expect(thruster.detach).not.toHaveBeenCalled();
		expect(thruster.attach).toHaveBeenCalledTimes(1);
		expect(delegate.behaviorEntityIndex.get(wrap.descriptor.key)?.size).toBe(1);
	});

	it('refuses to link the same ref twice', async () => {
		const thruster = recordingBehavior('links-thruster-dup');
		const delegate = attachedDelegate();
		const box = createBox({});
		const ref = box.use(thruster.descriptor).ref;
		await delegate.spawnEntity(box);

		expect(delegate.attachBehaviorLink(box, ref)).toBe(false);
		expect(thruster.attach).toHaveBeenCalledTimes(1);
	});

	it('detaches one ref and leaves the rest indexed', async () => {
		const thruster = recordingBehavior('links-thruster-detach');
		const wrap = recordingBehavior('links-wrap-detach');
		const delegate = attachedDelegate();

		const box = createBox({});
		const thrusterRef = box.use(thruster.descriptor).ref;
		box.use(wrap.descriptor);
		await delegate.spawnEntity(box);

		expect(delegate.detachBehaviorLink(box, thrusterRef)).toBe(true);

		expect(thruster.detach).toHaveBeenCalledTimes(1);
		expect(wrap.detach).not.toHaveBeenCalled();
		expect(delegate.behaviorEntityIndex.has(thruster.descriptor.key)).toBe(false);
		expect(delegate.behaviorEntityIndex.get(wrap.descriptor.key)?.size).toBe(1);
		expect(delegate.detachBehaviorLink(box, thrusterRef)).toBe(false);
	});

	it('spawn-time registration still links every ref', async () => {
		const thruster = recordingBehavior('links-thruster-spawn');
		const wrap = recordingBehavior('links-wrap-spawn');
		const delegate = attachedDelegate();

		const box = createBox({});
		box.use(thruster.descriptor);
		box.use(wrap.descriptor);
		await delegate.spawnEntity(box);

		expect(thruster.attach).toHaveBeenCalledTimes(1);
		expect(wrap.attach).toHaveBeenCalledTimes(1);
	});
});
