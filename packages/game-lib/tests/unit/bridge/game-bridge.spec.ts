import { afterEach, describe, expect, it, vi } from 'vitest';
import { getZylemBridge, type EntitySummaryPayload } from '@zylem/bridge';

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
			setPose: vi.fn().mockReturnValue(true),
			setPosition: vi.fn(),
		};
		bridge.connect({ resolveEntity: () => entity as any });

		channel.send('entity:transform', {
			uuid: 'entity-1',
			position: { x: 1, y: 2, z: 3 },
			rotation: { x: 0, y: 0.5, z: 0 },
			scale: { x: 2, y: 3, z: 4 },
		});

		expect(entity.setPose).toHaveBeenCalledWith({
			position: { x: 1, y: 2, z: 3 },
			rotation: expect.objectContaining({
				y: expect.closeTo(Math.sin(0.25), 6),
				w: expect.closeTo(Math.cos(0.25), 6),
			}),
		});
		expect(scale).toMatchObject({ x: 2, y: 3, z: 4 });
	});

	it('teleports rather than nudging, so an absolute target is not treated as a delta', () => {
		// `setPosition` accumulates a delta into the transform store, so feeding
		// it an absolute target would displace the entity by its own coordinates.
		const entity = {
			uuid: 'entity-1',
			setPose: vi.fn().mockReturnValue(true),
			setPosition: vi.fn(),
			setRotationX: vi.fn(),
			setRotationY: vi.fn(),
			setRotationZ: vi.fn(),
		};
		bridge.connect({ resolveEntity: () => entity as any });

		channel.send('entity:transform', {
			uuid: 'entity-1',
			position: { x: 10, y: 0, z: 0 },
		});

		expect(entity.setPose).toHaveBeenCalledTimes(1);
		expect(entity.setPosition).not.toHaveBeenCalled();
		expect(entity.setRotationY).not.toHaveBeenCalled();
	});

	it('prefers the authoritative quaternion over euler angles when both arrive', () => {
		const entity = { uuid: 'entity-1', setPose: vi.fn().mockReturnValue(true) };
		bridge.connect({ resolveEntity: () => entity as any });

		const quaternion = { x: 0, y: 0.7071, z: 0, w: 0.7071 };
		channel.send('entity:transform', {
			uuid: 'entity-1',
			rotation: { x: 1, y: 1, z: 1 },
			quaternion,
		});

		expect(entity.setPose).toHaveBeenCalledWith({
			position: undefined,
			rotation: quaternion,
		});
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

	it('echoes the settled transform back so the editor list is not left stale', async () => {
		// `entity:upsert` is otherwise only published when an entity is added, so
		// the list and inspector kept showing the pose an entity spawned with.
		// The pose is read back off the entity rather than reflected from the
		// command, so a game that clamps or rests the entity elsewhere corrects
		// the editor instead of silently disagreeing with it.
		const upserts: EntitySummaryPayload[][] = [];
		// Released before the test ends: a lingering subscriber would look like
		// an attached editor to the demand gates.
		const unsubscribe = channel.on('entity:upsert', (payload) => upserts.push(payload));

		const entity = {
			uuid: 'entity-1',
			name: 'Crate',
			setPose: vi.fn().mockReturnValue(true),
			getPose: () => ({
				position: { x: 1, y: 0.5, z: 3 },
				rotation: { x: 0, y: 0, z: 0, w: 1 },
			}),
		};
		bridge.connect({ resolveEntity: () => entity as any });

		channel.send('entity:transform', {
			uuid: 'entity-1',
			position: { x: 1, y: 9, z: 3 },
		});
		await flushBridge();

		expect(upserts.flat()).toContainEqual(
			expect.objectContaining({
				uuid: 'entity-1',
				name: 'Crate',
				position: { x: 1, y: 0.5, z: 3 },
			}),
		);
		unsubscribe();
	});

	it('leaves thumbnails and bounds out of a transform echo', async () => {
		// The editor merges an upsert field by field and skips absent ones, so
		// omitting these is what stops a move from wiping an entity's thumbnail.
		const upserts: EntitySummaryPayload[][] = [];
		const unsubscribe = channel.on('entity:upsert', (payload) => upserts.push(payload));

		const entity = {
			uuid: 'entity-1',
			setPose: vi.fn().mockReturnValue(true),
			getPose: () => null,
		};
		bridge.connect({ resolveEntity: () => entity as any });

		channel.send('entity:transform', { uuid: 'entity-1', position: { x: 0, y: 1, z: 0 } });
		await flushBridge();

		const echoed = upserts.flat()[0]!;
		expect(echoed).not.toHaveProperty('thumbnail');
		expect(echoed).not.toHaveProperty('bounds');
		unsubscribe();
	});

	it('skips the transform echo when no editor is listening', () => {
		const entity = {
			uuid: 'entity-1',
			setPose: vi.fn().mockReturnValue(true),
			getPose: () => null,
		};
		bridge.connect({ resolveEntity: () => entity as any });

		channel.send('entity:transform', { uuid: 'entity-1', position: { x: 0, y: 1, z: 0 } });

		// Building summaries is pure editor overhead, so it is demand-gated like
		// every other entity publish.
		expect(channel.getState('entity:upsert')).toBeUndefined();
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

	it('delivers every global changed in the same frame', async () => {
		const updates: { path: string; value: unknown }[] = [];
		channel.on('game:variable', ({ path, value }) => {
			updates.push({ path, value });
		});

		bridge.publishVariable({ path: 'score', value: 10 });
		bridge.publishVariable({ path: 'lives', value: 2 });
		await flushBridge();

		expect(updates).toEqual([
			{ path: 'score', value: 10 },
			{ path: 'lives', value: 2 },
		]);
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
		const stopWatching = bridge.onEditorAttached(onAttached);

		const unsubscribe = channel.on('entity:upsert', () => {});
		expect(onAttached).toHaveBeenCalledTimes(1);

		unsubscribe();
		stopWatching();
	});

	it('signals once per editor, not once per entity subscription', () => {
		const onAttached = vi.fn();
		const stopWatching = bridge.onEditorAttached(onAttached);

		// An editor mount subscribes to both entity streams; backfilling twice
		// would repeat the stage snapshot and every thumbnail render.
		const unsubscribes = [
			channel.on('entity:upsert', () => {}),
			channel.on('entity:thumbnail', () => {}),
		];
		expect(onAttached).toHaveBeenCalledTimes(1);

		for (const unsubscribe of unsubscribes) unsubscribe();
		channel.on('entity:upsert', () => {})();
		expect(onAttached).toHaveBeenCalledTimes(2);

		stopWatching();
	});
});
