import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { createSprite } from '../../../src/lib/entities/sprite';

describe('ZylemSprite', () => {
	it('applies initial sprite scale and visibility during create', () => {
		const sprite = createSprite({
			size: new Vector3(2, 3, 1),
			images: [
				{ name: 'idle', file: '/sprite-idle.png' },
				{ name: 'alt', file: '/sprite-alt.png' },
			],
		}) as any;

		sprite.create();

		expect(sprite.sprites).toHaveLength(2);
		expect(sprite.sprites[0].visible).toBe(true);
		expect(sprite.sprites[1].visible).toBe(false);
		expect(sprite.sprites[0].scale.x).toBe(2);
		expect(sprite.sprites[0].scale.y).toBe(3);
		expect(sprite.sprites[0].scale.z).toBe(1);
	});

	it('uses queued rotation for the spawn frame before physics sync catches up', () => {
		const sprite = createSprite({
			images: [{ name: 'idle', file: '/sprite-idle.png' }],
		}) as any;

		sprite.create();
		sprite.body = {
			rotation: () => ({ x: 0, y: 0, z: 0, w: 1 }),
		};

		sprite.setRotationZ(Math.PI / 4);
		sprite.spriteUpdate({} as any);

		expect(sprite.group.rotation.z).toBeCloseTo(Math.PI / 4);
		expect(sprite.sprites[0].material.rotation).toBeCloseTo(Math.PI / 4);
	});

	it('applies sprite material rotation during setup before the first update', () => {
		const sprite = createSprite({
			images: [{ name: 'idle', file: '/sprite-idle.png' }],
		}) as any;

		sprite.create();
		sprite.body = {
			rotation: () => ({ x: 0, y: 0, z: 0, w: 1 }),
		};

		sprite.prependSetup(({ me }: { me: any }) => {
			me.setRotationZ(Math.PI / 3);
		});

		sprite.nodeSetup({ me: sprite, globals: {} });

		expect(sprite.sprites[0].material.rotation).toBeCloseTo(Math.PI / 3);
	});
});

describe('ZylemSprite sheets', () => {
	const sheet = {
		file: '/atlas.png',
		columns: 4,
		rows: 2,
		frames: ['a', 'b', 'c', null, 'd', 'e', null, null],
	};

	const createSheetSprite = (overrides: Record<string, unknown> = {}) => {
		const sprite = createSprite({ sheet, ...overrides }) as any;
		sprite.create();
		return sprite;
	};

	it('renders a sheet as a single sprite showing the first named frame', () => {
		const sprite = createSheetSprite();

		expect(sprite.sprites).toHaveLength(1);
		const { repeat, offset } = sprite.sprites[0].material.map;
		expect(repeat.x).toBeCloseTo(0.25);
		expect(repeat.y).toBeCloseTo(0.5);
		expect(offset.x).toBeCloseTo(0);
		expect(offset.y).toBeCloseTo(0.5);
	});

	it('maps frame names to their cell UV window', () => {
		const sprite = createSheetSprite();

		sprite.setSprite('c');
		expect(sprite.sprites[0].material.map.offset.x).toBeCloseTo(0.5);
		expect(sprite.sprites[0].material.map.offset.y).toBeCloseTo(0.5);

		// Row 1 is the lower half of the texture, since frames pack top-down but
		// UVs originate bottom-left.
		sprite.setSprite('e');
		expect(sprite.sprites[0].material.map.offset.x).toBeCloseTo(0.25);
		expect(sprite.sprites[0].material.map.offset.y).toBeCloseTo(0);
	});

	it('mirrors a sheet frame by inverting its UV window', () => {
		const sprite = createSheetSprite();

		sprite.setSprite('b');
		sprite.setFlipX(true);

		expect(sprite.isFlippedX()).toBe(true);
		expect(sprite.sprites[0].material.map.repeat.x).toBeCloseTo(-0.25);
		expect(sprite.sprites[0].material.map.offset.x).toBeCloseTo(0.5);

		sprite.setFlipX(false);
		expect(sprite.sprites[0].material.map.repeat.x).toBeCloseTo(0.25);
		expect(sprite.sprites[0].material.map.offset.x).toBeCloseTo(0.25);
	});

	it('keeps the flip applied when the frame changes', () => {
		const sprite = createSheetSprite();

		sprite.setFlipX(true);
		sprite.setSprite('c');

		expect(sprite.sprites[0].material.map.repeat.x).toBeCloseTo(-0.25);
		expect(sprite.sprites[0].material.map.offset.x).toBeCloseTo(0.75);
	});
});

describe('ZylemSprite animations', () => {
	const animated = () => {
		const sprite = createSprite({
			sheet: {
				file: '/atlas.png',
				columns: 3,
				rows: 2,
				frames: ['a', 'b', 'c', 'd', 'e', null],
			},
			animations: [
				{ name: 'long', frames: ['a', 'b', 'c', 'd'], speed: 0.1, loop: true },
				{ name: 'short', frames: ['e'], speed: 0.1, loop: false },
				{ name: 'once', frames: ['a', 'b'], speed: 0.1, loop: false },
			],
		}) as any;
		sprite.create();
		return sprite;
	};

	it('advances one frame per elapsed duration', () => {
		const sprite = animated();

		sprite.setAnimation('long', 0);
		expect(sprite.currentAnimationFrame).toBe('a');

		sprite.setAnimation('long', 0.1);
		expect(sprite.currentAnimationFrame).toBe('b');

		sprite.setAnimation('long', 0.25);
		expect(sprite.currentAnimationFrame).toBe('d');
	});

	it('wraps looping clips and holds the last frame of non-looping ones', () => {
		const sprite = animated();

		sprite.setAnimation('long', 0);
		sprite.setAnimation('long', 0.4);
		expect(sprite.currentAnimationFrame).toBe('a');

		sprite.setAnimation('once', 0);
		sprite.setAnimation('once', 5);
		expect(sprite.currentAnimationFrame).toBe('b');
	});

	it('restarts from frame zero when switching clips', () => {
		const sprite = animated();

		sprite.setAnimation('long', 0);
		sprite.setAnimation('long', 0.35);
		expect(sprite.currentAnimationIndex).toBe(3);

		// A stale index would read past the end of the shorter clip.
		expect(() => sprite.setAnimation('short', 0.016)).not.toThrow();
		expect(sprite.currentAnimationIndex).toBe(0);
		expect(sprite.currentAnimationFrame).toBe('e');
	});
});
