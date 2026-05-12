import { Color, Fog, FogExp2, Mesh, MeshStandardMaterial, Scene, ShaderMaterial, SphereGeometry, Sprite, SpriteMaterial } from 'three';
import { describe, expect, it } from 'vitest';

import { createFog, ZylemFog } from '../../../src/lib/entities/fog';
import { FogMaterialPatcher } from '../../../src/lib/graphics/fog/fog-patcher';

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

	it('removes scene.fog and unpatches materials on cleanup', () => {
		const scene = new Scene();
		const material = new MeshStandardMaterial({ fog: true });
		scene.add(new Mesh(new SphereGeometry(1, 8, 8), material));

		const fog = createFog({
			type: 'linear',
			height: { enabled: true, level: 5, falloff: 0.2 },
			noise: { scale: 0.05, strength: 0.15, speed: 0.1 },
		});
		fog.create();
		fog.attachToScene(scene);

		expect(scene.fog).toBe(fog.threeFog);
		expect(material.userData.__zylemFogPatched).toBe(true);

		(fog as any)._cleanup({ me: fog, globals: {} });

		expect(scene.fog).toBeNull();
		expect(material.userData.__zylemFogPatched).toBeUndefined();
	});

	it('only patches materials when height or noise is enabled', () => {
		const scene = new Scene();
		const material = new MeshStandardMaterial({ fog: true });
		scene.add(new Mesh(new SphereGeometry(1, 8, 8), material));

		const fog = createFog({ type: 'exp2', density: 0.01 });
		fog.create();
		fog.attachToScene(scene);

		expect(scene.fog).toBeInstanceOf(FogExp2);
		expect(material.userData.__zylemFogPatched).toBeUndefined();
	});
});

describe('FogMaterialPatcher', () => {
	it('skips ShaderMaterial (which does not honor `fog: true`)', () => {
		const patcher = new FogMaterialPatcher({
			time: 0,
			heightEnabled: 1,
			heightLevel: 5,
			heightFalloff: 0.2,
			noiseEnabled: 1,
			noiseScale: 0.05,
			noiseStrength: 0.15,
			noiseSpeed: 0.1,
		});

		const scene = new Scene();
		const shaderMat = new ShaderMaterial({ vertexShader: '', fragmentShader: '' });
		scene.add(new Mesh(new SphereGeometry(1, 4, 4), shaderMat));

		patcher.scan(scene);
		expect(shaderMat.userData.__zylemFogPatched).toBeUndefined();
	});

	// Regression: SpriteMaterial uses a custom vertex pathway that never
	// defines the `transformed` symbol our `<fog_vertex>` replacement reads.
	// Patching it produces a shader compile error and the sprite stops
	// rendering — which is how the arena HUD icons + nameplates disappeared.
	it('skips SpriteMaterial so HUD sprites keep rendering', () => {
		const patcher = new FogMaterialPatcher({
			time: 0,
			heightEnabled: 1,
			heightLevel: 5,
			heightFalloff: 0.2,
			noiseEnabled: 1,
			noiseScale: 0.05,
			noiseStrength: 0.15,
			noiseSpeed: 0.1,
		});

		const scene = new Scene();
		const spriteMat = new SpriteMaterial({ fog: true });
		scene.add(new Sprite(spriteMat));

		patcher.scan(scene);
		expect(spriteMat.userData.__zylemFogPatched).toBeUndefined();
	});

	it('tick advances the shared time uniform', () => {
		const patcher = new FogMaterialPatcher({
			time: 0,
			heightEnabled: 0,
			heightLevel: 5,
			heightFalloff: 0.2,
			noiseEnabled: 1,
			noiseScale: 0.05,
			noiseStrength: 0.15,
			noiseSpeed: 0.1,
		});

		const scene = new Scene();
		const mat = new MeshStandardMaterial({ fog: true });
		scene.add(new Mesh(new SphereGeometry(1, 4, 4), mat));
		patcher.scan(scene);

		patcher.tick(0.5);
		patcher.tick(0.25);

		// The patched material's onBeforeCompile injects uniforms into a shader's
		// uniform map. Trigger compilation manually to read the value.
		const shader = { uniforms: {} as Record<string, { value: unknown }>, vertexShader: '', fragmentShader: '' };
		(mat.onBeforeCompile as Function)(shader, null);
		expect((shader.uniforms.uZylemFogTime as { value: number }).value).toBeCloseTo(0.75, 5);
	});

	it('does not double-patch materials across repeated scans', () => {
		const patcher = new FogMaterialPatcher({
			time: 0,
			heightEnabled: 1,
			heightLevel: 5,
			heightFalloff: 0.2,
			noiseEnabled: 0,
			noiseScale: 0.05,
			noiseStrength: 0.15,
			noiseSpeed: 0.1,
		});

		const scene = new Scene();
		const mat = new MeshStandardMaterial({ fog: true });
		scene.add(new Mesh(new SphereGeometry(1, 4, 4), mat));
		patcher.scan(scene);
		const firstHook = mat.onBeforeCompile;

		patcher.scan(scene);
		patcher.scan(scene);

		expect(mat.onBeforeCompile).toBe(firstHook);
	});
});
