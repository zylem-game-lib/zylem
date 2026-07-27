import { describe, expect, it, vi } from 'vitest';

import { BridgeChannel, mergePayloads } from '../src/channel';
import { getZylemBridge } from '../src/registry';
import type { EntitySummaryPayload } from '../src/protocol';

function entity(uuid: string, x = 0): EntitySummaryPayload {
	return {
		uuid,
		name: uuid,
		type: 'actor',
		position: { x, y: 0, z: 0 },
		rotation: { x: 0, y: 0, z: 0 },
		scale: { x: 1, y: 1, z: 1 },
	};
}

async function nextFlush(): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, 25));
}

describe('mergePayloads', () => {
	it('merges uuid-keyed arrays by uuid with later entries winning', () => {
		const merged = mergePayloads(
			[entity('a', 1), entity('b', 2)],
			[entity('b', 9), entity('c', 3)],
		);
		expect(merged.map((e) => e.uuid)).toEqual(['a', 'b', 'c']);
		expect(merged[1].position.x).toBe(9);
	});

	it('unions uuids arrays on plain objects', () => {
		const merged = mergePayloads({ uuids: ['a', 'b'] }, { uuids: ['b', 'c'] });
		expect(merged.uuids).toEqual(['a', 'b', 'c']);
	});

	it('shallow-merges plain objects', () => {
		const merged = mergePayloads(
			{ paused: true, debug: false } as { paused?: boolean; debug?: boolean },
			{ debug: true },
		);
		expect(merged).toEqual({ paused: true, debug: true });
	});
});

describe('BridgeChannel', () => {
	it('send dispatches immediately to subscribers', () => {
		const channel = new BridgeChannel();
		const handler = vi.fn();
		channel.on('debug:set', handler);
		channel.send('debug:set', { enabled: true });
		expect(handler).toHaveBeenCalledWith({ enabled: true });
	});

	it('on returns an unsubscribe function', () => {
		const channel = new BridgeChannel();
		const handler = vi.fn();
		const unsubscribe = channel.on('debug:set', handler);
		unsubscribe();
		channel.send('debug:set', { enabled: true });
		expect(handler).not.toHaveBeenCalled();
	});

	it('queue coalesces multiple payloads into one flush per frame', async () => {
		const channel = new BridgeChannel();
		const handler = vi.fn();
		channel.on('entity:upsert', handler);

		channel.queue('entity:upsert', [entity('a', 1)]);
		channel.queue('entity:upsert', [entity('a', 2)]);
		channel.queue('entity:upsert', [entity('b', 3)]);

		expect(handler).not.toHaveBeenCalled();
		await nextFlush();

		expect(handler).toHaveBeenCalledTimes(1);
		const payload = handler.mock.calls[0][0] as EntitySummaryPayload[];
		expect(payload.map((e) => e.uuid)).toEqual(['a', 'b']);
		expect(payload[0].position.x).toBe(2);
	});

	it('retains last payload for getState hydration', () => {
		const channel = new BridgeChannel();
		channel.send('game:status', { paused: true });
		expect(channel.getState('game:status')).toEqual({ paused: true });
	});

	it('accumulates uuid-keyed array state across sends', () => {
		const channel = new BridgeChannel();
		channel.send('entity:upsert', [entity('a')]);
		channel.send('entity:upsert', [entity('b')]);
		const state = channel.getState('entity:upsert');
		expect(state?.map((e) => e.uuid)).toEqual(['a', 'b']);
	});

	it('caps retained uuid-keyed state so it cannot grow unbounded', () => {
		const channel = new BridgeChannel();
		for (let i = 0; i < 2_500; i += 1) {
			channel.send('entity:upsert', [entity(`e${i}`)]);
		}
		expect(channel.retainedSize('entity:upsert')).toBe(2_000);
		// Oldest entries are dropped, newest are kept.
		const state = channel.getState('entity:upsert');
		expect(state?.at(-1)?.uuid).toBe('e2499');
		expect(state?.some((e) => e.uuid === 'e0')).toBe(false);
	});
});

describe('BridgeChannel subscriber awareness', () => {
	it('reports whether a message type has listeners', () => {
		const channel = new BridgeChannel();
		expect(channel.hasSubscribers('entity:upsert')).toBe(false);

		const unsubscribe = channel.on('entity:upsert', () => {});
		expect(channel.hasSubscribers('entity:upsert')).toBe(true);
		expect(channel.subscriberCount('entity:upsert')).toBe(1);

		unsubscribe();
		expect(channel.hasSubscribers('entity:upsert')).toBe(false);
	});

	it('counts multiple subscribers and ignores repeated unsubscribes', () => {
		const channel = new BridgeChannel();
		const first = channel.on('entity:upsert', () => {});
		channel.on('entity:upsert', () => {});
		expect(channel.subscriberCount('entity:upsert')).toBe(2);

		first();
		first();
		expect(channel.subscriberCount('entity:upsert')).toBe(1);
	});

	it('notifies when a type gains its first subscriber', () => {
		const channel = new BridgeChannel();
		const onAdded = vi.fn();
		channel.onSubscriberAdded(onAdded);

		channel.on('entity:thumbnail', () => {});
		channel.on('entity:thumbnail', () => {});

		// Only the transition from zero subscribers fires a backfill signal.
		expect(onAdded).toHaveBeenCalledTimes(1);
		expect(onAdded).toHaveBeenCalledWith('entity:thumbnail');
	});
});

describe('getZylemBridge', () => {
	it('returns the same instance across calls (realm-safe registry)', () => {
		expect(getZylemBridge()).toBe(getZylemBridge());
	});

	it('prunes removed entities from retained upsert state', () => {
		const { channel } = getZylemBridge();
		channel.reset();
		channel.send('entity:upsert', [entity('a'), entity('b')]);
		channel.send('entity:removed', { uuids: ['a'] });
		const state = channel.getState('entity:upsert');
		expect(state?.map((e) => e.uuid)).toEqual(['b']);
	});

	it('clears incremental entity state on a fresh stage snapshot', () => {
		const { channel } = getZylemBridge();
		channel.reset();
		channel.send('entity:upsert', [entity('a')]);
		channel.send('stage:snapshot', { stage: null, entities: [] });
		expect(channel.getState('entity:upsert')).toBeUndefined();
	});
});
