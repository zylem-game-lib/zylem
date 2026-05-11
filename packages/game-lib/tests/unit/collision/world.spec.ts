import RAPIER from '@dimforge/rapier3d-compat';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { ZylemWorld, type CollisionPair } from '../../../src/lib/collision/world';
import { createBox } from '../../../src/lib/entities/box';
import { createSphere } from '../../../src/lib/entities/sphere';
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
		const world = new ZylemWorld(null as any, 60);
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
		const world = new ZylemWorld(null as any, 60);
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

});

describe('ZylemWorld fixed-step pose history', () => {
	beforeAll(async () => {
		await RAPIER.init();
	});

	it('tracks previous and current poses for direct-mode interpolation', () => {
		const physicsWorld = new RAPIER.World({ x: 0, y: 0, z: 0 });
		const world = new ZylemWorld(physicsWorld, 60);
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
		const world = new ZylemWorld(physicsWorld, 60);
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
		const world = new ZylemWorld(physicsWorld, 60);
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
