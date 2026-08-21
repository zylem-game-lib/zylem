// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getZylemBridge } from '@zylem/bridge';

import {
	installTransformToolGuard,
	releaseOrphanedTransformTool,
} from '../../src/components/toolbar/transform-tool-guard';
import {
	getDebugTool,
	setDebugTool,
	setSelectedEntityId,
} from '../../src/components/entities/entities-state';

let toolMessages: string[];
let stopCapture: Array<() => void> = [];
let uninstall: (() => void) | null = null;

/** Valtio batches notifications into a microtask. */
function settle(): Promise<void> {
	return Promise.resolve();
}

beforeEach(() => {
	const { channel } = getZylemBridge();
	channel.reset();
	setDebugTool('none');
	setSelectedEntityId(null);

	toolMessages = [];
	stopCapture = [channel.on('tool:set', ({ tool }) => toolMessages.push(tool))];
});

afterEach(() => {
	uninstall?.();
	uninstall = null;
	for (const stop of stopCapture) stop();
	stopCapture = [];
});

describe('releaseOrphanedTransformTool', () => {
	it('drops a transform tool left without a selection', () => {
		setDebugTool('translate');

		expect(releaseOrphanedTransformTool()).toBe(true);
		expect(getDebugTool()).toBe('none');
		// The game has to hear about it too, or its gizmo stays up and the
		// simulation stays paused.
		expect(toolMessages).toEqual(['none']);
	});

	it('keeps the tool while something is still selected', () => {
		setSelectedEntityId('entity-1');
		setDebugTool('scale');

		expect(releaseOrphanedTransformTool()).toBe(false);
		expect(getDebugTool()).toBe('scale');
	});

	it('leaves non-transform tools alone', () => {
		// Add and select work with nothing selected, so an empty selection is no
		// reason to disarm them.
		for (const tool of ['none', 'select', 'add'] as const) {
			setDebugTool(tool);
			expect(releaseOrphanedTransformTool()).toBe(false);
			expect(getDebugTool()).toBe(tool);
		}
		expect(toolMessages).toEqual([]);
	});
});

describe('installTransformToolGuard', () => {
	it('releases the tool when the selection is cleared', async () => {
		setSelectedEntityId('entity-1');
		setDebugTool('rotate');
		uninstall = installTransformToolGuard();

		setSelectedEntityId(null);
		await settle();

		expect(getDebugTool()).toBe('none');
	});

	it('holds the tool across a change from one entity to another', async () => {
		setSelectedEntityId('entity-1');
		setDebugTool('rotate');
		uninstall = installTransformToolGuard();

		setSelectedEntityId('entity-2');
		await settle();

		expect(getDebugTool()).toBe('rotate');
	});

	it('releases a tool that was already orphaned at install', () => {
		setDebugTool('translate');

		uninstall = installTransformToolGuard();

		expect(getDebugTool()).toBe('none');
	});

	it('installs nothing when disabled', async () => {
		setSelectedEntityId('entity-1');
		setDebugTool('translate');
		uninstall = installTransformToolGuard({ enabled: false });

		setSelectedEntityId(null);
		await settle();

		expect(getDebugTool()).toBe('translate');
	});

	it('stops watching once uninstalled', async () => {
		setSelectedEntityId('entity-1');
		setDebugTool('translate');
		const stop = installTransformToolGuard();
		stop();

		setSelectedEntityId(null);
		await settle();

		expect(getDebugTool()).toBe('translate');
	});
});

/**
 * How the gizmo buttons arm with nothing selected: they pick the last entity
 * worked on, select it, and only then set the tool. The guard is watching the
 * whole time, so it must not undo that in the same breath.
 */
describe('arming from an empty selection', () => {
	it('survives the guard when the selection is set first', async () => {
		uninstall = installTransformToolGuard();

		setSelectedEntityId('entity-1');
		setDebugTool('rotate');
		await settle();

		expect(getDebugTool()).toBe('rotate');
		expect(toolMessages).toEqual([]);
	});

	it('survives the guard with the tool set first, because valtio batches', async () => {
		// Documenting the reason the order is safe rather than merely lucky:
		// notifications are delivered in a microtask, so the guard only ever sees
		// the state both writes left behind. It would matter if a write ever
		// landed after an await.
		uninstall = installTransformToolGuard();

		setDebugTool('rotate');
		setSelectedEntityId('entity-1');
		await settle();

		expect(getDebugTool()).toBe('rotate');
	});

	it('is released when the selection lands a microtask too late', async () => {
		// The hazard the ordering guards against, made explicit: once the guard has
		// run against an empty selection the tool is gone, and the game has been
		// told, so the button would look armed for one frame and then not be.
		uninstall = installTransformToolGuard();

		setDebugTool('rotate');
		await settle();
		setSelectedEntityId('entity-1');

		expect(getDebugTool()).toBe('none');
		expect(toolMessages).toEqual(['none']);
	});

	it('releases the tool again if the entity it armed on is deleted', async () => {
		// Why the guard stays even though the buttons are always present now:
		// nothing else unpauses the simulation when the gizmo's target disappears.
		uninstall = installTransformToolGuard();
		setSelectedEntityId('entity-1');
		setDebugTool('scale');
		await settle();

		setSelectedEntityId(null);
		await settle();

		expect(getDebugTool()).toBe('none');
	});
});
