import { describe, expect, it } from 'vitest';
import type { IWorld } from 'bitecs';

import { ScreenWrapBehavior } from '../../../src/lib/behaviors/screen-wrap/screen-wrap.descriptor';

function createBody(x: number, y: number) {
	const position = { x, y, z: 0 };
	return {
		translation: () => position,
		setTranslation: (next: { x: number; y: number; z: number }) => {
			position.x = next.x;
			position.y = next.y;
			position.z = next.z;
		},
	};
}

function runWrapUpdate(x: number, y: number) {
	const entity = { body: createBody(x, y) };
	const ref: any = {
		descriptor: ScreenWrapBehavior,
		options: { width: 20, height: 15, centerX: 0, centerY: 0, edgeThreshold: 2 },
	};
	const system = ScreenWrapBehavior.systemFactory({
		world: {},
		ecs: {} as IWorld,
		scene: null,
		getBehaviorLinks: (key: symbol) =>
			key === ScreenWrapBehavior.key ? [{ entity, ref }] : [],
	});

	system.update({} as IWorld, 1 / 60);
	return { entity, ref };
}

describe('ScreenWrapBehavior', () => {
	it('wraps from right to left', () => {
		const { entity } = runWrapUpdate(11, 0);
		expect(entity.body.translation().x).toBeLessThan(0);
	});

	it('wraps from left to right', () => {
		const { entity } = runWrapUpdate(-11, 0);
		expect(entity.body.translation().x).toBeGreaterThan(0);
	});

	it('wraps from top to bottom', () => {
		const { entity } = runWrapUpdate(0, 8);
		expect(entity.body.translation().y).toBeLessThan(0);
	});

	it('wraps from bottom to top', () => {
		const { entity } = runWrapUpdate(0, -8);
		expect(entity.body.translation().y).toBeGreaterThan(0);
	});
});
