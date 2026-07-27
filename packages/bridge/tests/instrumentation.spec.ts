import { afterEach, describe, expect, it, vi } from 'vitest';

import { BridgeChannel } from '../src/channel';
import { bridgeDebug } from '../src/instrumentation';

afterEach(() => {
	bridgeDebug.disable();
	bridgeDebug.reset();
	vi.restoreAllMocks();
});

describe('bridge instrumentation', () => {
	it('records nothing while disabled', () => {
		const channel = new BridgeChannel();
		channel.send('debug:set', { enabled: true });
		expect(bridgeDebug.stats()).toEqual([]);
	});

	it('counts sends, deliveries, and subscribers once enabled', () => {
		bridgeDebug.enable();
		const channel = new BridgeChannel();
		channel.on('debug:set', () => {});
		channel.on('debug:set', () => {});

		channel.send('debug:set', { enabled: true });
		channel.send('debug:set', { enabled: false });

		const entry = bridgeDebug.stats().find((s) => s.type === 'debug:set');
		expect(entry?.sent).toBe(2);
		expect(entry?.delivered).toBe(4);
		expect(entry?.listeners).toBe(2);
		expect(entry?.bytes).toBeGreaterThan(0);
	});

	it('reports the fraction of queued messages coalescing removed', async () => {
		bridgeDebug.enable();
		const channel = new BridgeChannel();
		channel.on('game:variable', () => {});

		for (let i = 0; i < 4; i += 1) {
			channel.queue('game:variable', { path: 'score', value: i });
		}
		await new Promise((resolve) => setTimeout(resolve, 25));

		const entry = bridgeDebug.stats().find((s) => s.type === 'game:variable');
		expect(entry?.queued).toBe(4);
		expect(entry?.sent).toBe(1);
		expect(entry?.coalesced).toBeCloseTo(0.75);
	});

	it('warns once when a handler re-sends the message it is handling', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		bridgeDebug.enable();
		const channel = new BridgeChannel();

		let depth = 0;
		channel.on('debug:set', ({ enabled }) => {
			// Guard the recursion so the test terminates; the tracer should
			// still flag the reentrancy.
			if (depth++ > 2) return;
			channel.send('debug:set', { enabled: !enabled });
		});
		channel.send('debug:set', { enabled: true });

		expect(warn).toHaveBeenCalledTimes(1);
		expect(String(warn.mock.calls[0]?.[0])).toContain('Feedback loop');
	});

	it('keeps a bounded tail of recent events', () => {
		bridgeDebug.enable();
		const channel = new BridgeChannel();
		channel.send('debug:set', { enabled: true });
		channel.send('playback:set', { paused: true });

		const tail = bridgeDebug.tail(10);
		expect(tail.map((e) => e.type)).toEqual(['debug:set', 'playback:set']);
		expect(tail[0]?.kind).toBe('send');
	});

	it('tags flushed messages distinctly from direct sends', async () => {
		bridgeDebug.enable();
		const channel = new BridgeChannel();
		channel.queue('game:status', { paused: true });
		await new Promise((resolve) => setTimeout(resolve, 25));

		const kinds = bridgeDebug.tail(10).map((e) => e.kind);
		expect(kinds).toContain('queue');
		expect(kinds).toContain('flush');
	});
});
