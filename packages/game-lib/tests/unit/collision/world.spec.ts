import RAPIER from '@dimforge/rapier3d-compat';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { ZylemWorld } from '../../../src/lib/collision/world';
import { createBox } from '../../../src/lib/entities/box';
import { createSphere } from '../../../src/lib/entities/sphere';
import type { CollisionPair } from '../../../src/lib/physics/physics-protocol';
import { getDirectBodyPoseHistory } from '../../../src/lib/physics/physics-pose';

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

describe('ZylemWorld fixed-step pose history', () => {
	beforeAll(async () => {
		await RAPIER.init();
	});

	it('tracks previous and current poses for direct-mode interpolation', () => {
		const physicsWorld = new RAPIER.World({ x: 0, y: 0, z: 0 });
		const world = new ZylemWorld(physicsWorld, 60, false);
		const ball = createSphere({ name: 'ball' });

		world.addEntity(ball as any);
		ball.body?.setLinvel({ x: 6, y: 0, z: 0 }, true);

		world.update({ delta: 1 / 120 } as any);

		let history = getDirectBodyPoseHistory(ball.body!);
		expect(world.interpolationAlpha).toBeCloseTo(0.5, 5);
		expect(history).not.toBeNull();
		expect(history!.previous.position.x).toBeCloseTo(0, 5);
		expect(history!.current.position.x).toBeCloseTo(0, 5);

		world.update({ delta: 1 / 120 } as any);

		history = getDirectBodyPoseHistory(ball.body!);
		expect(world.interpolationAlpha).toBeCloseTo(0, 5);
		expect(history).not.toBeNull();
		expect(history!.current.position.x).toBeGreaterThan(history!.previous.position.x);
	});

	it('collapses pose history after explicit body translations', () => {
		const physicsWorld = new RAPIER.World({ x: 0, y: 0, z: 0 });
		const world = new ZylemWorld(physicsWorld, 60, false);
		const ball = createSphere({ name: 'teleport-ball' });

		world.addEntity(ball as any);
		ball.body?.setTranslation({ x: 4, y: -2, z: 1 }, true);

		const history = getDirectBodyPoseHistory(ball.body!);
		expect(history).not.toBeNull();
		expect(history!.previous.position).toEqual({ x: 4, y: -2, z: 1 });
		expect(history!.current.position).toEqual({ x: 4, y: -2, z: 1 });
	});

	it('clears entity physics references when bodies are destroyed', () => {
		const physicsWorld = new RAPIER.World({ x: 0, y: 0, z: 0 });
		const world = new ZylemWorld(physicsWorld, 60, false);
		const box = createBox({ name: 'cleanup-box' });

		world.addEntity(box as any);
		expect(box.body).not.toBeNull();
		expect(box.physicsAttached).toBe(true);

		world.destroyEntity(box as any);

		expect(box.body).toBeNull();
		expect(box.collider).toBeUndefined();
		expect(box.colliders).toEqual([]);
		expect(box.physicsAttached).toBe(false);
	});
});
