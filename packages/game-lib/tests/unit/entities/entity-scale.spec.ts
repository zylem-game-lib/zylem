import { describe, expect, it, vi } from 'vitest';

import {
	commitColliderScale,
	ensureColliderBaseline,
	scaleColliderDefinition,
	type ScalableEntity,
} from '../../../src/lib/entities/entity-scale';

type Definition = ScalableEntity['colliderDescs'][number];

function boxDefinition(halfExtents: [number, number, number] = [0.5, 0.5, 0.5]): Definition {
	return { shape: { type: 'box', halfExtents } } as Definition;
}

interface FakeWorld {
	destroyEntity: ReturnType<typeof vi.fn>;
	addEntity: ReturnType<typeof vi.fn>;
	/** Order of calls, so a respawn can be distinguished from a stray add. */
	calls: string[];
}

function fakeWorld(): FakeWorld {
	const calls: string[] = [];
	return {
		calls,
		destroyEntity: vi.fn(() => {
			calls.push('destroy');
		}),
		addEntity: vi.fn(() => {
			calls.push('add');
		}),
	};
}

function scalableEntity(options: {
	definitions?: Definition[];
	scale?: { x: number; y: number; z: number };
	world?: FakeWorld | null;
	pose?: ScalableEntity['colliderBaseline'] extends never ? never : ReturnType<ScalableEntity['getPose']>;
}): ScalableEntity {
	const definitions = options.definitions ?? [boxDefinition()];
	const scale = options.scale ?? { x: 1, y: 1, z: 1 };
	const pose = options.pose ?? {
		position: { x: 3, y: 1.5, z: -2 },
		rotation: { x: 0, y: 0, z: 0, w: 1 },
	};

	return {
		uuid: 'entity-1',
		bodyDesc: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
		colliderDesc: definitions[0],
		colliderDescs: [...definitions],
		physicsWorldRef: options.world ?? null,
		colliderScaleDirty: true,
		colliderBaseline: null,
		getScale: () => scale,
		getPose: () => pose,
	};
}

describe('scaleColliderDefinition', () => {
	it('scales box half-extents per axis', () => {
		const scaled = scaleColliderDefinition(boxDefinition([0.5, 1, 2]), {
			x: 2,
			y: 3,
			z: 0.5,
		});
		expect(scaled.shape).toEqual({ type: 'box', halfExtents: [1, 3, 1] });
	});

	it('takes the largest factor for a sphere radius', () => {
		// A sphere has one radius, so a non-uniform scale cannot be represented
		// exactly; the collider must still enclose the mesh.
		const scaled = scaleColliderDefinition(
			{ shape: { type: 'sphere', radius: 1 } } as Definition,
			{ x: 1, y: 2.5, z: 0.5 },
		);
		expect(scaled.shape).toEqual({ type: 'sphere', radius: 2.5 });
	});

	it('scales capsule height along Y and radius across it', () => {
		const scaled = scaleColliderDefinition(
			{ shape: { type: 'capsule', halfHeight: 1, radius: 0.5 } } as Definition,
			{ x: 2, y: 3, z: 1 },
		);
		expect(scaled.shape).toEqual({ type: 'capsule', halfHeight: 3, radius: 1 });
	});

	it('scales the collider offset with the shape', () => {
		const scaled = scaleColliderDefinition(
			{ shape: { type: 'box', halfExtents: [1, 1, 1] }, offset: [0, 2, 0] } as Definition,
			{ x: 1, y: 0.5, z: 1 },
		);
		expect(scaled.offset).toEqual([0, 1, 0]);
	});

	it('scales convex hull vertices', () => {
		const vertices = new Float32Array([1, 2, 3, -1, -2, -3]);
		const scaled = scaleColliderDefinition(
			{ shape: { type: 'convexHull', vertices } } as Definition,
			{ x: 2, y: 1, z: 0.5 },
		);
		expect(Array.from((scaled.shape as { vertices: Float32Array }).vertices)).toEqual([
			2, 2, 1.5, -2, -2, -1.5,
		]);
	});

	it('leaves the source definition untouched', () => {
		const original = boxDefinition([0.5, 0.5, 0.5]);
		scaleColliderDefinition(original, { x: 4, y: 4, z: 4 });
		expect(original.shape).toEqual({ type: 'box', halfExtents: [0.5, 0.5, 0.5] });
	});
});

describe('ensureColliderBaseline', () => {
	it('captures the definitions once and reuses them', () => {
		const entity = scalableEntity({});
		const first = ensureColliderBaseline(entity);
		entity.colliderDescs = [boxDefinition([9, 9, 9])];
		const second = ensureColliderBaseline(entity);

		// The baseline is pristine: later (already scaled) definitions must not
		// replace it, or scaling would compound.
		expect(second).toBe(first);
		expect(second[0]!.shape).toEqual({ type: 'box', halfExtents: [0.5, 0.5, 0.5] });
	});

	it('falls back to the single colliderDesc when the list is empty', () => {
		const entity = scalableEntity({});
		entity.colliderDescs = [];
		entity.colliderDesc = boxDefinition([1, 2, 3]);
		expect(ensureColliderBaseline(entity)[0]!.shape).toEqual({
			type: 'box',
			halfExtents: [1, 2, 3],
		});
	});
});

describe('commitColliderScale', () => {
	it('rebuilds colliders at the current scale and respawns the body', () => {
		const world = fakeWorld();
		const entity = scalableEntity({ scale: { x: 2, y: 1, z: 0.5 }, world });

		expect(commitColliderScale(entity)).toBe(true);
		expect(entity.colliderDescs[0]!.shape).toEqual({
			type: 'box',
			halfExtents: [1, 0.5, 0.25],
		});
		expect(entity.colliderDesc).toBe(entity.colliderDescs[0]);
		// Destroy then add: the runtime has no resize, so the body is recreated.
		expect(world.calls).toEqual(['destroy', 'add']);
	});

	it('respawns at the live pose rather than where the body first spawned', () => {
		const world = fakeWorld();
		const entity = scalableEntity({ scale: { x: 2, y: 2, z: 2 }, world });

		commitColliderScale(entity);

		expect(entity.bodyDesc?.position).toEqual([3, 1.5, -2]);
		expect(entity.bodyDesc?.rotation).toEqual([0, 0, 0, 1]);
	});

	it('keeps the same entity instance and uuid across the respawn', () => {
		const world = fakeWorld();
		const entity = scalableEntity({ scale: { x: 3, y: 3, z: 3 }, world });

		commitColliderScale(entity);

		// Undo has to find the same object under the same uuid.
		expect(world.destroyEntity).toHaveBeenCalledWith(entity);
		expect(world.addEntity).toHaveBeenCalledWith(entity);
		expect(entity.uuid).toBe('entity-1');
	});

	it('is absolute, not compounding, across repeated commits', () => {
		const world = fakeWorld();
		const scale = { x: 0.5, y: 0.5, z: 0.5 };
		const entity = scalableEntity({ scale, world });

		commitColliderScale(entity);
		entity.colliderScaleDirty = true;
		commitColliderScale(entity);

		// Two commits at 0.5 stay at 0.5 — they do not land on 0.25.
		expect(entity.colliderDescs[0]!.shape).toEqual({
			type: 'box',
			halfExtents: [0.25, 0.25, 0.25],
		});
	});

	it('does nothing when the scale is unchanged', () => {
		const world = fakeWorld();
		const entity = scalableEntity({ world });
		entity.colliderScaleDirty = false;

		expect(commitColliderScale(entity)).toBe(false);
		expect(world.calls).toEqual([]);
	});

	it('updates definitions without a world so a later spawn uses them', () => {
		const entity = scalableEntity({ scale: { x: 2, y: 2, z: 2 }, world: null });

		expect(commitColliderScale(entity)).toBe(true);
		expect(entity.colliderDescs[0]!.shape).toEqual({
			type: 'box',
			halfExtents: [1, 1, 1],
		});
	});

	it('rebuilds every collider on a compound entity', () => {
		const world = fakeWorld();
		const entity = scalableEntity({
			definitions: [boxDefinition([1, 1, 1]), boxDefinition([2, 2, 2])],
			scale: { x: 2, y: 2, z: 2 },
			world,
		});

		commitColliderScale(entity);

		expect(entity.colliderDescs.map((d) => d.shape)).toEqual([
			{ type: 'box', halfExtents: [2, 2, 2] },
			{ type: 'box', halfExtents: [4, 4, 4] },
		]);
	});
});
