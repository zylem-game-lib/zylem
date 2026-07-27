import { describe, expect, it, vi } from 'vitest';
import { Object3D } from 'three';

import { EntityThumbnailCache } from '../../../src/lib/debug/entity-thumbnail';

/**
 * Exercise the cache's scheduling and eviction without touching WebGPU by
 * stubbing the private `render` step with a resolved fake result.
 */
function createCache(options?: {
	maxEntries?: number;
	onRenderStart?: () => void;
	onRenderEnd?: () => void;
}): EntityThumbnailCache {
	const cache = new EntityThumbnailCache(8, options?.maxEntries ?? 256);
	// A renderer must be present for `ensure` to schedule work.
	cache.setRenderer({} as any);
	(cache as any).render = async (uuid: string) => {
		options?.onRenderStart?.();
		await Promise.resolve();
		options?.onRenderEnd?.();
		return {
			uuid,
			dataUrl: `data:image/png;base64,${uuid}`,
			bounds: { width: 1, height: 1, depth: 1 },
		};
	};
	return cache;
}

describe('EntityThumbnailCache', () => {
	it('renders one thumbnail at a time', async () => {
		let active = 0;
		let peak = 0;
		const cache = createCache({
			onRenderStart: () => {
				active += 1;
				peak = Math.max(peak, active);
			},
			onRenderEnd: () => {
				active -= 1;
			},
		});

		await Promise.all(
			Array.from({ length: 8 }, (_, i) =>
				cache.ensure(`e${i}`, new Object3D()),
			),
		);

		expect(peak).toBe(1);
		expect(cache.cacheSize).toBe(8);
	});

	it('evicts least-recently-used entries beyond the cap', async () => {
		const cache = createCache({ maxEntries: 3 });

		for (const uuid of ['a', 'b', 'c']) {
			await cache.ensure(uuid, new Object3D());
		}
		// Reading 'a' makes 'b' the least recently used.
		cache.get('a');
		await cache.ensure('d', new Object3D());

		expect(cache.cacheSize).toBe(3);
		expect(cache.get('b')).toBeNull();
		expect(cache.get('a')).not.toBeNull();
		expect(cache.get('d')).not.toBeNull();
	});

	it('sheds the oldest requests when the queue overflows', async () => {
		const cache = createCache();
		const results = await Promise.all(
			Array.from({ length: 40 }, (_, i) =>
				cache.ensure(`e${i}`, new Object3D()),
			),
		);

		// The queue caps at 32, so the earliest requests resolve to null
		// instead of piling up work the game can never drain.
		expect(results.filter((r) => r === null).length).toBeGreaterThan(0);
		expect(cache.pendingCount).toBe(0);
	});

	it('returns the cached entry without re-rendering', async () => {
		const onRenderStart = vi.fn();
		const cache = createCache({ onRenderStart });

		await cache.ensure('a', new Object3D());
		await cache.ensure('a', new Object3D());

		expect(onRenderStart).toHaveBeenCalledTimes(1);
	});

	it('drops a queued render when the entity is invalidated', async () => {
		const cache = createCache();
		const first = cache.ensure('a', new Object3D());
		const second = cache.ensure('b', new Object3D());
		cache.invalidate('b');

		await expect(first).resolves.not.toBeNull();
		await expect(second).resolves.toBeNull();
	});
});
