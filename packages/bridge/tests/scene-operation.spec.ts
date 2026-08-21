import { describe, expect, it, vi } from 'vitest';

import { BridgeChannel } from '../src/channel';
import type {
	EntitySelectionPayload,
	EntityTypeDescriptor,
	SceneOperationPayload,
} from '../src/protocol';

function operation(opId: string, uuid = 'entity-1'): SceneOperationPayload {
	return {
		opId,
		kind: 'transform',
		label: `Move ${uuid}`,
		entries: [
			{
				uuid,
				before: { position: { x: 0, y: 0, z: 0 } },
				after: { position: { x: 1, y: 0, z: 0 } },
			},
		],
	};
}

function descriptor(id: string): EntityTypeDescriptor {
	return { id, label: id, group: 'Primitives' };
}

async function nextFlush(): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, 25));
}

describe('scene:operation delivery', () => {
	it('delivers every queued operation instead of coalescing them', async () => {
		const channel = new BridgeChannel();
		const handler = vi.fn();
		channel.on('scene:operation', handler);

		// Two commits in one frame: a fast drag-release-drag, or a placement
		// followed immediately by a move. Coalescing here would merge them into
		// one payload and lose an undo step.
		channel.queue('scene:operation', operation('op-1'));
		channel.queue('scene:operation', operation('op-2'));
		await nextFlush();

		expect(handler).toHaveBeenCalledTimes(2);
		expect(handler.mock.calls.map(([payload]) => payload.opId)).toEqual([
			'op-1',
			'op-2',
		]);
	});

	it('dispatches queued operations immediately rather than on the next frame', () => {
		const channel = new BridgeChannel();
		const handler = vi.fn();
		channel.on('scene:operation', handler);

		channel.queue('scene:operation', operation('op-1'));

		expect(handler).toHaveBeenCalledTimes(1);
	});

	it('does not retain operations for late subscribers', () => {
		const channel = new BridgeChannel();
		channel.send('scene:operation', operation('op-1'));

		// An editor connecting mid-session must not hydrate an already-applied
		// operation onto its undo stack.
		expect(channel.getState('scene:operation')).toBeUndefined();
	});

	it('keeps operations for distinct entities separate', async () => {
		const channel = new BridgeChannel();
		const handler = vi.fn();
		channel.on('scene:operation', handler);

		channel.queue('scene:operation', operation('op-1', 'entity-1'));
		channel.queue('scene:operation', operation('op-2', 'entity-2'));
		await nextFlush();

		expect(handler.mock.calls.map(([payload]) => payload.entries[0].uuid)).toEqual([
			'entity-1',
			'entity-2',
		]);
	});
});

describe('catalog:snapshot retention', () => {
	it('hydrates a late subscriber with the last published catalog', () => {
		const channel = new BridgeChannel();
		channel.send('catalog:snapshot', { entities: [descriptor('box')] });

		expect(channel.getState('catalog:snapshot')).toEqual({
			entities: [descriptor('box')],
		});
	});

	it('replaces the retained catalog rather than accumulating entries', () => {
		const channel = new BridgeChannel();
		channel.send('catalog:snapshot', { entities: [descriptor('box')] });
		channel.send('catalog:snapshot', { entities: [descriptor('sphere')] });

		// A re-publish is the full list: a type that was unregistered has to
		// disappear from the palette, not linger from the earlier snapshot.
		expect(channel.getState('catalog:snapshot')?.entities.map((e) => e.id)).toEqual([
			'sphere',
		]);
	});
});

describe('entity:selection compatibility', () => {
	it('carries both the single uuid and the full selection', () => {
		const channel = new BridgeChannel();
		const handler = vi.fn<(payload: EntitySelectionPayload) => void>();
		channel.on('entity:selection', handler);

		channel.send('entity:selection', {
			selectedUuid: 'a',
			selectedUuids: ['a', 'b'],
			hoveredUuid: null,
		});

		const payload = handler.mock.calls[0]![0];
		// `selectedUuid` is the first element of `selectedUuids`, so single-select
		// consumers keep working while multi-select rides along.
		expect(payload.selectedUuid).toBe('a');
		expect(payload.selectedUuids).toEqual(['a', 'b']);
	});

	it('retains selection state for hydration', () => {
		const channel = new BridgeChannel();
		channel.send('entity:selection', {
			selectedUuid: 'a',
			selectedUuids: ['a'],
			hoveredUuid: 'b',
		});

		expect(channel.getState('entity:selection')).toEqual({
			selectedUuid: 'a',
			selectedUuids: ['a'],
			hoveredUuid: 'b',
		});
	});
});
