import { BoxGeometry, Mesh, MeshStandardMaterial, Scene, SphereGeometry, Vector3 } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PlacementGhost } from '../../../src/lib/stage/placement-ghost';
import {
	clearEntityRegistry,
	registerEntityType,
	type EntityTypeFactory,
} from '../../../src/lib/entities/entity-registry';

afterEach(() => {
	clearEntityRegistry();
});

/** Register a placeable type whose factory is whatever the test needs. */
function registerType(
	id: string,
	create: EntityTypeFactory,
	defaultProps: Record<string, unknown> = { size: { x: 1, y: 1, z: 1 } },
) {
	const factory = vi.fn(create);
	registerEntityType({
		id,
		label: id,
		defaultProps,
		create: factory as EntityTypeFactory,
	});
	return factory;
}

/** A stand-in entity carrying a real mesh, as the shape factories produce. */
function nodeWithMesh(geometry = new BoxGeometry(2, 2, 2)) {
	return { mesh: new Mesh(geometry, new MeshStandardMaterial()) };
}

function ghostMeshes(scene: Scene): Mesh[] {
	const container = scene.getObjectByName('PlacementGhost');
	const meshes: Mesh[] = [];
	container?.traverse((node) => {
		if ((node as Mesh).isMesh) meshes.push(node as Mesh);
	});
	return meshes;
}

describe('PlacementGhost', () => {
	it('builds the silhouette from the armed type’s own factory', () => {
		// Not a per-type shape table: a host that registers its own entity gets
		// an accurate preview with no extra code.
		const scene = new Scene();
		registerType('sphere', () => nodeWithMesh(new SphereGeometry(3)) as never);
		const ghost = new PlacementGhost(scene);

		ghost.setType('sphere');

		expect(ghostMeshes(scene)[0]!.geometry).toBeInstanceOf(SphereGeometry);
	});

	it('never hands the factory’s own entity to the scene', () => {
		// The entity is a throwaway that is never spawned, which is what keeps
		// the ghost out of childrenMap, the editor's entity list, thumbnails and
		// the physics world. Only its render object is borrowed, and cloned.
		const scene = new Scene();
		let created: { mesh: Mesh } | null = null;
		registerType('box', () => {
			created = nodeWithMesh();
			return created as never;
		});
		const ghost = new PlacementGhost(scene);

		ghost.setType('box');

		expect(scene.children).toHaveLength(1);
		expect(ghostMeshes(scene)[0]).not.toBe(created!.mesh);
	});

	it('makes the preview translucent and shadow-free', () => {
		const scene = new Scene();
		registerType('box', () => nodeWithMesh() as never);
		const ghost = new PlacementGhost(scene);

		ghost.setType('box');
		const mesh = ghostMeshes(scene)[0]!;
		const material = mesh.material as MeshStandardMaterial;

		expect(material.transparent).toBe(true);
		expect(material.opacity).toBeLessThan(1);
		// Otherwise the ghost's own far faces would be hidden by its near ones,
		// and it would read as a solid object rather than a preview.
		expect(material.depthWrite).toBe(false);
		expect(mesh.castShadow).toBe(false);
	});

	it('falls back to a box sized from the type’s props when there is no mesh', () => {
		// Lights and text build their visuals during spawn, so there is nothing
		// to borrow — a box beats no preview at all.
		const scene = new Scene();
		registerType('light', () => ({}) as never, { size: { x: 2, y: 4, z: 6 } });
		const ghost = new PlacementGhost(scene);

		ghost.setType('light');

		expect(ghost.measure()!.toArray()).toEqual([2, 4, 6]);
	});

	it('falls back to a box when the factory throws', () => {
		const scene = new Scene();
		registerType('broken', () => {
			throw new Error('missing asset');
		});
		const ghost = new PlacementGhost(scene);

		expect(() => ghost.setType('broken')).not.toThrow();
		expect(ghostMeshes(scene)).toHaveLength(1);
	});

	it('falls back for a factory that only resolves later', () => {
		// A preview has to be on screen this frame, so a model still loading is
		// no use to it.
		const scene = new Scene();
		registerType('actor', () => Promise.resolve(nodeWithMesh()) as never, {
			size: { x: 1, y: 2, z: 1 },
		});
		const ghost = new PlacementGhost(scene);

		ghost.setType('actor');

		expect(ghost.measure()!.toArray()).toEqual([1, 2, 1]);
	});

	it('runs the factory once while the armed type stays put', () => {
		const scene = new Scene();
		const factory = registerType('box', () => nodeWithMesh() as never);
		const ghost = new PlacementGhost(scene);

		ghost.setType('box');
		ghost.setType('box');
		ghost.setType('box');

		expect(factory).toHaveBeenCalledTimes(1);
	});

	it('rebuilds when the same type is re-armed with different props', () => {
		// A host can register one type and arm it at different sizes, and a ghost
		// keyed on the id alone would keep previewing the old one.
		const scene = new Scene();
		const factory = registerType(
			'box',
			({ props }) => nodeWithMesh(new BoxGeometry(1, (props.size as { y: number }).y, 1)) as never,
		);
		const ghost = new PlacementGhost(scene);

		ghost.setType('box', { size: { x: 1, y: 2, z: 1 } });
		ghost.setType('box', { size: { x: 1, y: 8, z: 1 } });

		expect(factory).toHaveBeenCalledTimes(2);
		expect(ghost.measure()!.y).toBeCloseTo(8);
	});

	it('rebuilds when the armed type changes', () => {
		const scene = new Scene();
		registerType('box', () => nodeWithMesh() as never);
		registerType('sphere', () => nodeWithMesh(new SphereGeometry(1)) as never);
		const ghost = new PlacementGhost(scene);

		ghost.setType('box');
		ghost.setType('sphere');

		const meshes = ghostMeshes(scene);
		expect(meshes).toHaveLength(1);
		expect(meshes[0]!.geometry).toBeInstanceOf(SphereGeometry);
	});

	it('measures the silhouette, so the preview can rest on a surface', () => {
		const scene = new Scene();
		registerType('box', () => nodeWithMesh(new BoxGeometry(2, 6, 2)) as never);
		const ghost = new PlacementGhost(scene);

		ghost.setType('box');

		expect(ghost.measure()!.y).toBeCloseTo(6);
	});

	it('stays hidden until it is given somewhere to be', () => {
		const scene = new Scene();
		registerType('box', () => nodeWithMesh() as never);
		const ghost = new PlacementGhost(scene);
		const container = scene.getObjectByName('PlacementGhost')!;

		ghost.setType('box');
		expect(container.visible).toBe(false);

		ghost.showAt(new Vector3(1, 2, 3));
		expect(container.visible).toBe(true);
		expect(container.position.toArray()).toEqual([1, 2, 3]);

		ghost.hide();
		expect(container.visible).toBe(false);
	});

	it('leaves the scene as it found it, and releases the GPU buffers', () => {
		const scene = new Scene();
		registerType('box', () => nodeWithMesh() as never);
		const ghost = new PlacementGhost(scene);
		ghost.setType('box');

		const geometry = ghostMeshes(scene)[0]!.geometry;
		const disposed = vi.spyOn(geometry, 'dispose');

		ghost.dispose();

		expect(scene.children).toHaveLength(0);
		expect(disposed).toHaveBeenCalled();
	});
});
