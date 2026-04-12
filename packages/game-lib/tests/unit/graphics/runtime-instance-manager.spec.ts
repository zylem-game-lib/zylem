import { Color, Group, BoxGeometry, Matrix4, MeshStandardMaterial } from 'three';
import { describe, expect, it } from 'vitest';

import { RuntimeInstanceManager } from '../../../src/lib/graphics/runtime-instance-manager';
import { RUNTIME_INSTANCE_HEAT_ATTRIBUTE } from '../../../src/lib/graphics/runtime-instanced-heat-material';
import type { ZylemRuntimeBufferViews } from '../../../src/lib/runtime/zylem-wasm-runtime';

describe('RuntimeInstanceManager', () => {
	it('updates instanced mesh matrices and colors from runtime buffers', () => {
		const manager = new RuntimeInstanceManager();
		manager.setScene(new Group());
		const sourceMaterial = new MeshStandardMaterial({
			color: new Color(0x3388ff),
		});

		const instancedMesh = manager.registerBatch({
			key: 'runtime-boxes',
			geometry: new BoxGeometry(1, 1, 1),
			material: sourceMaterial,
			count: 2,
		});

		const renderView = new Float32Array([
			1, 2, 3, 0, 0, 0, 1, 1, 0.1, 0.2, 0.3, 0,
			4, 5, 6, 0, 0, 0, 1, 2, 0.4, 0.5, 0.6, 1,
		]);
		const runtime = {
			renderView,
			renderStride: 12,
			exports: {
				zylem_runtime_active_count: () => 2,
			},
		} as unknown as ZylemRuntimeBufferViews;

		manager.updateBatch('runtime-boxes', runtime);

		expect(instancedMesh.count).toBe(2);
		const matrix = new Matrix4();
		instancedMesh.getMatrixAt(0, matrix);
		expect(matrix.elements[12]).toBeCloseTo(1);
		expect(matrix.elements[13]).toBeCloseTo(2);
		expect(matrix.elements[14]).toBeCloseTo(3);
		expect((instancedMesh.material as MeshStandardMaterial).vertexColors).toBe(false);
		expect((instancedMesh.material as MeshStandardMaterial).color.getHex()).toBe(0x3388ff);
	});

	it('heatTint on MeshStandardMaterial uses instanceHeat attribute instead of instanceColor', () => {
		const manager = new RuntimeInstanceManager();
		manager.setScene(new Group());
		const sourceMaterial = new MeshStandardMaterial({
			color: new Color(0x3388ff),
		});

		const instancedMesh = manager.registerBatch({
			key: 'runtime-heat',
			geometry: new BoxGeometry(1, 1, 1),
			material: sourceMaterial,
			count: 2,
			colorMode: 'heatTint',
		});

		const mat = instancedMesh.material as MeshStandardMaterial;
		expect(mat.vertexColors).toBe(false);
		expect(instancedMesh.instanceColor).toBeNull();

		const heatAttr = instancedMesh.geometry.getAttribute(RUNTIME_INSTANCE_HEAT_ATTRIBUTE);
		expect(heatAttr).toBeDefined();
		expect(heatAttr.itemSize).toBe(1);

		const renderView = new Float32Array([
			1, 2, 3, 0, 0, 0, 1, 1, 0.1, 0.2, 0.3, 0,
			4, 5, 6, 0, 0, 0, 1, 2, 0.4, 0.5, 0.6, 1,
		]);
		const runtime = {
			renderView,
			renderStride: 12,
			exports: {
				zylem_runtime_active_count: () => 2,
			},
		} as unknown as ZylemRuntimeBufferViews;

		manager.updateBatch('runtime-heat', runtime);

		const arr = heatAttr.array as Float32Array;
		expect(arr[0]).toBeCloseTo(0.2);
		expect(arr[1]).toBeCloseTo(0.5);
		expect(instancedMesh.instanceColor).toBeNull();
	});
});
