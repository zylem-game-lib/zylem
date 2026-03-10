import { createWorld } from 'bitecs';
import { Vector3 } from 'three';
import { describe, expect, it, vi } from 'vitest';

import { createBox } from '../../../src/lib/entities/box';
import { StageEntityDelegate } from '../../../src/lib/stage/stage-entity-delegate';
import { StageEntityModelDelegate } from '../../../src/lib/stage/stage-entity-model-delegate';
import { StageLoadingDelegate } from '../../../src/lib/stage/stage-loading-delegate';

describe('StageEntityDelegate', () => {
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
});
