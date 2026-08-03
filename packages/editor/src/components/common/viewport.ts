/**
 * Shared viewport size signal.
 *
 * Dock rects are derived from the viewport, and every docked panel has to
 * relayout together on resize, so one throttled signal drives them all rather
 * than each panel installing its own listener and reading `window` directly.
 */

import { createSignal } from 'solid-js';
import type { Viewport } from './dock-layout';

const readViewport = (): Viewport =>
	typeof window === 'undefined'
		? { width: 0, height: 0 }
		: { width: window.innerWidth, height: window.innerHeight };

const [viewportSize, setViewportSize] = createSignal<Viewport>(readViewport(), {
	equals: (a, b) => a.width === b.width && a.height === b.height,
});

if (typeof window !== 'undefined') {
	let frame: number | undefined;
	window.addEventListener('resize', () => {
		if (frame !== undefined) cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => {
			frame = undefined;
			setViewportSize(readViewport());
		});
	});
}

export { viewportSize };

/** Untracked read, for imperative paths like pointer math. */
export const currentViewport = readViewport;
