import { afterEach, describe, expect, it } from 'vitest';
import { debugState } from '../../../src/lib/debug/debug-state';
import { GameDebugDelegate } from '../../../src/lib/game/game-debug-delegate';

const FPS_HOST_EVENT = 'zylem-fps-host';

function publishHost(element: HTMLElement | null): void {
	window.dispatchEvent(new CustomEvent(FPS_HOST_EVENT, { detail: { element } }));
}

describe('GameDebugDelegate', () => {
	const delegates: GameDebugDelegate[] = [];

	afterEach(() => {
		for (const delegate of delegates) delegate.dispose();
		delegates.length = 0;
		debugState.enabled = false;
		document.body.innerHTML = '';
	});

	it('mounts the FPS graph in the editor host and leaves the page alone', () => {
		debugState.enabled = true;
		delegates.push(new GameDebugDelegate());

		expect(document.body.childElementCount).toBe(0);

		const host = document.createElement('div');
		publishHost(host);

		expect(host.querySelector('canvas')).not.toBeNull();
		expect(document.body.childElementCount).toBe(0);

		publishHost(null);
		expect(host.querySelector('canvas')).toBeNull();
		expect(document.body.querySelector('canvas')).toBeNull();
	});

	it('removes the graph when debug mode turns off', async () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		debugState.enabled = true;
		delegates.push(new GameDebugDelegate());
		publishHost(host);

		expect(host.querySelector('canvas')).not.toBeNull();

		debugState.enabled = false;
		await Promise.resolve();
		expect(host.querySelector('canvas')).toBeNull();
	});
});
