import { describe, it, expect, beforeEach } from 'vitest';
import { BoxGeometry, Mesh, MeshBasicMaterial, Scene } from 'three';
import { RenderStrategyManager } from '../../../src/lib/graphics/render-strategy-manager';
import { GameEntity } from '../../../src/lib/entities/entity';

describe('RenderStrategyManager', () => {
	let manager: RenderStrategyManager;
	let scene: Scene;

	beforeEach(() => {
		manager = new RenderStrategyManager();
		scene = new Scene();
		manager.setScene(scene);
	});

	function makeEntity(uuid: string, category: 'pack' | 'environment' | 'none') {
		const entity = new GameEntity();
		entity.uuid = uuid;
		entity.options = { category } as any;
		const geo = new BoxGeometry();
		const mat = new MeshBasicMaterial({ color: 0xff0000 });
		entity.mesh = new Mesh(geo, mat);
		entity.materials = [mat];
		return entity;
	}

	it('routes pack entities to instancing', () => {
		const entity = makeEntity('pack-1', 'pack');
		const placed = manager.register(entity);

		expect(placed).toBe(true);
		expect(entity.isInstanced).toBe(true);
		expect(entity.isBundled).toBe(false);
		expect(entity.mesh?.visible).toBe(false);
		expect(manager.instances.getStats().totalInstances).toBe(1);
	});

	it('routes environment entities to bundles', () => {
		const entity = makeEntity('env-1', 'environment');
		const placed = manager.register(entity);

		expect(placed).toBe(true);
		expect(entity.isBundled).toBe(true);
		expect(entity.isInstanced).toBe(false);
		expect(manager.bundles.getStats().bundleCount).toBe(1);
	});

	it('leaves none entities unregistered', () => {
		const entity = makeEntity('none-1', 'none');
		const placed = manager.register(entity);

		expect(placed).toBe(false);
		expect(entity.isInstanced).toBe(false);
		expect(entity.isBundled).toBe(false);
	});

	it('unregisters from the correct path', () => {
		const pack = makeEntity('pack-unreg', 'pack');
		const env = makeEntity('env-unreg', 'environment');
		manager.register(pack);
		manager.register(env);

		manager.unregister(pack);
		manager.unregister(env);

		expect(pack.isInstanced).toBe(false);
		expect(env.isBundled).toBe(false);
	});
});
