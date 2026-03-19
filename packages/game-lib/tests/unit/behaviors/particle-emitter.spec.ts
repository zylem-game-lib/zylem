import { createWorld } from 'bitecs';
import {
	AdditiveBlending,
	MeshBasicMaterial,
	Scene,
	Texture,
	Vector3,
} from 'three';
import {
	ConstantColor,
	ConstantValue,
	ParticleSystem,
	PointEmitter,
	RenderMode,
	Vector4,
} from 'three.quarks';
import { describe, expect, it } from 'vitest';

import { ParticleEmitterBehavior } from '../../../src/lib/behaviors/particle-emitter';
import { particleEffect, particlePresets } from '../../../src/lib/behaviors/particle-emitter/particle-effect';
import { create } from '../../../src/lib/entities/entity';
import { createParticleSystem } from '../../../src/lib/entities/particle-system';

function createTestEffect(options: {
	duration?: number;
	life?: number;
	count?: number;
	looping?: boolean;
} = {}) {
	return particleEffect(
		() =>
			new ParticleSystem({
				duration: options.duration ?? 0.05,
				looping: options.looping ?? false,
				startLife: new ConstantValue(options.life ?? 0.05),
				startSpeed: new ConstantValue(0),
				startSize: new ConstantValue(0.1),
				startColor: new ConstantColor(new Vector4(1, 1, 1, 1)),
				emissionOverTime: new ConstantValue(0),
				emissionBursts: [
					{
						time: 0,
						count: new ConstantValue(options.count ?? 1),
						cycle: 1,
						interval: 0,
						probability: 1,
					},
				],
				shape: new PointEmitter(),
				material: new MeshBasicMaterial({
					color: '#ffffff',
					transparent: true,
				}),
				renderMode: RenderMode.BillBoard,
			}),
	);
}

function createBehaviorHarness(options: {
	position?: Vector3;
	autoplay?: boolean;
	looping?: boolean;
} = {}) {
	const entity = create({
		position: options.position ?? new Vector3(1, 2, 3),
	});
	const handle = entity.use(ParticleEmitterBehavior, {
		effect: createTestEffect({ looping: options.looping }),
		autoplay: options.autoplay,
	});
	const ref = entity.getBehaviorRefs().at(-1)!;
	const links = [{ entity, ref }];
	const scene = { scene: new Scene() };
	const ecs = createWorld();
	const system = ParticleEmitterBehavior.systemFactory({
		world: {} as any,
		ecs,
		scene,
		getBehaviorLinks: () => links,
	});

	return { entity, handle, ref, scene, system, ecs };
}

describe('ParticleEmitterBehavior', () => {
	it('applies defaults and creates fresh particle systems from the effect definition', () => {
		const effect = createTestEffect();
		const first = create({ position: new Vector3(1, 2, 3) });
		const second = create({ position: new Vector3(4, 5, 6) });
		const firstHandle = first.use(ParticleEmitterBehavior, { effect });
		const secondHandle = second.use(ParticleEmitterBehavior, { effect });
		const firstRef = first.getBehaviorRefs()[0]!;
		const secondRef = second.getBehaviorRefs()[0]!;
		const links = [
			{ entity: first, ref: firstRef },
			{ entity: second, ref: secondRef },
		];
		const scene = { scene: new Scene() };
		const ecs = createWorld();
		const system = ParticleEmitterBehavior.systemFactory({
			world: {} as any,
			ecs,
			scene,
			getBehaviorLinks: () => links,
		});

		expect(firstHandle.getOptions()).toMatchObject({
			autoplay: true,
			followPosition: true,
			followRotation: true,
			autoDestroy: false,
		});

		system.update(ecs, 1 / 60);

		expect(firstHandle.getSystem()).toBeInstanceOf(ParticleSystem);
		expect(secondHandle.getSystem()).toBeInstanceOf(ParticleSystem);
		expect(firstHandle.getSystem()).not.toBe(secondHandle.getSystem());
		expect(
			scene.scene.children.filter((child) => child.type === 'BatchedRenderer'),
		).toHaveLength(1);

		system.destroy?.(ecs);
	});

	it('supports play, pause, stop, and restart through the handle', () => {
		const { handle, system, ecs } = createBehaviorHarness({
			autoplay: true,
			looping: true,
		});

		system.update(ecs, 1 / 60);
		expect(handle.getSystem()).not.toBeNull();
		expect(handle.isPlaying()).toBe(true);

		handle.pause();
		expect(handle.getSystem()?.paused).toBe(true);
		expect(handle.isPlaying()).toBe(false);

		handle.play();
		expect(handle.getSystem()?.paused).toBe(false);
		expect(handle.isPlaying()).toBe(true);

		handle.stop();
		expect(handle.getSystem()?.paused).toBe(true);
		expect(handle.isPlaying()).toBe(false);
		expect(handle.getSystem()?.time).toBe(0);

		handle.restart();
		expect(handle.getSystem()?.paused).toBe(false);
		expect(handle.isPlaying()).toBe(true);

		system.destroy?.(ecs);
	});

	it('auto-destroys standalone particle entities after one-shot effects finish', () => {
		const entity = createParticleSystem({
			position: new Vector3(3, 4, 5),
			effect: createTestEffect({
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
		const ecs = createWorld();
		const system = ParticleEmitterBehavior.systemFactory({
			world: {} as any,
			ecs,
			scene: { scene },
			getBehaviorLinks: () => links,
		});

		for (let i = 0; i < 6; i++) {
			system.update(ecs, 0.1);
		}

		expect(entity.markedForRemoval).toBe(true);
		expect(entity.getSystem()).toBeNull();

		system.destroy?.(ecs);
	});

	it('builds reusable preset effect definitions', () => {
		const preset = particlePresets.burst({ count: 4, color: '#ffaa00' });
		const systemA = preset.create();
		const systemB = preset.create();

		expect(systemA).toBeInstanceOf(ParticleSystem);
		expect(systemB).toBeInstanceOf(ParticleSystem);
		expect(systemA).not.toBe(systemB);
	});

	it('forwards textured material and tile options through preset helpers', () => {
		const texture = new Texture();
		const preset = particlePresets.burst({
			color: '#67e8f9',
			texture,
			opacity: 0.9,
			depthWrite: false,
			alphaTest: 0.02,
			blending: AdditiveBlending,
			uTileCount: 4,
			vTileCount: 2,
			blendTiles: true,
		});
		const system = preset.create();
		const material = system.material as MeshBasicMaterial;

		expect(material.map).toBe(texture);
		expect(material.opacity).toBe(0.9);
		expect(material.depthWrite).toBe(false);
		expect(material.alphaTest).toBe(0.02);
		expect(material.blending).toBe(AdditiveBlending);
		expect(system.uTileCount).toBe(4);
		expect(system.vTileCount).toBe(2);
		expect(system.blendTiles).toBe(true);
	});
});
