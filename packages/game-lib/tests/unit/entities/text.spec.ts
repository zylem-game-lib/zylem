import {
	Group,
	OrthographicCamera,
	Sprite as ThreeSprite,
	SpriteMaterial,
	Vector2,
} from 'three';
import { describe, expect, it } from 'vitest';

import { createText } from '../../../src/lib/entities/text';

// An 8 × 6 view plane over an 800 × 600 viewport: 100 pixels per unit.
const PIXELS_PER_UNIT = 100;

/** Pins a 100 × 20 pixel text box to the viewport and returns its on-screen box. */
function placeOnScreen(text: any) {
	text._cameraRef = {
		camera: new OrthographicCamera(-4, 4, 3, -3, 0.1, 100),
		screenResolution: new Vector2(800, 600),
	};
	text._canvas = { width: 100, height: 20 };
	text._sprite = new ThreeSprite(new SpriteMaterial());
	text.group = new Group();
	text.updateStickyTransform();

	const { x, y } = text.group.position;
	const { x: scaleX, y: scaleY } = text._sprite.scale;
	const left = (x - scaleX / 2 + 4) * PIXELS_PER_UNIT;
	const top = (3 - y - scaleY / 2) * PIXELS_PER_UNIT;
	return {
		left,
		top,
		right: left + scaleX * PIXELS_PER_UNIT,
		bottom: top + scaleY * PIXELS_PER_UNIT,
	};
}

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

	it('centres unanchored text on its screen position', () => {
		const box = placeOnScreen(createText({ screenPosition: { x: 200, y: 100 } }));

		expect((box.left + box.right) / 2).toBeCloseTo(200);
		expect((box.top + box.bottom) / 2).toBeCloseTo(100);
		expect(box.right - box.left).toBeCloseTo(100);
		expect(box.bottom - box.top).toBeCloseTo(20);
	});

	it('reads unanchored 0..1 screen positions as viewport fractions', () => {
		const box = placeOnScreen(createText({ screenPosition: { x: 0.5, y: 0.25 } }));

		expect((box.left + box.right) / 2).toBeCloseTo(400);
		expect((box.top + box.bottom) / 2).toBeCloseTo(150);
	});

	it('aligns anchored text to its screen anchor', () => {
		const box = placeOnScreen(
			createText({ screenAnchor: 'top-right', screenPosition: { x: -8, y: 8 } }),
		);

		expect(box.right).toBeCloseTo(792);
		expect(box.top).toBeCloseTo(8);
	});

	it('treats anchored offsets as pixels, even between 0 and 1', () => {
		const box = placeOnScreen(
			createText({ screenAnchor: 'bottom-left', screenPosition: { x: 1, y: 0 } }),
		);

		expect(box.left).toBeCloseTo(1);
		expect(box.bottom).toBeCloseTo(600);
	});
});
