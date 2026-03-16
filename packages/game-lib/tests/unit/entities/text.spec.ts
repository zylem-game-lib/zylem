import { Sprite as ThreeSprite, SpriteMaterial } from 'three';
import { describe, expect, it } from 'vitest';

import { createText } from '../../../src/lib/entities/text';

describe('ZylemText', () => {
	it('sizes world-space text sprites from the canvas aspect ratio', () => {
		const text = createText({
			fontSize: 32,
			stickToViewport: false,
		}) as any;
		const sprite = new ThreeSprite(new SpriteMaterial());

		text._canvas = { width: 320, height: 64 };
		text._sprite = sprite;
		text.updateWorldSpriteScale();

		const canvas = text._canvas as { width: number; height: number };
		const expectedScaleY = 1;
		const expectedScaleX = expectedScaleY * (canvas.width / canvas.height);

		expect(sprite).toBeDefined();
		expect(sprite.scale.y).toBeCloseTo(expectedScaleY, 5);
		expect(sprite.scale.x).toBeCloseTo(expectedScaleX, 5);
		expect(sprite.scale.x).toBeGreaterThan(sprite.scale.y);
	});

	it('recomputes world-space sprite width when the text changes', () => {
		const text = createText({
			fontSize: 32,
			stickToViewport: false,
		}) as any;
		const sprite = new ThreeSprite(new SpriteMaterial());

		text._canvas = { width: 64, height: 64 };
		text._sprite = sprite;
		text.updateWorldSpriteScale();
		const initialWidth = sprite.scale.x;

		text._canvas = { width: 256, height: 64 };
		text.updateWorldSpriteScale();

		expect(sprite.scale.x).toBeGreaterThan(initialWidth);
		expect(sprite.scale.y).toBeCloseTo(1, 5);
	});
});
