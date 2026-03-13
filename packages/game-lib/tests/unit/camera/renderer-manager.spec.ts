import { Vector2 } from 'three';
import { describe, expect, it } from 'vitest';

import { RendererManager } from '../../../src/lib/camera/renderer-manager';

describe('RendererManager', () => {
	it('converts animation loop timestamps into delta seconds', () => {
		const manager = new RendererManager(new Vector2(800, 600));
		let animationLoop: ((timestamp: number) => void) | null = null;
		const deltas: number[] = [];

		manager.renderer = {
			setAnimationLoop(callback: ((timestamp: number) => void) | null) {
				animationLoop = callback;
			},
		} as any;

		manager.startRenderLoop((deltaSeconds) => {
			deltas.push(deltaSeconds);
		});

		animationLoop?.(1000);
		animationLoop?.(1016.6666667);

		expect(deltas[0]).toBe(0);
		expect(deltas[1]).toBeCloseTo(1 / 60, 5);
	});
});
