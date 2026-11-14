import { Value } from '@sinclair/typebox/value';
import { Color, PerspectiveCamera, Scene, Vector2, Vector3 } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { parseStageOptions } from '../../../src/lib/stage/stage-config';
import { StageConfigJsonSchema } from '../../../src/lib/core/json-schemas/stage-config';
import { createStageBackground } from '../../../src/lib/graphics/space/background';
import { resolvePlanet } from '../../../src/lib/graphics/space/planet-config';
import { sampleMoonOrbit } from '../../../src/lib/graphics/space/orbit';
import { createPlanet } from '../../../src/lib/graphics/space/planet';
import { ZylemScene } from '../../../src/lib/graphics/zylem-scene';
import { ZylemCamera } from '../../../src/lib/camera/zylem-camera';
import { Perspectives } from '../../../src/lib/camera/perspective';

describe('space backgrounds', () => {
	it('shares concurrent setup and cleans up initialization that finishes after destruction', async () => {
		const camera = new ZylemCamera(Perspectives.ThirdPerson, new Vector2(100, 100));
		const makeScene = () =>
			new ZylemScene('space', camera, {
				backgroundColor: '#fff',
				backgroundImage: null,
				defaultLighting: false,
				background: { type: 'space', color: '#02040c', stars: { count: 20 } },
			});
		const scene = makeScene();
		await Promise.all([
			scene.setupBackground({} as any, camera.camera),
			scene.setupBackground({} as any, camera.camera),
		]);
		expect(scene.scene.children.filter((c) => c.name === 'Zylem.SpaceStars')).toHaveLength(1);
		expect((scene.scene.background as Color).getHexString()).toBe('02040c');
		scene.destroy();
		const destroyed = makeScene();
		const pending = destroyed.setupBackground({} as any, camera.camera);
		destroyed.destroy();
		await pending;
		expect(destroyed.scene.children).toHaveLength(0);
	});
	it('round-trips all built-in modes through stage config and JSON schema', () => {
		for (const background of [
			{ type: 'color', color: '#123456' },
			{ type: 'gradient', top: '#222', horizon: '#888', bottom: '#444' },
			{ type: 'space', color: '#02040c', stars: { count: 200, seed: 13 }, sun: {} },
			{ type: 'sky', preset: 'earth', timeOfDay: 18, cycleDuration: 120 },
		]) {
			const config = parseStageOptions([{ background }]).config;
			expect(config.background).toEqual(background);
			expect(config.background).not.toBe(background);
			expect(Value.Check(StageConfigJsonSchema, { background })).toBe(true);
		}
	});
	it.each([
		{ type: 'unknown' },
		{ type: 'space', stars: { count: -1 } },
		{ type: 'space', stars: { size: 0 } },
		{ type: 'space', stars: { brightness: Infinity } },
		{ type: 'sky', timeOfDay: 25 },
		{ type: 'sky', cycleDuration: 0 },
	])('rejects invalid background options %j', (background) => {
		expect(() => parseStageOptions([{ background }])).toThrow();
		expect(Value.Check(StageConfigJsonSchema, { background })).toBe(false);
	});
	it('restores prior state and disposes its own stars and lighting exactly once', async () => {
		const scene = new Scene(),
			oldColor = new Color('red');
		scene.background = oldColor;
		const controller = await createStageBackground(scene, {} as any, new PerspectiveCamera(), {
			type: 'space',
			stars: { count: 40 },
			sun: {},
		});
		const stars = scene.getObjectByName('Zylem.SpaceStars')!;
		const mesh = stars.children[0] as any;
		const dispose = vi.spyOn(mesh.geometry, 'dispose');
		expect(scene.children.length).toBe(4);
		controller.dispose();
		controller.dispose();
		expect(dispose).toHaveBeenCalledOnce();
		expect(scene.background).toBe(oldColor);
		expect(scene.children).toHaveLength(0);
	});
	it('does not overwrite a background installed by another owner', async () => {
		const scene = new Scene();
		const controller = await createStageBackground(scene, {} as any, new PerspectiveCamera(), {
			type: 'color',
			color: 'blue',
		});
		const replacement = new Color('green');
		scene.background = replacement;
		controller.dispose();
		expect(scene.background).toBe(replacement);
	});
	it('new background takes precedence over a legacy shader and repeated setup does not leak stars', async () => {
		const camera = new ZylemCamera(Perspectives.ThirdPerson, new Vector2(100, 100));
		const scene = new ZylemScene('space', camera, {
			backgroundColor: '#000',
			backgroundImage: null,
			backgroundShader: { colorNode: {} } as any,
			background: { type: 'space', stars: { count: 20 } },
			defaultLighting: false,
		});
		expect(scene.scene.backgroundNode).toBeUndefined();
		await scene.setupBackground({} as any, camera.camera);
		const first = scene.scene.getObjectByName('Zylem.SpaceStars');
		await scene.setupBackground({} as any, camera.camera);
		expect(scene.scene.getObjectByName('Zylem.SpaceStars')).not.toBe(first);
		expect(scene.scene.children.filter((c) => c.name === 'Zylem.SpaceStars')).toHaveLength(1);
		scene.destroy();
	});
});

describe('planet and crossed moon orbits', () => {
	it('clones planet configuration without sharing mutable options', () => {
		const planet = createPlanet({ moons: 'crossed', name: 'Original', seed: 4294967295 });
		const clone = planet.clone({ name: 'Copy', position: { x: 10, y: 0, z: 0 } });
		expect(clone.planetOptions.moons).toBe('crossed');
		expect(clone.options.name).toBe('Copy');
		expect(clone.options.position?.x).toBe(10);
		clone.setSunDirection([0, 1, 0]);
		expect(planet.planetOptions.sunDirection).toBeUndefined();
	});
	it('keeps one orbit in the ring plane, the other oppositely tilted, with radial clearance', () => {
		const config = resolvePlanet({ moons: 'crossed' });
		if (!config.rings) throw Error('Missing rings');
		const [a, b] = config.moons;
		expect(a.orbit.inclination).toBe(config.rings.tilt);
		expect(b.orbit.inclination).toBe(-config.rings.tilt);
		expect(a.orbit.radius - a.radius!).toBeGreaterThan(config.rings.outerRadius);
		expect(b.orbit.radius - a.orbit.radius).toBeGreaterThan(a.radius! + b.radius!);
		const normal = new Vector3(0, 1, 0).applyAxisAngle(
			new Vector3(0, 0, 1),
			(config.rings.tilt * Math.PI) / 180
		);
		for (let t = 0; t <= 100; t += 0.25) {
			const pa = sampleMoonOrbit(a.orbit, t),
				pb = sampleMoonOrbit(b.orbit, t);
			expect(pa.length()).toBeCloseTo(a.orbit.radius, 8);
			expect(pa.dot(normal)).toBeCloseTo(0, 8);
			expect(pa.distanceTo(pb)).toBeGreaterThan(a.radius! + b.radius!);
		}
		expect(
			sampleMoonOrbit(a.orbit, a.orbit.period).distanceTo(sampleMoonOrbit(a.orbit, 0))
		).toBeLessThan(1e-10);
	});
	it.each([
		{ radius: 0 },
		{ rings: { innerRadius: 19 } },
		{ rings: { outerRadius: 22 } },
		{ atmosphere: { thickness: -1 } },
		{ surface: { oceanCoverage: 1.1 } },
		{ moons: [{ orbit: { radius: 50, period: 0 } }] },
		{ moons: [{ radius: 2, orbit: { radius: 36, period: 40 } }] },
	])('rejects invalid planet geometry/orbits %j', (options) => {
		expect(() => createPlanet(options)).toThrow();
	});
	it('animates without physics, pauses, disposes textures, and recreates on stage reload', () => {
		const planet = createPlanet({ moons: 'crossed', name: 'Ocean world' });
		planet.create();
		expect(planet.colliderDesc).toBeUndefined();
		const oldGroup = planet.group!;
		const firstMoon = oldGroup.getObjectByName('Planet.Moon.1')!;
		const initial = firstMoon.position.clone();
		planet.setTime(12);
		expect(firstMoon.position.distanceTo(initial)).toBeGreaterThan(10);
		planet.setTimeScale(0);
		const paused = firstMoon.position.clone();
		planet._update({ delta: 4 } as any);
		expect(firstMoon.position.equals(paused)).toBe(true);
		const clouds = oldGroup.getObjectByName('Planet.Clouds') as any;
		const disposeMap = vi.spyOn(clouds.material.map, 'dispose');
		planet.nodeCleanup({ me: planet, globals: {} });
		expect(disposeMap).toHaveBeenCalledOnce();
		expect(planet.group).toBeUndefined();
		planet.create();
		planet._setup({ me: planet, globals: {} });
		expect(planet.group).not.toBe(oldGroup);
		expect(
			planet.group!.getObjectByName('Planet.Moon.1')!.position.distanceTo(initial)
		).toBeLessThan(1e-8);
		planet.nodeCleanup({ me: planet, globals: {} });
	});
});
