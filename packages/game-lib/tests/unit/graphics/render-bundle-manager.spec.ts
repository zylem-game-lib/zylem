import { describe, it, expect, beforeEach } from 'vitest';
import { BoxGeometry, Mesh, MeshBasicMaterial, Scene } from 'three';
import { RenderBundleManager } from '../../../src/lib/graphics/render-bundle-manager';
import { GameEntity } from '../../../src/lib/entities/entity';

describe('RenderBundleManager', () => {
	let manager: RenderBundleManager;
	let scene: Scene;

	beforeEach(() => {
		manager = new RenderBundleManager();
		scene = new Scene();
		manager.setScene(scene);
	});

	it('registers entities into bundle groups and marks them bundled', () => {
		const entity = new GameEntity();
		entity.uuid = 'bundle-ent-1';
		const geo = new BoxGeometry();
		const mat = new MeshBasicMaterial({ color: 0xff0000 });
		entity.mesh = new Mesh(geo, mat);

		const placed = manager.register(entity, geo, mat, 'bundle-key-1');

		expect(placed).toBe(true);
		expect(entity.isBundled).toBe(true);
		expect(entity.bundleKey).toBe('bundle-key-1');
		expect(scene.children.length).toBe(1);

		const stats = manager.getStats();
		expect(stats.bundleCount).toBe(1);
		expect(stats.entityCount).toBe(1);
	});

	it('groups entities with the same bundle key', () => {
		const geo = new BoxGeometry();
		const mat = new MeshBasicMaterial();

		const ent1 = new GameEntity();
		ent1.uuid = 'b1';
		ent1.mesh = new Mesh(geo, mat);
		const ent2 = new GameEntity();
		ent2.uuid = 'b2';
		ent2.mesh = new Mesh(geo, mat.clone());

		manager.register(ent1, geo, mat, 'shared-key');
		manager.register(ent2, geo, mat, 'shared-key');

		expect(manager.getStats().bundleCount).toBe(1);
		expect(manager.getStats().entityCount).toBe(2);
	});

	it('unregisters and disposes cleanly', () => {
		const geo = new BoxGeometry();
		const mat = new MeshBasicMaterial();
		const entity = new GameEntity();
		entity.uuid = 'dispose-test';
		entity.mesh = new Mesh(geo, mat);

		manager.register(entity, geo, mat, 'key');
		manager.unregister(entity);

		expect(entity.isBundled).toBe(false);
		expect(entity.bundleKey).toBeNull();
		expect(manager.getStats().entityCount).toBe(0);

		manager.dispose();
		expect(scene.children.length).toBe(0);
	});
});
