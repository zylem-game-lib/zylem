import { Value } from '@sinclair/typebox/value';
import { Color, PerspectiveCamera, Scene, Vector2, Vector3 } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { parseStageOptions } from '../../../src/lib/stage/stage-config';
import { StageConfigJsonSchema } from '../../../src/lib/core/json-schemas/stage-config';
import { createStageBackground } from '../../../src/lib/graphics/space/background';
import { resolveCelestialBody } from '../../../src/lib/graphics/space/celestial-body-config';
import { GravitySourceBehavior } from '@zylem/behaviors/celestial';
import { createCelestialBody } from '../../../src/lib/graphics/space/celestial-body';
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

describe('independent celestial bodies', () => {
	it('clones visual options and gravity without duplicating the source', () => {
		const body = createCelestialBody({
			radius: 20,
			gravity: { surfaceAcceleration: 2.5 },
			surface: { type: 'ocean' },
		});
		const clone = body.clone({ name: 'Copy', radius: 10, position: { x: 10, y: 0, z: 0 } });
		expect(clone.bodyOptions.radius).toBe(10);
		expect(clone.options.position?.x).toBe(10);
		expect(clone.getBehaviorRefs()).toHaveLength(1);
		expect(clone.getBehaviorRef(GravitySourceBehavior)?.options.radius).toBe(10);
		clone.setSunDirection([0, 1, 0]);
		expect(body.bodyOptions.sunDirection).toBeUndefined();
	});
	it.each([
		{ radius: 0 },
		{ radius: 20, rings: { innerRadius: 19 } },
		{ radius: 20, rings: { outerRadius: 22 } },
		{ atmosphere: { thickness: -1 } },
		{ surface: { oceanCoverage: 1.1 } },
		{ gravity: { surfaceAcceleration: -1 } },
	])('rejects invalid geometry or gravity %j', (options) => {
		expect(() => createCelestialBody(options)).toThrow();
	});
	it('defaults to a standalone rocky body with no implicit companions', () => {
		const body = createCelestialBody().create();
		expect(resolveCelestialBody().rings).toBe(false);
		expect(resolveCelestialBody().atmosphere).toBe(false);
		expect(body.colliderDesc?.shape).toEqual({ type: 'sphere', radius: 1 });
		expect(body.group!.children).toHaveLength(1);
		body.nodeDestroy({ me: body, globals: {} });
	});
	it('pauses surface animation, disposes textures and recreates on stage reload', () => {
		const body = createCelestialBody({
			radius: 20,
			surface: { type: 'ocean' },
			atmosphere: {},
			rings: {},
		}).create();
		const old = body.group!;
		const clouds = old.getObjectByName('Body.Clouds') as any;
		body.setTime(12);
		const angle = body.mesh!.rotation.y;
		expect(angle).toBeGreaterThan(0);
		body.setTimeScale(0);
		body._update({ delta: 4 } as any);
		expect(body.mesh!.rotation.y).toBe(angle);
		const dispose = vi.spyOn(clouds.material.map, 'dispose');
		body.nodeDestroy({ me: body, globals: {} });
		expect(dispose).toHaveBeenCalledOnce();
		body.create();
		body.nodeSetup({ me: body, globals: {} } as any);
		expect(body.group).not.toBe(old);
		expect(body.mesh!.rotation.y).toBe(0);
		body.nodeDestroy({ me: body, globals: {} });
	});
});
