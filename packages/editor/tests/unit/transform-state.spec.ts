import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getZylemBridge, type SnapSettingsPayload } from '@zylem/bridge';

import {
	connectTransformState,
	DEFAULT_ROTATE_SNAP,
	setGridVisible,
	setSnapEnabled,
	setSnapIncrements,
	transformState,
} from '../../src/components/transform/transform-state';

const DEFAULTS = {
	enabled: true,
	translate: 0.25,
	rotate: DEFAULT_ROTATE_SNAP,
	scale: 0.1,
	gridVisible: false,
};

let snapMessages: SnapSettingsPayload[];
let gridMessages: boolean[];
let stopCapture: Array<() => void> = [];
let disconnect: (() => void) | null = null;

/** Valtio batches its notifications, so changes land a microtask later. */
async function settle(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
}

beforeEach(() => {
	const { channel } = getZylemBridge();
	channel.reset();
	Object.assign(transformState, DEFAULTS);

	snapMessages = [];
	gridMessages = [];
	stopCapture = [
		channel.on('snap:set', (payload) => snapMessages.push(payload)),
		channel.on('grid:set', ({ visible }) => gridMessages.push(visible)),
	];
});

afterEach(() => {
	disconnect?.();
	disconnect = null;
	for (const stop of stopCapture) stop();
	stopCapture = [];
});

describe('defaults', () => {
	it('matches the documented increments', () => {
		expect(transformState.translate).toBe(0.25);
		expect((transformState.rotate * 180) / Math.PI).toBeCloseTo(15);
		expect(transformState.scale).toBe(0.1);
		expect(transformState.enabled).toBe(true);
	});
});

describe('setSnapIncrements', () => {
	it('updates the given axes only', () => {
		setSnapIncrements({ translate: 0.5 });

		expect(transformState.translate).toBe(0.5);
		expect(transformState.scale).toBe(0.1);
	});

	it('rejects zero and negative increments', () => {
		setSnapIncrements({ translate: 0, scale: -1 });

		// A non-positive increment would snap every value onto zero.
		expect(transformState.translate).toBe(0.25);
		expect(transformState.scale).toBe(0.1);
	});
});

describe('connectTransformState', () => {
	it('pushes the current settings once on connect', () => {
		disconnect = connectTransformState();

		// A game that started with different defaults is brought into line
		// without waiting for the user to touch anything.
		expect(snapMessages).toHaveLength(1);
		expect(snapMessages[0]).toEqual({
			enabled: true,
			translate: 0.25,
			rotate: DEFAULT_ROTATE_SNAP,
			scale: 0.1,
		});
		expect(gridMessages).toEqual([false]);
	});

	it('mirrors a snap toggle to the game', async () => {
		disconnect = connectTransformState();
		snapMessages.length = 0;

		setSnapEnabled(false);
		await settle();

		expect(snapMessages.at(-1)?.enabled).toBe(false);
	});

	it('mirrors increment changes to the game', async () => {
		disconnect = connectTransformState();
		snapMessages.length = 0;

		setSnapIncrements({ translate: 1 });
		await settle();

		expect(snapMessages.at(-1)?.translate).toBe(1);
	});

	it('sends grid visibility only when it actually changes', async () => {
		disconnect = connectTransformState();
		gridMessages.length = 0;

		setSnapEnabled(false);
		await settle();
		// A snap change is not a grid change.
		expect(gridMessages).toEqual([]);

		setGridVisible(true);
		await settle();
		expect(gridMessages).toEqual([true]);
	});

	it('stops mirroring once disconnected', async () => {
		const stop = connectTransformState();
		stop();
		snapMessages.length = 0;

		setSnapEnabled(false);
		await settle();

		expect(snapMessages).toHaveLength(0);
	});

	it('installs only once while connected', () => {
		disconnect = connectTransformState();
		const second = connectTransformState();
		snapMessages.length = 0;

		// The second call is inert, so releasing it must not tear down the live
		// subscription.
		second();
		setSnapEnabled(false);

		expect(() => disconnect?.()).not.toThrow();
	});
});
