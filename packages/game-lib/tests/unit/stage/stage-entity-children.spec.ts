import { describe, expect, it, vi } from 'vitest';

import { createBox } from '../../../src/lib/entities/box';
import { StageEntityDelegate } from '../../../src/lib/stage/stage-entity-delegate';
import { StageEntityModelDelegate } from '../../../src/lib/stage/stage-entity-model-delegate';
import { StageLoadingDelegate } from '../../../src/lib/stage/stage-loading-delegate';

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

/** One frame of the stage's entity loop: every spawned node, with itself as `me`. */
function runEntityLoop(delegate: StageEntityDelegate): void {
	for (const child of delegate.childrenMap.values()) {
		child.nodeUpdate({ me: child, delta: 1 / 60 } as any);
	}
}

describe('stage-driven lifecycle for child nodes', () => {
	it('sets up a child once, with the child as `me`', async () => {
		const delegate = attachedDelegate();
		const parent = createBox({});
		const child = createBox({});
		parent.add(child);

		const setup = vi.fn();
		child.onSetup(({ me }) => setup(me));

		await delegate.spawnEntity(parent);

		expect(setup).toHaveBeenCalledTimes(1);
		expect(setup).toHaveBeenCalledWith(child);
	});

	it('updates a child once per frame, with the child as `me`', async () => {
		const delegate = attachedDelegate();
		const parent = createBox({});
		const child = createBox({});
		parent.add(child);

		const update = vi.fn();
		child.onUpdate(({ me }) => update(me));

		await delegate.spawnEntity(parent);
		runEntityLoop(delegate);

		expect(update).toHaveBeenCalledTimes(1);
		expect(update).toHaveBeenCalledWith(child);
	});

	it('still destroys a child along with its parent', async () => {
		const delegate = attachedDelegate();
		const parent = createBox({});
		const child = createBox({});
		parent.add(child);

		const destroyed = vi.fn();
		child.onDestroy(() => destroyed());

		await delegate.spawnEntity(parent);
		parent.nodeDestroy({ me: parent, globals: {} } as any);

		expect(destroyed).toHaveBeenCalledTimes(1);
		expect(child.markedForRemoval).toBe(true);
	});
});
