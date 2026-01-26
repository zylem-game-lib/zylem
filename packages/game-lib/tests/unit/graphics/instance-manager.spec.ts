
import { describe, it, expect, beforeEach } from 'vitest';
import { InstanceManager } from '../../../src/lib/graphics/instance-manager';
import { BoxGeometry, MeshBasicMaterial } from 'three';
import { GameEntity } from '../../../src/lib/entities/entity';

describe('InstanceManager', () => {
	let manager: InstanceManager;

	beforeEach(() => {
		manager = new InstanceManager();
	});

	it('should generate consistent batch keys', () => {
		const config1 = {
			geometryType: 'Box',
			dimensions: { x: 1, y: 1, z: 1 },
			materialPath: null,
			shaderType: 'standard' as const,
			colorHex: 0xff0000,
		};
		const config2 = { ...config1 };
		const config3 = { ...config1, colorHex: 0x00ff00 };

		const key1 = InstanceManager.generateBatchKey(config1);
		const key2 = InstanceManager.generateBatchKey(config2);
		const key3 = InstanceManager.generateBatchKey(config3);

		expect(key1).toBe(key2);
		expect(key1).not.toBe(key3);
	});

	it('should register entities into batches', () => {
		const entity = new GameEntity();
		entity.uuid = 'ent-1';
		const geo = new BoxGeometry();
		const mat = new MeshBasicMaterial({ color: 0xff0000 });
		const batchKey = 'batch-1';

		const index = manager.register(entity, geo, mat, batchKey);

		expect(index).toBe(0);
		
		const info = manager.getBatchInfo(entity);
		expect(info).toEqual({ batchKey: 'batch-1', instanceId: 0 });

		const stats = manager.getStats();
		expect(stats.batchCount).toBe(1);
		expect(stats.totalInstances).toBe(1);
	});

	it('should reuse slots when unregistering', () => {
		const geo = new BoxGeometry();
		const mat = new MeshBasicMaterial();
		const batchKey = 'batch-1';

		const ent1 = new GameEntity(); ent1.uuid = '1';
		const ent2 = new GameEntity(); ent2.uuid = '2';
		const ent3 = new GameEntity(); ent3.uuid = '3';

		manager.register(ent1, geo, mat, batchKey); // idx 0
		manager.register(ent2, geo, mat, batchKey); // idx 1
		manager.register(ent3, geo, mat, batchKey); // idx 2

		manager.unregister(ent2); // Frees idx 1

		const stats = manager.getStats();
		expect(stats.totalInstances).toBe(2);

		const ent4 = new GameEntity(); ent4.uuid = '4';
		const idx4 = manager.register(ent4, geo, mat, batchKey);

		expect(idx4).toBe(1); // Should reuse index 1
	});

	it('should mark dirty correctly', () => {
		const ent = new GameEntity();
		ent.uuid = 'dirty-test';
		const geo = new BoxGeometry();
		const mat = new MeshBasicMaterial();
		const batchKey = 'batch-dirty';

		const idx = manager.register(ent, geo, mat, batchKey);
		
		// Access private batch for testing
		// @ts-ignore
		const batch = manager.batches.get(batchKey);
		if (!batch) throw new Error('Batch not found');
		
		// Should be dirty on register
		expect(batch.dirtyIndices.has(idx)).toBe(true);

		batch.dirtyIndices.clear();
		expect(batch.dirtyIndices.has(idx)).toBe(false);

		manager.markDirty(ent);
		expect(batch.dirtyIndices.has(idx)).toBe(true);
	});
});
