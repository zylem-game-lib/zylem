import { createWorld } from 'bitecs';
import { Scene } from 'three';
import { describe, expect, it, vi } from 'vitest';

import { particlePresets } from '../../../src/lib/behaviors/particle-emitter';
import { createParticleSystem } from '../../../src/lib/entities/particle-system';
import { StageEntityDelegate } from '../../../src/lib/stage/stage-entity-delegate';
import { StageEntityModelDelegate } from '../../../src/lib/stage/stage-entity-model-delegate';
import { StageLoadingDelegate } from '../../../src/lib/stage/stage-loading-delegate';

describe('particle emitter stage integration', () => {
	it('cleans up particle runtimes when entities are removed through the stage delegate', async () => {
		const delegate = new StageEntityDelegate(
			new StageLoadingDelegate(),
			new StageEntityModelDelegate(),
		);
		const ecs = createWorld();
		const sceneRoot = new Scene();
		const world = {
			collisionMap: new Map<string, any>(),
			addEntity: vi.fn(),
			destroyEntity: vi.fn(),
		};
		const scene = {
			scene: sceneRoot,
			addEntityGroup: vi.fn((entity: any) => {
				const target = entity.group ?? entity.mesh;
				if (target) {
					sceneRoot.add(target);
				}
			}),
		};

		delegate.attach({
			scene: scene as any,
			world: world as any,
			ecs,
			instanceManager: null,
			camera: {} as any,
		});

		const entity = createParticleSystem({
			effect: particlePresets.burst(),
		});

		await delegate.spawnEntity(entity);
		world.collisionMap.set(entity.uuid, entity);

		expect(delegate.behaviorSystems).toHaveLength(1);

		delegate.behaviorSystems[0].update(ecs, 1 / 60);
		expect(entity.getSystem()).not.toBeNull();

		expect(delegate.removeEntityByUuid(entity.uuid)).toBe(true);
		expect(entity.getSystem()).toBeNull();
		expect(world.destroyEntity).toHaveBeenCalledWith(entity);
	});
});
