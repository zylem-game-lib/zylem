import type { LevelBuffer } from '@zylem/bridge';
import { afterEach, describe, expect, it } from 'vitest';

import { clearEntityRegistry, registerEntityType } from '../../../src/lib/entities/entity-registry';
import { streamLevel } from '../../../src/lib/level/stream-level';
import { streamLevelOnStage } from '../../../src/lib/level/stream-level-stage';

function buffer(ids: string[]): LevelBuffer {
	return {
		version: 1,
		entries: ids.map((id) => ({ id, typeId: id, pose: {} })),
	};
}

/** Drain microtasks without waiting for the MessageChannel yield between batches. */
async function flushMicrotasks(): Promise<void> {
	for (let i = 0; i < 20; i += 1) {
		await Promise.resolve();
	}
}

describe('streamLevel', () => {
	it('hands entries to spawn in buffer order', async () => {
		const order: string[] = [];
		const result = await streamLevel(buffer(['box', 'sphere', 'cone']), (entry) => {
			order.push(entry.typeId);
		});

		expect(order).toEqual(['box', 'sphere', 'cone']);
		expect(result).toEqual({ spawned: 3 });
	});

	it('yields between batches so the rest of the buffer waits a turn', async () => {
		const turns: number[] = [];
		let turn = 0;
		const pending = streamLevel(buffer(['a', 'b', 'c', 'd', 'e', 'f']), (entry) => {
			turns.push(turn);
			expect(entry.id).toBe(['a', 'b', 'c', 'd', 'e', 'f'][turns.length - 1]);
		}, { batchSize: 5 });

		await flushMicrotasks();
		expect(turns).toEqual([0, 0, 0, 0, 0]);

		turn = 1;
		await pending;
		expect(turns).toEqual([0, 0, 0, 0, 0, 1]);
	});
});

describe('streamLevelOnStage', () => {
	afterEach(() => {
		clearEntityRegistry();
	});

	it('spawns a known catalog type, applies its pose, and skips an unknown type', async () => {
		const spawned: unknown[] = [];
		const poses: unknown[] = [];
		const scales: number[][] = [];
		let createdAt: { x: number; y: number; z: number } | null = null;

		registerEntityType({
			id: 'box',
			label: 'Box',
			create: ({ position }) => {
				createdAt = { x: position.x, y: position.y, z: position.z };
				return {
					setPose: (pose: unknown) => {
						poses.push(pose);
						return true;
					},
					setScale: (x: number, y: number, z: number) => {
						scales.push([x, y, z]);
					},
					getScale: () => ({ x: 2, y: 2, z: 2 }),
				} as never;
			},
		});

		const result = await streamLevelOnStage(
			{
				spawnEntity: (node) => {
					spawned.push(node);
				},
			},
			{
				version: 1,
				entries: [
					{
						id: 'crate',
						typeId: 'box',
						pose: {
							position: { x: 1, y: 2, z: 3 },
							scale: { x: 2, y: 2, z: 2 },
						},
					},
					{ id: 'ghost', typeId: 'missing', pose: {} },
				],
			},
		);

		expect(spawned).toHaveLength(1);
		expect(createdAt).toEqual({ x: 1, y: 2, z: 3 });
		expect(poses).toEqual([{ position: { x: 1, y: 2, z: 3 }, rotation: undefined }]);
		expect(scales).toEqual([[2, 2, 2]]);
		expect(result.spawned).toBe(2);
	});
});
