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
