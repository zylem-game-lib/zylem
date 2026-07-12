import { describe, expect, it, vi } from 'vitest';

import { ZylemWorld, type CollisionPair } from '../../../src/lib/collision/world';
import { createBox } from '../../../src/lib/entities/box';
import { createSphere } from '../../../src/lib/entities/sphere';

function registerEntities(world: ZylemWorld, ...entities: Array<ReturnType<typeof createSphere> | ReturnType<typeof createBox>>) {
	for (const entity of entities) {
		world.collisionMap.set(entity.uuid, entity as any);
	}
}

/**
 * Seed the world's live collision pairs (normally fed by simulation events)
 * and run one dispatch pass, mirroring what `update()` does each frame.
 */
function applyPairs(
	world: ZylemWorld,
	pairs: CollisionPair[],
	nowMs: number,
	delta = 1 / 60,
) {
	const live = (world as any).livePairs as Map<string, { uuidA: string; uuidB: string; contactCount: number; intersectionCount: number }>;
	live.clear();
	for (const pair of pairs) {
		if (pair.uuidA === pair.uuidB) continue;
		const uuidA = pair.uuidA < pair.uuidB ? pair.uuidA : pair.uuidB;
		const uuidB = pair.uuidA < pair.uuidB ? pair.uuidB : pair.uuidA;
		const key = `${uuidA}|${uuidB}`;
		let entry = live.get(key);
		if (!entry) {
			entry = { uuidA, uuidB, contactCount: 0, intersectionCount: 0 };
			live.set(key, entry);
		}
		if (pair.contactType === 'contact') {
			entry.contactCount += 1;
		} else {
			entry.intersectionCount += 1;
		}
	}
	(world as any).processCollisionPairs(delta, nowMs);
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

describe('ZylemWorld simulation-backed physics', () => {
	it('tracks previous and current poses for render interpolation', async () => {
		const world = await ZylemWorld.create({ x: 0, y: -9.81, z: 0 }, 60);
		const ball = createSphere({ name: 'ball' });

		world.addEntity(ball as any);
		ball.body?.setLinvel({ x: 6, y: 0, z: 0 }, true);

		world.update({ delta: 1 / 120 } as any);

		// Half a fixed step: no step taken yet, history collapses to spawn pose.
		let history = ball.body!.getPoseHistory();
		expect(world.interpolationAlpha).toBeCloseTo(0.5, 5);
		expect(history.previous.position.x).toBeCloseTo(0, 5);
		expect(history.current.position.x).toBeCloseTo(0, 5);

		world.update({ delta: 1 / 120 } as any);

		history = ball.body!.getPoseHistory();
		expect(world.interpolationAlpha).toBeCloseTo(0, 5);
		expect(history.current.position.x).toBeGreaterThan(history.previous.position.x);

		world.destroy();
	});

	it('collapses pose history after explicit body translations', async () => {
		const world = await ZylemWorld.create({ x: 0, y: -9.81, z: 0 }, 60);
		const ball = createSphere({ name: 'teleport-ball' });

		world.addEntity(ball as any);
		ball.body?.setTranslation({ x: 4, y: -2, z: 1 }, true);

		const history = ball.body!.getPoseHistory();
		expect(history.previous.position).toEqual({ x: 4, y: -2, z: 1 });
		expect(history.current.position).toEqual({ x: 4, y: -2, z: 1 });

		world.destroy();
	});

	it('clears entity physics references when bodies are destroyed', async () => {
		const world = await ZylemWorld.create({ x: 0, y: -9.81, z: 0 }, 60);
		const box = createBox({ name: 'cleanup-box' });

		world.addEntity(box as any);
		expect(box.body).not.toBeNull();
		expect(box.physicsAttached).toBe(true);

		world.destroyEntity(box as any);

		expect(box.body).toBeNull();
		expect(box.physicsAttached).toBe(false);

		world.destroy();
	});
});
