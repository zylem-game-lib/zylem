import { BufferAttribute, BufferGeometry, Group, Mesh } from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AssetManager } from '../../../src/lib/core/asset-manager';
import { FBXLoaderAdapter } from '../../../src/lib/core/loaders/fbx-loader';
import {
	GAUSSIAN_SPLAT_ASSET_KIND,
	ZYLEM_ASSET_KIND_KEY,
	disposeGaussianSplatResources,
} from '../../../src/lib/core/loaders/gaussian-model';
import { createGaussianSplatResult } from '../../../src/lib/core/loaders/gaussian-splat-loader';
import { cloneModelObject } from '../../../src/lib/core/loaders/model-clone';
import { MAX_GAUSSIAN_SPLATS } from '../../../src/lib/core/loaders/model-sniff';

function splatFile(): Uint8Array {
	const buffer = new ArrayBuffer(32);
	const view = new DataView(buffer);
	view.setFloat32(0, 1, true);
	view.setFloat32(4, 2, true);
	view.setFloat32(8, 3, true);
	view.setFloat32(12, 0.1, true);
	view.setFloat32(16, 0.1, true);
	view.setFloat32(20, 0.1, true);
	const bytes = new Uint8Array(buffer);
	bytes[24] = 255;
	bytes[27] = 255;
	bytes[28] = 128;
	bytes[29] = 128;
	bytes[30] = 128;
	bytes[31] = 128;
	return bytes;
}

describe('Gaussian splat loading', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
		AssetManager.resetInstance();
	});

	it('builds one GaussianSplat from a .splat file and tags it', async () => {
		vi.stubGlobal('fetch', async () => new Response(splatFile()));
		const manager = AssetManager.getInstance();

		const result = await manager.loadModel('/capture.splat', { splatFrame: 'y-down' });

		expect((result.object as Mesh & { isGaussianSplat?: boolean }).isGaussianSplat).toBe(true);
		expect(result.object.userData[ZYLEM_ASSET_KIND_KEY]).toBe(GAUSSIAN_SPLAT_ASSET_KIND);
		expect(result.object.rotation.x).toBeCloseTo(Math.PI, 5);
		expect(result.animations).toEqual([]);

		const cloned = cloneModelObject(result.object);
		expect(cloned).not.toBe(result.object);
		expect((cloned as Mesh & { isGaussianSplat?: boolean }).isGaussianSplat).toBe(true);
		expect(cloned.rotation.x).toBeCloseTo(Math.PI, 5);
	});

	it('refuses splat counts above the KSPLAT cap', () => {
		const geometry = new BufferGeometry();
		const position = new BufferAttribute(new Float32Array(3), 3);
		Object.defineProperty(position, 'count', { get: () => MAX_GAUSSIAN_SPLATS + 1 });
		geometry.setAttribute('position', position);
		const dispose = vi.spyOn(geometry, 'dispose');

		expect(() => createGaussianSplatResult(geometry)).toThrow(/exceeds the limit/);
		expect(dispose).toHaveBeenCalled();
	});

	it('disposes capture buffers held beside the display mesh', () => {
		const mesh = new Mesh(new BufferGeometry(), undefined as never);
		(mesh as Mesh & { isGaussianSplat?: boolean }).isGaussianSplat = true;
		const geometry = new BufferGeometry();
		geometry.setAttribute('position', new BufferAttribute(new Float32Array(3), 3));
		const attribute = geometry.getAttribute('position');
		const dispose = vi.spyOn(attribute, 'dispose');
		(mesh as Mesh & { splatGeometry?: BufferGeometry; _buffers?: unknown }).splatGeometry = geometry;
		(mesh as Mesh & { _buffers?: unknown })._buffers = { centerRead: { value: attribute } };

		disposeGaussianSplatResources(mesh);

		expect(dispose).toHaveBeenCalled();
		expect((mesh as Mesh & { _buffers?: unknown })._buffers).toBeNull();
	});
});

describe('FBX loader options', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('leaves unit scale off unless applyUnitScale is set', async () => {
		vi.spyOn(FBXLoader.prototype, 'load').mockImplementation((_url, onLoad) => {
			const object = new Group();
			object.userData.unitScaleFactor = 0.01;
			onLoad?.(object);
		});

		const loader = new FBXLoaderAdapter();
		const untouched = await loader.load('hero.fbx');
		const scaled = await loader.load('hero.fbx', { applyUnitScale: true });

		expect(untouched.object.scale.x).toBe(1);
		expect(scaled.object.scale.x).toBeCloseTo(0.01, 5);
	});
});
