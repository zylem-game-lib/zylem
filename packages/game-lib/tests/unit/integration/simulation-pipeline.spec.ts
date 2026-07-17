/**
 * End-to-end pipeline test against the real wasm runtime:
 *
 *   input → behavior system (wasm attach + input write) → simulation step
 *   → collision events → snapshot/pose readback → Three.js transform sync
 *
 * This is the integration coverage called for by the runtime-behind-behaviors
 * migration: no Rapier, no mocks — the same path a running game takes.
 */
import { describe, expect, it, vi } from 'vitest';

import { TopDownMovementBehavior } from '@zylem/behaviors/top-down-movement';
import { ZylemWorld } from '../../../src/lib/collision/world';
import { createBox } from '../../../src/lib/entities/box';
import { StageEntityDelegate } from '../../../src/lib/stage/stage-entity-delegate';
import { StageEntityModelDelegate } from '../../../src/lib/stage/stage-entity-model-delegate';
import { StageLoadingDelegate } from '../../../src/lib/stage/stage-loading-delegate';
import { syncRenderPoses } from '../../../src/lib/systems/transformable.system';

const DT = 1 / 60;

describe('simulation pipeline (real wasm)', () => {
	it('drives input through behaviors into the wasm step and back out to Three.js transforms', async () => {
		const world = await ZylemWorld.create({ x: 0, y: -9.81, z: 0 }, 60);
		const delegate = new StageEntityDelegate(
			new StageLoadingDelegate(),
			new StageEntityModelDelegate(),
		);
		const scene = { addEntityGroup: vi.fn() };
		delegate.attach({
			scene: scene as any,
			world,
			renderStrategy: null,
			camera: {} as any,
		});

		// Static ground + a dynamic box dropped onto it (collision event path).
		const ground = createBox({
			name: 'ground',
			position: { x: 0, y: -3, z: 0 },
			size: { x: 40, y: 1, z: 40 },
			collision: { static: true },
		});
		const faller = createBox({
			name: 'faller',
			position: { x: 0, y: 1, z: 0 },
		});
		const collisionSpy = vi.fn();
		faller.onCollision(collisionSpy, { phase: 'enter' });

		// A behavior-driven box (input → wasm behavior path).
		const mover = createBox({
			name: 'mover',
			position: { x: 5, y: 5, z: 5 },
		});
		mover.use(TopDownMovementBehavior, { moveSpeed: 8 });

		await delegate.spawnEntity(ground);
		await delegate.spawnEntity(faller);
		await delegate.spawnEntity(mover);

		expect(mover.body).not.toBeNull();
		expect(delegate.behaviorSystems.length).toBeGreaterThan(0);

		// First system tick attaches the wasm behavior and creates the input
		// component; after that we can steer.
		for (const system of delegate.behaviorSystems) {
			system.update(undefined, DT);
		}
		expect((mover as any).$topDownMovement).toBeDefined();
		(mover as any).$topDownMovement.moveX = 1;

		for (let frame = 0; frame < 90; frame++) {
			for (const system of delegate.behaviorSystems) {
				system.update(undefined, DT);
			}
			world.update({ delta: DT } as any);
		}

		// Collision events surfaced as game callbacks.
		expect(collisionSpy).toHaveBeenCalled();

		// The wasm top-down behavior moved the mover along +x.
		const moverPos = mover.body!.translation();
		expect(moverPos.x).toBeGreaterThan(5.5);

		// The faller came to rest on the ground instead of falling through.
		const fallerPos = faller.body!.translation();
		expect(fallerPos.y).toBeGreaterThan(-3);

		// Render sync copies interpolated wasm poses onto the Three.js groups.
		syncRenderPoses({
			_childrenMap: delegate.childrenMap,
			_world: world,
		} as any);
		const moverTarget = (mover.group ?? mover.mesh)!;
		const fallerTarget = (faller.group ?? faller.mesh)!;
		expect(moverTarget.position.x).toBeCloseTo(moverPos.x, 0);
		expect(fallerTarget.position.y).toBeCloseTo(fallerPos.y, 0);

		world.destroy();
	});
});
