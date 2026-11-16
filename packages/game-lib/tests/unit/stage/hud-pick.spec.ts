import { Group, Object3D, OrthographicCamera, Sprite as ThreeSprite, SpriteMaterial, Vector2 } from 'three';
import { describe, expect, it } from 'vitest';

import { isHudEntity, viewportRect } from '../../../src/lib/entities/screen-anchor';
import { createText } from '../../../src/lib/entities/text';
import { hudRectOf, pickHud, rectHoldsPointer } from '../../../src/lib/stage/hud-pick';

const VIEWPORT = { width: 800, height: 600 };

/** NDC for a point in viewport pixels from the top-left. */
function ndcAt(x: number, y: number) {
	return { x: (x / VIEWPORT.width) * 2 - 1, y: 1 - (y / VIEWPORT.height) * 2 };
}

/** A stand-in HUD element drawn at a fixed box, hung off `camera`. */
function hudBox(
	camera: Object3D,
	box: { left: number; top: number; width: number; height: number },
	options: { zDistance?: number } = {},
) {
	const group = new Group();
	camera.add(group);
	return {
		group,
		options: { stickToViewport: true, ...options },
		getScreenRect: () => ({
			left: box.left / VIEWPORT.width,
			top: box.top / VIEWPORT.height,
			width: box.width / VIEWPORT.width,
			height: box.height / VIEWPORT.height,
		}),
	};
}

describe('viewportRect', () => {
	it('lays the box out from its pivot, as fractions of the viewport', () => {
		expect(
			viewportRect({ x: 400, y: 300 }, { x: 0.5, y: 0.5 }, { width: 200, height: 60 }, VIEWPORT),
		).toEqual({ left: 0.375, top: 0.45, width: 0.25, height: 0.1 });
		expect(
			viewportRect({ x: 800, y: 600 }, { x: 1, y: 1 }, { width: 80, height: 60 }, VIEWPORT),
		).toEqual({ left: 0.9, top: 0.9, width: 0.1, height: 0.1 });
	});
});

describe('text screen rect', () => {
	it('is the box the sprite is drawn in', () => {
		const text = createText({ screenPosition: { x: 200, y: 100 } }) as any;
		text._cameraRef = {
			camera: new OrthographicCamera(-4, 4, 3, -3, 0.1, 100),
			screenResolution: new Vector2(VIEWPORT.width, VIEWPORT.height),
		};
		text._canvas = { width: 100, height: 20 };
		text._sprite = new ThreeSprite(new SpriteMaterial());
		text.group = new Group();
		text.updateStickyTransform();

		expect(isHudEntity(text)).toBe(true);
		const rect = text.getScreenRect();
		expect(rect.left).toBeCloseTo(150 / 800, 6);
		expect(rect.top).toBeCloseTo(90 / 600, 6);
		expect(rect.width).toBeCloseTo(100 / 800, 6);
		expect(rect.height).toBeCloseTo(20 / 600, 6);
	});

	it('is not a HUD element when it lives in the world', () => {
		expect(isHudEntity(createText({ stickToViewport: false }))).toBe(false);
	});
});

describe('rectHoldsPointer', () => {
	const rect = { left: 0.25, top: 0.5, width: 0.25, height: 0.1 };

	it('reads NDC with +y up against a box measured from the top', () => {
		expect(rectHoldsPointer(rect, ndcAt(300, 330))).toBe(true);
		expect(rectHoldsPointer(rect, ndcAt(300, 270))).toBe(false);
		expect(rectHoldsPointer(rect, ndcAt(190, 330))).toBe(false);
		expect(rectHoldsPointer(rect, ndcAt(410, 330))).toBe(false);
	});
});

describe('pickHud', () => {
	it('picks the element under the pointer and nothing off it', () => {
		const camera = new OrthographicCamera();
		const entities = new Map<string, unknown>([
			['score', hudBox(camera, { left: 10, top: 10, width: 100, height: 20 })],
			['lives', hudBox(camera, { left: 690, top: 10, width: 100, height: 20 })],
		]);

		expect(pickHud(entities, camera, ndcAt(50, 20))).toBe('score');
		expect(pickHud(entities, camera, ndcAt(700, 15))).toBe('lives');
		expect(pickHud(entities, camera, ndcAt(400, 300))).toBeNull();
	});

	it('picks the one drawn on top where two overlap', () => {
		const camera = new OrthographicCamera();
		const panel = hudBox(camera, { left: 0, top: 0, width: 400, height: 200 });
		const label = hudBox(camera, { left: 20, top: 20, width: 100, height: 20 });
		// Added later draws over what was added before at the same depth.
		expect(pickHud(new Map([['panel', panel], ['label', label]]), camera, ndcAt(50, 30))).toBe('label');

		// Nearer the lens draws over what is further away, whatever the order.
		const near = hudBox(camera, { left: 0, top: 0, width: 400, height: 200 }, { zDistance: 0.5 });
		expect(pickHud(new Map([['near', near], ['label', label]]), camera, ndcAt(50, 30))).toBe('near');
	});

	it('passes over what is not on the rendering camera', () => {
		const gameCamera = new OrthographicCamera();
		const editorCamera = new OrthographicCamera();
		const entities = new Map<string, unknown>([
			['score', hudBox(gameCamera, { left: 10, top: 10, width: 100, height: 20 })],
		]);

		expect(pickHud(entities, editorCamera, ndcAt(50, 20))).toBeNull();
		expect(pickHud(entities, gameCamera, ndcAt(50, 20))).toBe('score');
	});

	it('passes over hidden elements, world entities, and empty boxes', () => {
		const camera = new OrthographicCamera();
		const hidden = hudBox(camera, { left: 10, top: 10, width: 100, height: 20 });
		hidden.group.visible = false;
		const world = { group: new Group(), options: {} };
		camera.add(world.group);
		const empty = hudBox(camera, { left: 10, top: 10, width: 0, height: 0 });
		const inWorld = {
			...hudBox(camera, { left: 10, top: 10, width: 100, height: 20 }),
			options: { stickToViewport: false },
		};

		const entities = new Map<string, unknown>([
			['hidden', hidden],
			['world', world],
			['empty', empty],
			['inWorld', inWorld],
		]);
		expect(pickHud(entities, camera, ndcAt(50, 20))).toBeNull();
		expect(hudRectOf(world, camera)).toBeNull();
	});
});
