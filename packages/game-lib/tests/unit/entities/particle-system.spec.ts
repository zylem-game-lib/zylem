import { describe, expect, it } from 'vitest';

import { createParticleSystem } from '../../../src/lib/entities/particle-system';
import { particlePresets } from '../../../src/lib/behaviors/particle-emitter';

describe('ZylemParticleSystem', () => {
	it('clones without duplicating the built-in particle behavior', () => {
		const source = createParticleSystem({
			effect: particlePresets.burst(),
			autoplay: false,
		});

		const clone = source.clone({ name: 'clone-particles' });

		expect(source.getBehaviorRefs()).toHaveLength(1);
		expect(clone.getBehaviorRefs()).toHaveLength(1);
		expect(clone.options.name).toBe('clone-particles');
		expect(clone.uuid).not.toBe(source.uuid);
	});

	it('exposes particle control methods through the entity proxy', () => {
		const entity = createParticleSystem({
			effect: particlePresets.smoke(),
			autoplay: false,
		});

		expect(entity.isPlaying()).toBe(false);
		entity.play();
		expect(entity.isPlaying()).toBe(true);
		entity.pause();
		expect(entity.isPlaying()).toBe(false);
		entity.restart();
		expect(entity.isPlaying()).toBe(true);
		entity.stop();
		expect(entity.isPlaying()).toBe(false);
	});
});
