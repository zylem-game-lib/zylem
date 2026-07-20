import { AdditiveBlending, Scene, Texture, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { ParticleEmitterBehavior, particlePresets } from '@zylem/behaviors/particle-emitter';
import { create } from '../../../src/lib/entities/entity';
import { createParticleSystem } from '../../../src/lib/entities/particle-system';

// Note: the 2D canvas context the particle engine needs during construction is
// stubbed for the whole unit project via tests/setup/canvas-2d.ts.

/** One-shot (non-looping) burst effect with tight timing for lifecycle tests. */
function oneShotEffect(
	options: { duration?: number; life?: number; count?: number } = {},
) {
	return particlePresets.burst({
		duration: options.duration ?? 0.05,
		life: options.life ?? 0.05,
		count: options.count ?? 1,
	});
}

function createBehaviorHarness(options: {
	position?: Vector3;
	autoplay?: boolean;
} = {}) {
	const entity = create({
		position: options.position ?? new Vector3(1, 2, 3),
	});
	// fire.blaze loops, so the system stays "running" across lifecycle calls.
	const handle = entity.use(ParticleEmitterBehavior, {
		effect: particlePresets.fire.blaze(),
		autoplay: options.autoplay,
	});
	const ref = entity.getBehaviorRefs().at(-1)!;
	const links = [{ entity, ref }];
	const scene = { scene: new Scene() };
	const system = ParticleEmitterBehavior.systemFactory({
		world: {} as any,
		scene,
		getBehaviorLinks: () => links,
	});

	return { entity, handle, ref, scene, system };
}

describe('ParticleEmitterBehavior', () => {
	it('applies defaults and creates fresh particle systems from the effect definition', () => {
		const first = create({ position: new Vector3(1, 2, 3) });
		const second = create({ position: new Vector3(4, 5, 6) });
		const firstHandle = first.use(ParticleEmitterBehavior, { effect: oneShotEffect() });
		const secondHandle = second.use(ParticleEmitterBehavior, { effect: oneShotEffect() });
		const firstRef = first.getBehaviorRefs()[0]!;
		const secondRef = second.getBehaviorRefs()[0]!;
		const links = [
			{ entity: first, ref: firstRef },
			{ entity: second, ref: secondRef },
		];
		const scene = { scene: new Scene() };
		const system = ParticleEmitterBehavior.systemFactory({
			world: {} as any,
			scene,
			getBehaviorLinks: () => links,
		});

		expect(firstHandle.getOptions()).toMatchObject({
			autoplay: true,
			followPosition: true,
			followRotation: true,
			autoDestroy: false,
		});

		system.update(undefined, 1 / 60);

		const firstSystem = firstHandle.getSystem();
		const secondSystem = secondHandle.getSystem();
		expect(firstSystem).not.toBeNull();
		expect(secondSystem).not.toBeNull();
		expect(firstSystem).not.toBe(secondSystem);
		expect((firstSystem as any).type).toBe('Particles');
		expect(typeof (firstSystem as any).update).toBe('function');
		// Each emitter is parented under its own anchor in the scene root.
		expect(
			scene.scene.children.filter((child) =>
				child.children.some((grandchild) => grandchild.type === 'Particles'),
			),
		).toHaveLength(2);

		system.destroy?.();
	});

	it('supports play, pause, stop, and restart through the handle', () => {
		const { handle, system } = createBehaviorHarness({ autoplay: true });

		system.update(undefined, 1 / 60);
		expect(handle.getSystem()).not.toBeNull();
		expect(handle.isPlaying()).toBe(true);
		expect((handle.getSystem() as any).running).toBe(true);

		handle.pause();
		expect((handle.getSystem() as any).running).toBe(false);
		expect(handle.isPlaying()).toBe(false);

		handle.play();
		expect((handle.getSystem() as any).running).toBe(true);
		expect(handle.isPlaying()).toBe(true);

		handle.stop();
		expect((handle.getSystem() as any).running).toBe(false);
		expect(handle.isPlaying()).toBe(false);

		handle.restart();
		expect((handle.getSystem() as any).running).toBe(true);
		expect(handle.isPlaying()).toBe(true);

		system.destroy?.();
	});

	it('auto-destroys standalone particle entities after one-shot effects finish', () => {
		const entity = createParticleSystem({
			position: new Vector3(3, 4, 5),
			effect: oneShotEffect({
				duration: 0.01,
				life: 0.01,
				count: 2,
			}),
			autoDestroy: true,
		});
		const ref = entity.getBehaviorRefs()[0]!;
		const links = [{ entity, ref }];
		const scene = new Scene();
		scene.add(entity.group!);
		const system = ParticleEmitterBehavior.systemFactory({
			world: {} as any,
			scene: { scene },
			getBehaviorLinks: () => links,
		});

		for (let i = 0; i < 6; i++) {
			system.update(undefined, 0.1);
		}

		expect(entity.markedForRemoval).toBe(true);
		expect(entity.getSystem()).toBeNull();

		system.destroy?.();
	});

	it('builds reusable preset effect definitions', () => {
		const preset = particlePresets.burst({ count: 4, color: '#ffaa00' });
		const systemA = preset.create();
		const systemB = preset.create();

		expect((systemA as any).type).toBe('Particles');
		expect((systemB as any).type).toBe('Particles');
		expect(systemA).not.toBe(systemB);
	});

	it('emits burst particles immediately on start()', () => {
		const preset = particlePresets.fire.spark();
		const system = preset.create() as any;
		system.start();

		const buffers = (system as any).buffers;
		const lifetime = buffers.instanceLifetime as Float32Array;
		const speed = buffers.instanceSpeed as Float32Array;
		const storageNodes = Object.values((system as any).attributes) as Array<{
			value: {
				isStorageInstancedBufferAttribute?: boolean;
				version: number;
			};
		}>;

		expect(lifetime[1]).toBeGreaterThan(0);
		expect(speed[0]).toBeGreaterThan(0);
		expect(system.emitted).toBeGreaterThan(0);
		expect(storageNodes).toHaveLength(6);
		for (const node of storageNodes) {
			expect(node.value.isStorageInstancedBufferAttribute).toBe(true);
			expect(node.value.version).toBeGreaterThan(0);
		}
		const drawable = system.children.find((child: any) => child.isSprite) as any;
		expect(drawable?.isSprite).toBe(true);
		expect(drawable?.count).toBeGreaterThan(0);
	});

	it('accepts textured material options through preset helpers', () => {
		const texture = new Texture();
		const preset = particlePresets.burst({
			color: '#67e8f9',
			texture,
			opacity: 0.9,
			depthWrite: false,
			alphaTest: 0.02,
			blending: AdditiveBlending,
		});
		const system = preset.create();

		expect((system as any).type).toBe('Particles');
	});

	it('exposes nested semantic preset families for higher-level effects', () => {
		const preset = particlePresets.fire.blaze();
		const systemA = preset.create();
		const systemB = preset.create();

		expect((systemA as any).type).toBe('Particles');
		expect(systemA).not.toBe(systemB);
	});

	it('treats magic as a modifier layer that can overlay another substance', () => {
		const holyMist = particlePresets.water.mist({
			magic: particlePresets.magic.holy({
				order: 'geometric',
			}),
		});
		const system = holyMist.create();

		expect((system as any).type).toBe('Particles');
	});

	it('builds reusable modifier presets for semantic magic overlays', () => {
		expect(particlePresets.magic.arcane().alignment).toBe('arcane');
		expect(particlePresets.magic.corrupted().realityEffect).toBe('decaying');
	});
});
