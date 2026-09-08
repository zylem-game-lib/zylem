import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	getZylemBridge,
	type EntityPickResultPayload,
	type EntitySummaryPayload,
	type EntitySwatchAppliedPayload,
	type SceneOperationPayload,
} from '@zylem/bridge';

import {
	GameBridge,
	swatchOperationLabel,
	type SwatchApplyOutcome,
} from '../../../src/lib/bridge/game-bridge';
import { debugState, setPickMode } from '../../../src/lib/debug/debug-state';

const summary = (uuid: string, name = uuid): EntitySummaryPayload => ({
	uuid,
	name,
	type: 'Box',
	position: { x: 0, y: 0, z: 0 },
	rotation: { x: 0, y: 0, z: 0 },
	scale: { x: 1, y: 1, z: 1 },
});

const lava = { kind: 'shader' as const, source: 'createLava', props: {} };

describe('GameBridge swatch picking', () => {
	const bridge = new GameBridge();
	const { channel } = getZylemBridge();

	afterEach(() => {
		bridge.disconnect();
		channel.reset();
		setPickMode(false);
		debugState.selectedEntityId = null;
		debugState.selectedEntityIds = [];
	});

	it('arms and disarms pick mode from the editor', () => {
		bridge.connect({ resolveEntity: () => null });

		channel.send('pick:mode:set', { enabled: true });
		expect(debugState.pickMode).toBe(true);

		channel.send('pick:mode:set', { enabled: false });
		expect(debugState.pickMode).toBe(false);
	});

	it('answers every pick with its requestId and the host hit', () => {
		const pickEntity = vi.fn((ndc: { x: number; y: number }) =>
			ndc.x > 0 ? summary('box-1', 'Crate') : null,
		);
		bridge.connect({ resolveEntity: () => null, pickEntity });
		const results: EntityPickResultPayload[] = [];
		const stop = channel.on('entity:pick:result', (result) => results.push(result));

		channel.send('entity:pick', { requestId: 'r1', ndc: { x: 0.5, y: 0 } });
		channel.send('entity:pick', { requestId: 'r2', ndc: { x: -0.5, y: 0 } });

		expect(results).toEqual([
			{ requestId: 'r1', hit: expect.objectContaining({ uuid: 'box-1', name: 'Crate' }) },
			{ requestId: 'r2', hit: null },
		]);
		stop();
	});

	it('answers null when the host cannot pick', () => {
		bridge.connect({ resolveEntity: () => null });
		const results: EntityPickResultPayload[] = [];
		const stop = channel.on('entity:pick:result', (result) => results.push(result));

		channel.send('entity:pick', { requestId: 'r1', ndc: { x: 0, y: 0 } });

		expect(results).toEqual([{ requestId: 'r1', hit: null }]);
		stop();
	});
});

describe('GameBridge swatch application', () => {
	const bridge = new GameBridge();
	const { channel } = getZylemBridge();

	afterEach(() => {
		bridge.disconnect();
		channel.reset();
		debugState.selectedEntityId = null;
		debugState.selectedEntityIds = [];
	});

	function collect() {
		const acks: EntitySwatchAppliedPayload[] = [];
		const ops: SceneOperationPayload[] = [];
		const stops = [
			channel.on('entity:swatch-applied', (ack) => acks.push(ack)),
			channel.on('scene:operation', (op) => ops.push(op)),
		];
		return { acks, ops, stop: () => stops.forEach((stop) => stop()) };
	}

	it('forwards the batch to the host with a minted opId and acks the results', () => {
		const applySwatches = vi.fn(
			(payload): SwatchApplyOutcome => ({
				results: [{ uuid: 'box-1', kind: 'shader', source: 'createLava', ok: true }],
				entries: [{ uuid: 'box-1', swatch: payload.swatches[0] }],
			}),
		);
		bridge.connect({ resolveEntity: () => null, applySwatches });
		const { acks, ops, stop } = collect();

		channel.send('entity:apply-swatch', { uuids: ['box-1'], swatches: [lava] });

		expect(applySwatches).toHaveBeenCalledWith(
			expect.objectContaining({ uuids: ['box-1'], swatches: [lava], opId: expect.any(String) }),
		);
		const opId = applySwatches.mock.calls[0]![0].opId;
		expect(ops).toEqual([
			expect.objectContaining({ opId, kind: 'swatch', entries: [{ uuid: 'box-1', swatch: lava }] }),
		]);
		expect(acks).toEqual([
			{ opId, results: [{ uuid: 'box-1', kind: 'shader', source: 'createLava', ok: true }] },
		]);
		stop();
	});

	it('honours an editor-minted opId', () => {
		bridge.connect({
			resolveEntity: () => null,
			applySwatches: () => ({ results: [], entries: [] }),
		});
		const { acks, stop } = collect();

		channel.send('entity:apply-swatch', { opId: 'mine', uuids: [], swatches: [] });

		expect(acks[0]?.opId).toBe('mine');
		stop();
	});

	it('selects the successful targets only, when asked', () => {
		bridge.connect({
			resolveEntity: () => null,
			applySwatches: () => ({
				results: [
					{ uuid: 'box-1', kind: 'shader', source: 'createLava', ok: true },
					{ uuid: 'light-1', kind: 'shader', source: 'createLava', ok: false, reason: 'no-material' },
					{ uuid: 'box-2', kind: 'shader', source: 'createLava', ok: true },
				],
				entries: [
					{ uuid: 'box-1', swatch: lava },
					{ uuid: 'box-2', swatch: lava },
				],
			}),
		});

		channel.send('entity:apply-swatch', {
			uuids: ['box-1', 'light-1', 'box-2'],
			swatches: [lava],
			select: true,
		});

		expect(debugState.selectedEntityIds).toEqual(['box-1', 'box-2']);
		expect(debugState.selectedEntityId).toBe('box-1');
	});

	it('does not touch selection when nothing was applied or select is off', () => {
		bridge.connect({
			resolveEntity: () => null,
			applySwatches: () => ({
				results: [{ uuid: 'box-1', kind: 'shader', source: 'createLava', ok: true }],
				entries: [{ uuid: 'box-1', swatch: lava }],
			}),
		});
		const { ops, stop } = collect();

		channel.send('entity:apply-swatch', { uuids: ['box-1'], swatches: [lava] });
		expect(debugState.selectedEntityIds).toEqual([]);

		bridge.disconnect();
		bridge.connect({
			resolveEntity: () => null,
			applySwatches: () => ({
				results: [{ uuid: 'ghost', kind: 'shader', source: 'createLava', ok: false, reason: 'entity-not-found' }],
				entries: [],
			}),
		});
		channel.send('entity:apply-swatch', { uuids: ['ghost'], swatches: [lava], select: true });
		expect(debugState.selectedEntityIds).toEqual([]);
		// A batch with no successes has nothing to undo.
		expect(ops).toHaveLength(1);
		stop();
	});

	it('reports every pair as entity-not-found when the host cannot apply swatches', () => {
		bridge.connect({ resolveEntity: () => null });
		const { acks, ops, stop } = collect();

		channel.send('entity:apply-swatch', {
			uuids: ['a', 'b'],
			swatches: [lava, { kind: 'behavior', source: 'Thruster', props: {} }],
		});

		expect(acks[0]?.results).toHaveLength(4);
		expect(acks[0]?.results.every((result) => !result.ok && result.reason === 'entity-not-found')).toBe(true);
		expect(ops).toEqual([]);
		stop();
	});

	it('does not record an operation while an undo/redo is being applied', () => {
		const applySceneOperation = vi.fn(() => {
			// A redo re-applies through the same message; that must not push a
			// second operation onto the editor's stack.
			channel.send('entity:apply-swatch', { uuids: ['box-1'], swatches: [lava] });
		});
		bridge.connect({
			resolveEntity: () => null,
			applySceneOperation,
			applySwatches: () => ({
				results: [{ uuid: 'box-1', kind: 'shader', source: 'createLava', ok: true }],
				entries: [{ uuid: 'box-1', swatch: lava }],
			}),
		});
		const { acks, ops, stop } = collect();

		channel.send('scene:operation:apply', {
			op: { opId: 'op', kind: 'swatch', label: 'Apply', entries: [] },
			direction: 'redo',
		});

		expect(applySceneOperation).toHaveBeenCalledTimes(1);
		expect(ops).toEqual([]);
		expect(acks).toHaveLength(1);
		stop();
	});

	it('labels operations by swatch and target', () => {
		const names = new Map([['box-1', 'Crate']]);
		const resolveName = (uuid: string) => names.get(uuid);

		expect(
			swatchOperationLabel({ uuids: ['box-1'], swatches: [lava] }, [{ uuid: 'box-1' }], resolveName),
		).toBe('Apply createLava to Crate');
		expect(
			swatchOperationLabel(
				{ uuids: ['box-1', 'box-2'], swatches: [lava, { kind: 'behavior', source: 'Thruster', props: {} }] },
				[{ uuid: 'box-1' }, { uuid: 'box-2' }],
				resolveName,
			),
		).toBe('Apply createLava, Thruster to 2 entities');
	});
});
