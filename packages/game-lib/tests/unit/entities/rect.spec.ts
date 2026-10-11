import { OrthographicCamera, Vector2 } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createRect } from '../../../src/lib/entities/rect';

// An 8 × 6 view plane over an 800 × 600 viewport: 100 pixels per unit.
const PIXELS_PER_UNIT = 100;

function attachCamera(rect: any) {
	rect.rectSetup({
		camera: {
			camera: new OrthographicCamera(-4, 4, 3, -3, 0.1, 100),
			screenResolution: new Vector2(800, 600),
		},
	});
	rect.rectUpdate({});
}

/** The rect's on-screen box in pixels, read back from its camera-local transform. */
function screenBox(rect: any) {
	const { x, y } = rect.group.position;
	const { x: scaleX, y: scaleY } = rect._sprite.scale;
	const left = (x - scaleX / 2 + 4) * PIXELS_PER_UNIT;
	const top = (3 - y - scaleY / 2) * PIXELS_PER_UNIT;
	return {
		left,
		top,
		right: left + scaleX * PIXELS_PER_UNIT,
		bottom: top + scaleY * PIXELS_PER_UNIT,
	};
}

describe('ZylemRect placement', () => {
	it('treats screenPosition as the top-left pixel without a screen anchor', () => {
		const rect = createRect({ width: 100, height: 40 }) as any;
		attachCamera(rect);

		const box = screenBox(rect);
		expect(box.left).toBeCloseTo(24);
		expect(box.top).toBeCloseTo(24);
		expect(box.right).toBeCloseTo(124);
		expect(box.bottom).toBeCloseTo(64);
	});

	it('offsets from the screen anchor and stays inside that corner', () => {
		const rect = createRect({
			width: 100,
			height: 40,
			screenAnchor: 'bottom-right',
			screenPosition: { x: -10, y: -10 },
		}) as any;
		attachCamera(rect);

		const box = screenBox(rect);
		expect(box.right).toBeCloseTo(790);
		expect(box.bottom).toBeCloseTo(590);
	});

	it('centres on a centre anchor', () => {
		const rect = createRect({
			width: 100,
			height: 40,
			screenAnchor: 'top-center',
			screenPosition: { x: 0, y: 16 },
		}) as any;
		attachCamera(rect);

		const box = screenBox(rect);
		expect((box.left + box.right) / 2).toBeCloseTo(400);
		expect(box.top).toBeCloseTo(16);
	});

	it('lets an explicit anchor override the screen anchor pivot', () => {
		const rect = createRect({
			width: 100,
			height: 40,
			screenAnchor: 'bottom-right',
			screenPosition: { x: -110, y: -50 },
			anchor: { x: 0, y: 0 },
		}) as any;
		attachCamera(rect);

		const box = screenBox(rect);
		expect(box.left).toBeCloseTo(690);
		expect(box.top).toBeCloseTo(550);
	});
});

class FakeImage {
	static created: FakeImage[] = [];
	crossOrigin: string | null = null;
	src = '';
	onload: (() => void) | null = null;

	constructor() {
		FakeImage.created.push(this);
	}
}

describe('ZylemRect drawing', () => {
	beforeEach(() => {
		FakeImage.created = [];
		vi.stubGlobal('Image', FakeImage);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('draws an ellipse inscribed in the box', () => {
		const rect = createRect({ width: 100, height: 40, shape: 'ellipse' }) as any;
		const ellipse = vi.spyOn(rect._ctx, 'ellipse');
		const box = vi.spyOn(rect._ctx, 'rect');

		rect.updateRect({});

		expect(ellipse).toHaveBeenCalledWith(50, 20, 50, 20, 0, 0, Math.PI * 2);
		expect(box).not.toHaveBeenCalled();
	});

	it('keeps anti-aliased edges and translucent fills', () => {
		const rect = createRect({ shape: 'ellipse', fillColor: 'rgba(0, 0, 0, 0.4)' }) as any;

		expect(rect._sprite.material.alphaTest).toBeLessThan(0.4);
	});

	it('draws a loaded image clipped to the shape', () => {
		const rect = createRect({
			width: 64,
			height: 64,
			shape: 'ellipse',
			image: 'portrait.png',
		}) as any;
		const image = FakeImage.created.find((created) => created.src === 'portrait.png');
		const clip = vi.spyOn(rect._ctx, 'clip');
		const drawImage = vi.spyOn(rect._ctx, 'drawImage');

		image?.onload?.();

		expect(drawImage).toHaveBeenCalledWith(image, 0, 0, 64, 64);
		expect(clip).toHaveBeenCalled();
		expect(clip.mock.invocationCallOrder[0]).toBeLessThan(
			drawImage.mock.invocationCallOrder[0],
		);
	});

	it('ignores an image that finishes loading after it was replaced', () => {
		const rect = createRect({ width: 64, height: 64, image: 'first.png' }) as any;
		rect.updateRect({ image: 'second.png' });
		const first = FakeImage.created.find((created) => created.src === 'first.png');
		const second = FakeImage.created.find((created) => created.src === 'second.png');
		const drawImage = vi.spyOn(rect._ctx, 'drawImage');

		first?.onload?.();
		expect(drawImage).not.toHaveBeenCalled();

		second?.onload?.();
		expect(drawImage).toHaveBeenCalledWith(second, 0, 0, 64, 64);
	});
});
