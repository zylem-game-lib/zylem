import { describe, expect, it, vi } from 'vitest';

import { BridgeChannel } from '../src/channel';
import { applySwatchesToSelection } from '../src/swatches';
import type {
	EntityPickResultPayload,
	EntitySwatchAppliedPayload,
} from '../src/protocol';

async function nextFlush(): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, 25));
}

function pickResult(requestId: string): EntityPickResultPayload {
	return { requestId, hit: null };
}

function applied(opId: string): EntitySwatchAppliedPayload {
	return {
		opId,
		results: [{ uuid: 'entity-1', kind: 'shader', source: 'createLava', ok: true }],
	};
}

describe('swatch pick / apply messages', () => {
	it('coalesces entity:pick so only the latest pointer position survives a frame', async () => {
		const channel = new BridgeChannel();
		const handler = vi.fn();
		channel.on('entity:pick', handler);

		channel.queue('entity:pick', { requestId: 'r1', ndc: { x: 0, y: 0 } });
		channel.queue('entity:pick', { requestId: 'r2', ndc: { x: 0.5, y: 0.5 } });
		await nextFlush();

		expect(handler).toHaveBeenCalledTimes(1);
		expect(handler.mock.calls[0]?.[0]).toEqual({
			requestId: 'r2',
			ndc: { x: 0.5, y: 0.5 },
		});
	});

	it('delivers every entity:pick:result instead of merging replies', () => {
		const channel = new BridgeChannel();
		const handler = vi.fn();
		channel.on('entity:pick:result', handler);

		channel.queue('entity:pick:result', pickResult('r1'));
		channel.queue('entity:pick:result', pickResult('r2'));

		expect(handler).toHaveBeenCalledTimes(2);
		expect(handler.mock.calls.map(([payload]) => payload.requestId)).toEqual([
			'r1',
			'r2',
		]);
	});

	it('delivers every entity:swatch-applied ack', () => {
		const channel = new BridgeChannel();
		const handler = vi.fn();
		channel.on('entity:swatch-applied', handler);

		channel.queue('entity:swatch-applied', applied('op-1'));
		channel.queue('entity:swatch-applied', applied('op-2'));

		expect(handler).toHaveBeenCalledTimes(2);
	});

	it('does not retain request/response swatch traffic for late subscribers', () => {
		const channel = new BridgeChannel();

		channel.send('entity:pick', { requestId: 'r1', ndc: { x: 0, y: 0 } });
		channel.send('entity:pick:result', pickResult('r1'));
		channel.send('entity:apply-swatch', {
			uuids: ['entity-1'],
			swatches: [{ kind: 'shader', source: 'createLava', props: {} }],
		});
		channel.send('entity:swatch-applied', applied('op-1'));

		expect(channel.getState('entity:pick')).toBeUndefined();
		expect(channel.getState('entity:pick:result')).toBeUndefined();
		expect(channel.getState('entity:apply-swatch')).toBeUndefined();
		expect(channel.getState('entity:swatch-applied')).toBeUndefined();
	});

	it('retains pick mode so a late game side can hydrate it', () => {
		const channel = new BridgeChannel();
		channel.send('pick:mode:set', { enabled: true });
		expect(channel.getState('pick:mode:set')).toEqual({ enabled: true });
	});
});

describe('applySwatchesToSelection', () => {
	const lava = { kind: 'shader' as const, source: 'createLava', props: {} };

	it('targets every uuid in the retained selection with one batch message', () => {
		const channel = new BridgeChannel();
		const handler = vi.fn();
		channel.on('entity:apply-swatch', handler);
		channel.send('entity:selection', {
			selectedUuid: 'a',
			hoveredUuid: null,
			selectedUuids: ['a', 'b'],
		});

		expect(applySwatchesToSelection(channel, [lava], { opId: 'op-1' })).toBe(true);
		expect(handler).toHaveBeenCalledWith({ opId: 'op-1', uuids: ['a', 'b'], swatches: [lava] });
	});

	it('falls back to the single selectedUuid for older publishers', () => {
		const channel = new BridgeChannel();
		const handler = vi.fn();
		channel.on('entity:apply-swatch', handler);
		channel.send('entity:selection', { selectedUuid: 'a', hoveredUuid: null });

		applySwatchesToSelection(channel, [lava]);
		expect(handler.mock.calls[0]?.[0]).toMatchObject({ uuids: ['a'] });
	});

	it('sends nothing when the selection is empty', () => {
		const channel = new BridgeChannel();
		const handler = vi.fn();
		channel.on('entity:apply-swatch', handler);

		expect(applySwatchesToSelection(channel, [lava])).toBe(false);
		expect(handler).not.toHaveBeenCalled();
	});
});
