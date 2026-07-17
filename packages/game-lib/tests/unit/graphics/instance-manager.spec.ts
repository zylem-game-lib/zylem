
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InstanceManager } from '../../../src/lib/graphics/instance-manager';
import { BoxGeometry, MeshBasicMaterial, Matrix4 } from 'three';
import { GameEntity } from '../../../src/lib/entities/entity';

describe('InstanceManager', () => {
	let manager: InstanceManager;

	beforeEach(() => {
		manager = new InstanceManager();
	});

	it('should generate consistent pack keys', () => {
		const config1 = {
			geometryType: 'Box',
			dimensions: { x: 1, y: 1, z: 1 },
			materialPath: null,
			shaderType: 'standard' as const,
			colorHex: 0xff0000,
		};
		const config2 = { ...config1 };
		const config3 = { ...config1, colorHex: 0x00ff00 };

		const key1 = InstanceManager.generatePackKey(config1);
		const key2 = InstanceManager.generatePackKey(config2);
		const key3 = InstanceManager.generatePackKey(config3);

		expect(key1).toBe(key2);
		expect(key1).not.toBe(key3);
	});

	it('should register entities into packs', () => {
		const entity = new GameEntity();
		entity.uuid = 'ent-1';
		const geo = new BoxGeometry();
		const mat = new MeshBasicMaterial({ color: 0xff0000 });
		const packKey = 'pack-1';

		const index = manager.register(entity, geo, mat, packKey);

		expect(index).toBe(0);
		
		const info = manager.getPackInfo(entity);
		expect(info).toEqual({ packKey: 'pack-1', instanceId: 0 });

		const stats = manager.getStats();
		expect(stats.packCount).toBe(1);
		expect(stats.totalInstances).toBe(1);
	});

	it('should reuse slots when unregistering', () => {
		const geo = new BoxGeometry();
		const mat = new MeshBasicMaterial();
		const packKey = 'pack-1';

		const ent1 = new GameEntity(); ent1.uuid = '1';
		const ent2 = new GameEntity(); ent2.uuid = '2';
		const ent3 = new GameEntity(); ent3.uuid = '3';

		manager.register(ent1, geo, mat, packKey);
		manager.register(ent2, geo, mat, packKey);
		manager.register(ent3, geo, mat, packKey);

		manager.unregister(ent2);

		const stats = manager.getStats();
		expect(stats.totalInstances).toBe(2);

		const ent4 = new GameEntity(); ent4.uuid = '4';
		const idx4 = manager.register(ent4, geo, mat, packKey);

		expect(idx4).toBe(1);
	});

	it('should mark dirty correctly', () => {
		const ent = new GameEntity();
		ent.uuid = 'dirty-test';
		const geo = new BoxGeometry();
		const mat = new MeshBasicMaterial();
		const packKey = 'pack-dirty';

		const idx = manager.register(ent, geo, mat, packKey);
		
		// @ts-ignore
		const pack = manager.packs.get(packKey);
		if (!pack) throw new Error('Pack not found');
		
		expect(pack.dirtyIndices.has(idx)).toBe(true);

		pack.dirtyIndices.clear();
		expect(pack.dirtyIndices.has(idx)).toBe(false);

		manager.markDirty(ent);
		expect(pack.dirtyIndices.has(idx)).toBe(true);
	});

	it('updates instanced transforms from the render-buffer path without FFI pose reads', () => {
		const ent = new GameEntity();
		ent.uuid = 'render-buffer-test';
		const geo = new BoxGeometry();
		const mat = new MeshBasicMaterial();
		const packKey = 'pack-render';

		const translation = vi.fn(() => ({ x: 0, y: 0, z: 0 }));
		const rotation = vi.fn(() => ({ x: 0, y: 0, z: 0, w: 1 }));
		const getRenderPose = vi.fn(() => ({
			position: { x: 1, y: 2, z: 3 },
			rotation: { x: 0, y: 0, z: 0, w: 1 },
		}));
		const getPoseHistory = vi.fn(() => ({
			previous: {
				position: { x: 0, y: 0, z: 0 },
				rotation: { x: 0, y: 0, z: 0, w: 1 },
			},
			current: {
				position: { x: 1, y: 2, z: 3 },
				rotation: { x: 0, y: 0, z: 0, w: 1 },
			},
		}));

		ent.body = {
			translation,
			rotation,
			getRenderPose,
			getPoseHistory,
		} as any;

		const idx = manager.register(ent, geo, mat, packKey);
		// @ts-ignore
		const pack = manager.packs.get(packKey)!;
		pack.dirtyIndices.clear();

		manager.update(0.5);

		expect(getRenderPose).toHaveBeenCalledWith(0.5);
		expect(translation).not.toHaveBeenCalled();
		expect(rotation).not.toHaveBeenCalled();

		const matrix = new Matrix4();
		pack.instancedMesh.getMatrixAt(idx, matrix);
		const elements = matrix.elements;
		expect(elements[12]).toBeCloseTo(1, 5);
		expect(elements[13]).toBeCloseTo(2, 5);
		expect(elements[14]).toBeCloseTo(3, 5);
	});
});
