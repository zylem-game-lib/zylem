import { afterEach, describe, expect, it, vi } from 'vitest';
import { getZylemBridge } from '@zylem/bridge';

import { GameBridge } from '../../../src/lib/bridge/game-bridge';
import {
	debugState,
	setDebugTool,
	setPaused,
	setSelectedEntityId,
} from '../../../src/lib/debug/debug-state';

/** Wait for valtio's microtask notification plus the channel's RAF flush. */
async function flushBridge(): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, 30));
}

describe('GameBridge command intake', () => {
	const bridge = new GameBridge();
	const { channel } = getZylemBridge();

	afterEach(() => {
		bridge.disconnect();
		channel.reset();
		debugState.enabled = false;
		setDebugTool('none');
		setPaused(false);
		debugState.selectedEntityId = null;
	});

	it('applies debug/tool/playback commands to game debug state', () => {
		bridge.connect({ resolveEntity: () => null });

		channel.send('debug:set', { enabled: true });
		expect(debugState.enabled).toBe(true);

		channel.send('tool:set', { tool: 'translate' });
		expect(debugState.tool).toBe('translate');

		channel.send('playback:set', { paused: true });
		expect(debugState.paused).toBe(true);
	});

	it('stores the selected entity by uuid, never the live entity', () => {
		const fakeEntity = { uuid: 'entity-1' };
		bridge.connect({
			resolveEntity: (uuid) => (uuid === 'entity-1' ? (fakeEntity as any) : null),
		});

		// Assigning a live entity into the valtio proxy would deep-proxy the
		// whole scene graph, so only the uuid may be stored.
		channel.send('entity:select', { uuid: 'entity-1' });
		expect(debugState.selectedEntityId).toBe('entity-1');

		channel.send('entity:select', { uuid: null });
		expect(debugState.selectedEntityId).toBeNull();
	});

	it('applies every component of an entity transform, including scale', () => {
		const scale = {
			x: 1,
			y: 1,
			z: 1,
			set(x: number, y: number, z: number) {
				this.x = x;
				this.y = y;
				this.z = z;
			},
		};
		const entity = {
			uuid: 'entity-1',
			group: { scale },
			setPosition: vi.fn(),
			setRotationX: vi.fn(),
			setRotationY: vi.fn(),
			setRotationZ: vi.fn(),
		};
		bridge.connect({ resolveEntity: () => entity as any });

		channel.send('entity:transform', {
			uuid: 'entity-1',
			position: { x: 1, y: 2, z: 3 },
			rotation: { x: 0, y: 0.5, z: 0 },
			scale: { x: 2, y: 3, z: 4 },
		});

		expect(entity.setPosition).toHaveBeenCalledWith(1, 2, 3);
		expect(entity.setRotationY).toHaveBeenCalledWith(0.5);
		expect(scale).toMatchObject({ x: 2, y: 3, z: 4 });
	});

	it('prefers a setScale mutator when the entity exposes one', () => {
		const entity = { uuid: 'entity-1', setScale: vi.fn() };
		bridge.connect({ resolveEntity: () => entity as any });

		channel.send('entity:transform', {
			uuid: 'entity-1',
			scale: { x: 5, y: 6, z: 7 },
		});

		expect(entity.setScale).toHaveBeenCalledWith(5, 6, 7);
	});

	it('stops applying commands after disconnect', () => {
		bridge.connect({ resolveEntity: () => null });
		bridge.disconnect();

		channel.send('debug:set', { enabled: true });
		expect(debugState.enabled).toBe(false);
	});

	it('publishes stage snapshots for late-subscriber hydration', () => {
		bridge.publishStageSnapshot({ stage: null, entities: [] });
		expect(channel.getState('stage:snapshot')).toEqual({
			stage: null,
			entities: [],
		});
	});
});

describe('GameBridge game → editor sync', () => {
	const bridge = new GameBridge();
	const { channel } = getZylemBridge();

	afterEach(() => {
		bridge.disconnect();
		channel.reset();
		debugState.enabled = false;
		setDebugTool('none');
		setPaused(false);
		debugState.selectedEntityId = null;
		debugState.hoveredEntityId = null;
	});

	it('publishes selections made inside the game', async () => {
		const selections: (string | null)[] = [];
		channel.on('entity:selection', ({ selectedUuid }) => {
			selections.push(selectedUuid);
		});
		bridge.connect({ resolveEntity: () => null });

		setSelectedEntityId('scene-picked');
		await flushBridge();

		expect(selections).toContain('scene-picked');
	});

	it('does not echo a selection the editor just commanded', async () => {
		const selections: (string | null)[] = [];
		channel.on('entity:selection', ({ selectedUuid }) => {
			selections.push(selectedUuid);
		});
		bridge.connect({ resolveEntity: () => null });
		await flushBridge();
		selections.length = 0;

		channel.send('entity:select', { uuid: 'from-editor' });
		await flushBridge();

		expect(selections).toEqual([]);
	});

	it('publishes debug and pause status changes made inside the game', async () => {
		const statuses: { paused?: boolean; debug?: boolean }[] = [];
		channel.on('game:status', (status) => statuses.push(status));
		bridge.connect({ resolveEntity: () => null });
		await flushBridge();
		statuses.length = 0;

		setPaused(true);
		debugState.enabled = true;
		await flushBridge();

		expect(statuses).toContainEqual(
			expect.objectContaining({ paused: true, debug: true }),
		);
	});
});

describe('GameBridge demand gating', () => {
	const bridge = new GameBridge();
	const { channel } = getZylemBridge();

	afterEach(() => {
		bridge.disconnect();
		channel.reset();
	});

	it('reports no demand when nothing is subscribed', () => {
		expect(bridge.wantsThumbnails()).toBe(false);
		expect(bridge.wantsEntityUpdates()).toBe(false);
	});

	it('reports demand once an editor subscribes', () => {
		const unsubscribe = channel.on('entity:thumbnail', () => {});
		expect(bridge.wantsThumbnails()).toBe(true);

		unsubscribe();
		expect(bridge.wantsThumbnails()).toBe(false);
	});

	it('signals when an editor attaches so the game can backfill', () => {
		const onAttached = vi.fn();
		bridge.onEditorAttached(onAttached);

		channel.on('entity:upsert', () => {});
		expect(onAttached).toHaveBeenCalledTimes(1);
	});
});
