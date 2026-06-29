/**
 * Unit tests for {@link RenderBundleManager}: static meshes are wrapped in a
 * `BundleGroup`, dynamic meshes render directly in the scene, instanced repeats
 * use a scene-direct `InstancedMesh`, plus per-frame transform sync, raycast and
 * (un)registration. Uses real three.js objects (a `Scene` + `Mesh`) — no
 * renderer/WebGPU device required.
 */
import { describe, expect, it } from 'vitest';
import { BoxGeometry, Matrix4, Mesh, MeshBasicMaterial, Raycaster, Scene, Vector3 } from 'three';

import { RenderBundleManager } from '../../../src/lib/graphics/render-bundle-manager';
import type { BridgeTransform } from '../../../src/lib/runtime/stage-physics-bridge';

let uuidCounter = 0;

function makeRenderableEntity(handle: number, options: Record<string, unknown> = {}): any {
	const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
	return {
		uuid: `entity-${uuidCounter++}`,
		options,
		materials: [mesh.material],
		mesh,
		group: undefined,
		runtimeHandle: handle,
	};
}

/** A non-moving entity: only these are bundle-eligible. */
function makeStaticEntity(handle: number, extra: Record<string, unknown> = {}): any {
	return makeRenderableEntity(handle, { runtime: { body: 'static' }, ...extra });
}

describe('RenderBundleManager', () => {
	it('registers a static entity into a bundle group and reports stats', () => {
		const scene = new Scene();
		const manager = new RenderBundleManager(scene);
		const entity = makeStaticEntity(0);

		const key = manager.register(entity);
		expect(key).not.toBeNull();
		expect(manager.has(entity)).toBe(true);
		expect(manager.getStats()).toMatchObject({ bundleCount: 1, entityCount: 1 });
		// The renderable is reparented out of the scene into the bundle group.
		expect(entity.mesh.parent).not.toBeNull();
		expect(entity.mesh.parent).not.toBe(scene);
	});

	it('renders a dynamic entity directly in the scene (no bundle)', () => {
		const scene = new Scene();
		const manager = new RenderBundleManager(scene);
		const entity = makeRenderableEntity(0, { runtime: { body: 'dynamic' } });

		const key = manager.register(entity);
		expect(key).not.toBeNull();
		expect(manager.has(entity)).toBe(true);
		// Dynamic meshes are scene-direct, so no bundle group is created.
		expect(manager.getStats()).toMatchObject({ bundleCount: 0, entityCount: 1 });
		expect(entity.mesh.parent).toBe(scene);
	});

	it('treats an entity with no body as dynamic (scene-direct)', () => {
		const scene = new Scene();
		const manager = new RenderBundleManager(scene);
		const entity = makeRenderableEntity(0);

		manager.register(entity);
		expect(manager.getStats().bundleCount).toBe(0);
		expect(entity.mesh.parent).toBe(scene);
	});

	it('groups static entities with matching geometry+material under one bundle', () => {
		const scene = new Scene();
		const manager = new RenderBundleManager(scene);

		manager.register(makeStaticEntity(0, { size: { x: 1, y: 1, z: 1 } }));
		manager.register(makeStaticEntity(1, { size: { x: 1, y: 1, z: 1 } }));

		expect(manager.getStats().entityCount).toBe(2);
		expect(manager.getStats().bundleCount).toBe(1);
	});

	it('syncs interpolated transforms from the resolver onto the renderable', () => {
		const scene = new Scene();
		const manager = new RenderBundleManager(scene);
		const entity = makeRenderableEntity(3);
		manager.register(entity);

		const resolve = (handle: number, out: BridgeTransform): BridgeTransform | null => {
			expect(handle).toBe(3);
			out.position[0] = 5;
			out.position[1] = -2;
			out.position[2] = 1;
			out.rotation[0] = 0;
			out.rotation[1] = 0;
			out.rotation[2] = 0;
			out.rotation[3] = 1;
			out.scale = 2;
			return out;
		};

		manager.sync(resolve);

		expect(entity.mesh.position.x).toBeCloseTo(5, 5);
		expect(entity.mesh.position.y).toBeCloseTo(-2, 5);
		expect(entity.mesh.scale.x).toBeCloseTo(2, 5);
		expect(entity.mesh.scale.z).toBeCloseTo(2, 5);
	});

	it('skips entities the resolver cannot resolve', () => {
		const scene = new Scene();
		const manager = new RenderBundleManager(scene);
		const entity = makeRenderableEntity(7);
		manager.register(entity);
		entity.mesh.position.set(9, 9, 9);

		manager.sync(() => null);
		// Unchanged because the resolver returned null.
		expect(entity.mesh.position.x).toBeCloseTo(9, 5);
	});

	it('unregisters a static entity and drops it from stats', () => {
		const scene = new Scene();
		const manager = new RenderBundleManager(scene);
		const entity = makeStaticEntity(0);
		manager.register(entity);

		manager.unregister(entity);
		expect(manager.has(entity)).toBe(false);
		expect(manager.getStats().entityCount).toBe(0);
	});

	it('unregisters a dynamic entity from the scene', () => {
		const scene = new Scene();
		const manager = new RenderBundleManager(scene);
		const entity = makeRenderableEntity(0, { runtime: { body: 'dynamic' } });
		manager.register(entity);
		expect(entity.mesh.parent).toBe(scene);

		manager.unregister(entity);
		expect(manager.has(entity)).toBe(false);
		expect(entity.mesh.parent).toBeNull();
		expect(manager.getStats().entityCount).toBe(0);
	});

	it('raycasts against managed meshes and maps the hit back to an entity uuid', () => {
		const scene = new Scene();
		const manager = new RenderBundleManager(scene);
		const entity = makeRenderableEntity(0);
		manager.register(entity);
		scene.updateMatrixWorld(true);

		const raycaster = new Raycaster();
		// Shoot from +Z toward the unit box sitting at the origin.
		raycaster.set(new Vector3(0, 0, 5), new Vector3(0, 0, -1));

		const hit = manager.raycast(raycaster);
		expect(hit).not.toBeNull();
		expect(hit!.uuid).toBe(entity.uuid);
		expect(hit!.distance).toBeGreaterThan(0);
	});

	it('raycast returns null when nothing is hit', () => {
		const scene = new Scene();
		const manager = new RenderBundleManager(scene);
		manager.register(makeRenderableEntity(0));
		scene.updateMatrixWorld(true);

		const raycaster = new Raycaster();
		raycaster.set(new Vector3(50, 50, 5), new Vector3(0, 0, -1));
		expect(manager.raycast(raycaster)).toBeNull();
	});

	it('returns null when the entity has no renderable', () => {
		const scene = new Scene();
		const manager = new RenderBundleManager(scene);
		const entity: any = { uuid: 'no-render', options: {}, materials: [], mesh: undefined, group: undefined, runtimeHandle: 0 };
		expect(manager.register(entity)).toBeNull();
	});

	it('opts a self-managed entity out via render: "none"', () => {
		const scene = new Scene();
		const manager = new RenderBundleManager(scene);
		const entity = makeRenderableEntity(0, { runtime: { render: 'none' } });
		expect(manager.register(entity)).toBeNull();
		expect(manager.has(entity)).toBe(false);
	});

	describe('instanced path (high-count repeats)', () => {
		it('draws batched entities via a scene-direct InstancedMesh', () => {
			const scene = new Scene();
			const manager = new RenderBundleManager(scene);
			const a = makeRenderableEntity(0, { batched: true, size: { x: 1, y: 1, z: 1 } });
			const b = makeRenderableEntity(1, { batched: true, size: { x: 1, y: 1, z: 1 } });

			manager.register(a);
			manager.register(b);

			const stats = manager.getStats();
			expect(stats.instancedBundleCount).toBe(1);
			expect(stats.entityCount).toBe(2);
			// No bundle group is created for instanced repeats.
			expect(stats.bundleCount).toBe(0);
			// Entity meshes are hidden; the InstancedMesh renders them.
			expect(a.mesh.visible).toBe(false);
			expect(a.isInstanced).toBe(true);
			expect(a.instanceId).toBe(0);
			expect(b.instanceId).toBe(1);
		});

		it('adds the InstancedMesh directly as a child of the scene', () => {
			const scene = new Scene();
			const manager = new RenderBundleManager(scene);
			const entity = makeRenderableEntity(0, { runtime: { render: 'instanced' }, size: { x: 1, y: 1, z: 1 } });
			manager.register(entity);
			// The mesh is created lazily once the batch count is known (first sync).
			manager.sync(() => null);

			// @ts-expect-error reach into the private mesh map for verification
			const mesh = manager.instancedMeshes.get(entity.batchKey);
			expect(mesh.parent).toBe(scene);
		});

		it('syncs instance matrices from the resolver', () => {
			const scene = new Scene();
			const manager = new RenderBundleManager(scene);
			const entity = makeRenderableEntity(4, { runtime: { render: 'instanced' }, size: { x: 1, y: 1, z: 1 } });
			manager.register(entity);

			manager.sync((_h, out) => {
				out.position[0] = 8;
				out.position[1] = 0;
				out.position[2] = 0;
				out.rotation[0] = 0; out.rotation[1] = 0; out.rotation[2] = 0; out.rotation[3] = 1;
				out.scale = 1;
				return out;
			});

			// Read the instance matrix back out and confirm the translation.
			const stats = manager.getStats();
			expect(stats.instancedBundleCount).toBe(1);
			// @ts-expect-error reach into the private mesh map for verification
			const mesh = manager.instancedMeshes.get(entity.batchKey);
			const m = new Matrix4();
			mesh.getMatrixAt(0, m);
			const pos = new Vector3().setFromMatrixPosition(m);
			expect(pos.x).toBeCloseTo(8, 5);
		});

		it('frees the instance slot on unregister', () => {
			const scene = new Scene();
			const manager = new RenderBundleManager(scene);
			const entity = makeRenderableEntity(0, { batched: true, size: { x: 1, y: 1, z: 1 } });
			manager.register(entity);
			manager.unregister(entity);
			expect(manager.has(entity)).toBe(false);
			expect(entity.isInstanced).toBe(false);
			expect(manager.getStats().entityCount).toBe(0);
		});

		it('reuses a freed instance slot for the next batched entity', () => {
			const scene = new Scene();
			const manager = new RenderBundleManager(scene);
			const a = makeRenderableEntity(0, { batched: true, size: { x: 1, y: 1, z: 1 } });
			manager.register(a);
			manager.unregister(a);
			const b = makeRenderableEntity(1, { batched: true, size: { x: 1, y: 1, z: 1 } });
			manager.register(b);
			expect(b.instanceId).toBe(0);
		});
	});
});
