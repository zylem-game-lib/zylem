import { Color, Fog, FogExp2, Scene } from 'three';
import { describe, expect, it } from 'vitest';

import { createFog, ZylemFog } from '../../../src/lib/entities/fog';
import { FogTSLPatcher } from '../../../src/lib/graphics/fog/fog-tsl';

describe('createFog', () => {
	it('returns a ZylemFog with default greyish linear fog when called with no args', () => {
		const fog = createFog();
		expect(fog).toBeInstanceOf(ZylemFog);

		fog.create();
		expect(fog.threeFog).toBeInstanceOf(Fog);
		const f = fog.threeFog as Fog;
		expect(f.color.getHexString()).toBe(new Color('#9aa3ad').getHexString());
		expect(f.near).toBe(10);
		expect(f.far).toBe(250);
	});

	it('builds a FogExp2 instance when type is "exp2"', () => {
		const fog = createFog({ type: 'exp2', density: 0.02, color: '#aabbcc' });
		fog.create();
		expect(fog.threeFog).toBeInstanceOf(FogExp2);
		const f = fog.threeFog as FogExp2;
		expect(f.density).toBe(0.02);
		expect(f.color.getHexString()).toBe(new Color('#aabbcc').getHexString());
	});

	it('attaches its fog to the host scene via attachToScene', () => {
		const scene = new Scene();
		const fog = createFog({ type: 'linear', start: 5, end: 50 });
		fog.create();
		fog.attachToScene(scene);

		expect(scene.fog).toBe(fog.threeFog);
	});

	it('installs a scene-level fogNode and removes it on cleanup when height/noise enabled', () => {
		const scene = new Scene();

		const fog = createFog({
			type: 'linear',
			height: { enabled: true, level: 5, falloff: 0.2 },
			noise: { scale: 0.05, strength: 0.15, speed: 0.1 },
		});
		fog.create();
		fog.attachToScene(scene);

		expect(scene.fog).toBe(fog.threeFog);
		expect((scene as any).fogNode).toBeTruthy();

		(fog as any)._cleanup({ me: fog, globals: {} });

		expect(scene.fog).toBeNull();
		expect((scene as any).fogNode).toBeNull();
	});

	it('does not install a custom fogNode for plain distance fog', () => {
		const scene = new Scene();

		const fog = createFog({ type: 'exp2', density: 0.01 });
		fog.create();
		fog.attachToScene(scene);

		expect(scene.fog).toBeInstanceOf(FogExp2);
		// Plain fog uses Three's auto-generated node; we don't set scene.fogNode.
		expect((scene as any).fogNode == null).toBe(true);
	});
});

describe('FogTSLPatcher', () => {
	const baseValues = {
		time: 0,
		heightEnabled: 1,
		heightLevel: 5,
		heightFalloff: 0.2,
		noiseEnabled: 1,
		noiseScale: 0.05,
		noiseStrength: 0.15,
		noiseSpeed: 0.1,
	};

	it('assigns a fog node to scene.fogNode on scan', () => {
		const patcher = new FogTSLPatcher({ ...baseValues });
		const scene = new Scene();
		scene.fog = new Fog(new Color('#9aa3ad'), 10, 250);

		patcher.scan(scene);
		expect((scene as any).fogNode).toBeTruthy();
	});

	it('does nothing when the scene has no fog', () => {
		const patcher = new FogTSLPatcher({ ...baseValues });
		const scene = new Scene();

		patcher.scan(scene);
		expect((scene as any).fogNode == null).toBe(true);
	});

	it('is idempotent across repeated scans (same node reference)', () => {
		const patcher = new FogTSLPatcher({ ...baseValues });
		const scene = new Scene();
		scene.fog = new Fog(new Color('#9aa3ad'), 10, 250);

		patcher.scan(scene);
		const first = (scene as any).fogNode;
		patcher.scan(scene);
		patcher.scan(scene);

		expect((scene as any).fogNode).toBe(first);
	});

	it('tick advances time without error and clears the node on unpatchAll', () => {
		const patcher = new FogTSLPatcher({ ...baseValues });
		const scene = new Scene();
		scene.fog = new FogExp2(new Color('#aabbcc'), 0.02);

		patcher.scan(scene);
		patcher.tick(0.5);
		patcher.tick(0.25);
		expect((scene as any).fogNode).toBeTruthy();

		patcher.unpatchAll();
		expect((scene as any).fogNode).toBeNull();
	});
});
