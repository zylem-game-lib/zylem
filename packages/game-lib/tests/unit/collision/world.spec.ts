import { describe, expect, it, vi } from 'vitest';

import { ZylemWorld } from '../../../src/lib/collision/world';
import { createBox } from '../../../src/lib/entities/box';
import { createSphere } from '../../../src/lib/entities/sphere';
import type { CollisionPair } from '../../../src/lib/physics/physics-protocol';

function registerEntities(world: ZylemWorld, ...entities: Array<ReturnType<typeof createSphere> | ReturnType<typeof createBox>>) {
	for (const entity of entities) {
		world.collisionMap.set(entity.uuid, entity as any);
	}
}

function applyPairs(
	world: ZylemWorld,
	pairs: CollisionPair[],
	nowMs: number,
	delta = 1 / 60,
) {
	(world as any).processCollisionPairs(pairs, delta, nowMs);
}

function bidirectionalContact(uuidA: string, uuidB: string): CollisionPair[] {
	return [
		{ uuidA, uuidB, contactType: 'contact' },
		{ uuidA: uuidB, uuidB: uuidA, contactType: 'contact' },
	];
}

describe('ZylemWorld collision dispatch', () => {
	it('fires enter once and stay once per update for sustained contact', () => {
		const world = new ZylemWorld(null as any, 60, false);
		const ball = createSphere({ name: 'ball' });
		const wall = createBox({ name: 'wall' });
		const enterSpy = vi.fn();
		const staySpy = vi.fn();

		ball.onCollision(enterSpy, { phase: 'enter' });
		ball.onCollision(staySpy, { phase: 'stay' });
		registerEntities(world, ball, wall);

		const pairs = bidirectionalContact(ball.uuid, wall.uuid);
		applyPairs(world, pairs, 16);
		applyPairs(world, pairs, 32);

		expect(enterSpy).toHaveBeenCalledTimes(1);
		expect(staySpy).toHaveBeenCalledTimes(2);
	});

	it('applies cooldown per callback and collision pair', () => {
		const world = new ZylemWorld(null as any, 60, false);
		const ball = createSphere({ name: 'ball' });
		const wallA = createBox({ name: 'wall-a' });
		const wallB = createBox({ name: 'wall-b' });
		const staySpy = vi.fn();

		ball.onCollision(staySpy, { phase: 'stay', cooldownMs: 75 });
		registerEntities(world, ball, wallA, wallB);

		applyPairs(world, bidirectionalContact(ball.uuid, wallA.uuid), 0);
		applyPairs(world, bidirectionalContact(ball.uuid, wallA.uuid), 40);
		applyPairs(world, bidirectionalContact(ball.uuid, wallB.uuid), 50);
		applyPairs(world, bidirectionalContact(ball.uuid, wallA.uuid), 90);

		expect(staySpy).toHaveBeenCalledTimes(3);
	});

	it('matches callback counts across direct and worker collision batches', () => {
		const createHarness = (useWorker: boolean) => {
			const world = new ZylemWorld(null as any, 60, useWorker);
			const ball = createSphere({ name: 'ball' });
			const wallA = createBox({ name: 'wall-a' });
			const wallB = createBox({ name: 'wall-b' });
			const enterSpy = vi.fn();
			const staySpy = vi.fn();

			ball.onCollision(enterSpy, { phase: 'enter' });
			ball.onCollision(staySpy, { phase: 'stay', cooldownMs: 75 });
			registerEntities(world, ball, wallA, wallB);

			return { world, ball, wallA, wallB, enterSpy, staySpy };
		};

		const direct = createHarness(false);
		const worker = createHarness(true);

		const directSequence = [
			{ nowMs: 16, pairs: bidirectionalContact(direct.ball.uuid, direct.wallA.uuid) },
			{ nowMs: 40, pairs: bidirectionalContact(direct.ball.uuid, direct.wallA.uuid) },
			{ nowMs: 55, pairs: bidirectionalContact(direct.ball.uuid, direct.wallB.uuid) },
			{ nowMs: 120, pairs: bidirectionalContact(direct.ball.uuid, direct.wallA.uuid) },
		];
		const workerSequence = [
			{ nowMs: 16, pairs: bidirectionalContact(worker.ball.uuid, worker.wallA.uuid) },
			{ nowMs: 40, pairs: bidirectionalContact(worker.ball.uuid, worker.wallA.uuid) },
			{ nowMs: 55, pairs: bidirectionalContact(worker.ball.uuid, worker.wallB.uuid) },
			{ nowMs: 120, pairs: bidirectionalContact(worker.ball.uuid, worker.wallA.uuid) },
		];

		for (let index = 0; index < directSequence.length; index += 1) {
			const directStep = directSequence[index]!;
			const workerStep = workerSequence[index]!;
			applyPairs(direct.world, directStep.pairs, directStep.nowMs);
			applyPairs(worker.world, workerStep.pairs, workerStep.nowMs);
		}

		expect(direct.enterSpy).toHaveBeenCalledTimes(worker.enterSpy.mock.calls.length);
		expect(direct.staySpy).toHaveBeenCalledTimes(worker.staySpy.mock.calls.length);
		expect(direct.enterSpy.mock.calls.length).toBe(3);
		expect(direct.staySpy.mock.calls.length).toBe(3);
	});
});
