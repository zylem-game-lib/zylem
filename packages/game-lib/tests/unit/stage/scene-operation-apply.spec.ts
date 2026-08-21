import { describe, expect, it, vi } from 'vitest';

import type { SceneOperationPayload } from '@zylem/bridge';
import { applySceneOperationPoses } from '../../../src/lib/stage/stage-transform-tool';
import { eulerToQuaternion } from '../../../src/lib/core/transform-math';

function fakeEntity(uuid = 'entity-1') {
	const pose = {
		position: { x: 5, y: 5, z: 5 },
		rotation: { x: 0, y: 0, z: 0, w: 1 },
	};
	const scale = { x: 1, y: 1, z: 1 };

	return {
		uuid,
		colliderScaleDirty: false,
		colliderBaseline: null,
		colliderDesc: undefined,
		colliderDescs: [],
		physicsWorldRef: null,
		bodyDesc: null,
		getPose: () => ({ position: { ...pose.position }, rotation: { ...pose.rotation } }),
		setPose: vi.fn((next: { position?: any; rotation?: any }) => {
			if (next.position) pose.position = { ...next.position };
			if (next.rotation) pose.rotation = { ...next.rotation };
			return true;
		}),
		getScale: () => ({ ...scale }),
		setScale: vi.fn((x: number, y: number, z: number) => {
			scale.x = x;
			scale.y = y;
			scale.z = z;
		}),
	};
}

function transformOperation(
	entries: SceneOperationPayload['entries'],
): SceneOperationPayload {
	return { opId: 'op-1', kind: 'transform', label: 'Move', entries };
}

function resolverFor(...entities: ReturnType<typeof fakeEntity>[]) {
	const byUuid = new Map(entities.map((entity) => [entity.uuid, entity]));
	return (uuid: string) => (byUuid.get(uuid) as any) ?? null;
}

describe('applySceneOperationPoses', () => {
	it('writes the before pose when undoing', () => {
		const entity = fakeEntity();
		const op = transformOperation([
			{
				uuid: 'entity-1',
				before: { position: { x: 1, y: 2, z: 3 } },
				after: { position: { x: 9, y: 9, z: 9 } },
			},
		]);

		applySceneOperationPoses(op, 'undo', resolverFor(entity));

		expect(entity.getPose().position).toEqual({ x: 1, y: 2, z: 3 });
	});

	it('writes the after pose when redoing', () => {
		const entity = fakeEntity();
		const op = transformOperation([
			{
				uuid: 'entity-1',
				before: { position: { x: 1, y: 2, z: 3 } },
				after: { position: { x: 9, y: 8, z: 7 } },
			},
		]);

		applySceneOperationPoses(op, 'redo', resolverFor(entity));

		expect(entity.getPose().position).toEqual({ x: 9, y: 8, z: 7 });
	});

	it('round-trips back to the original pose', () => {
		const entity = fakeEntity();
		const op = transformOperation([
			{
				uuid: 'entity-1',
				before: { position: { x: 1, y: 2, z: 3 } },
				after: { position: { x: 9, y: 8, z: 7 } },
			},
		]);

		applySceneOperationPoses(op, 'redo', resolverFor(entity));
		applySceneOperationPoses(op, 'undo', resolverFor(entity));
		applySceneOperationPoses(op, 'redo', resolverFor(entity));

		// Replaying is idempotent because the record holds absolute poses rather
		// than deltas.
		expect(entity.getPose().position).toEqual({ x: 9, y: 8, z: 7 });
	});

	it('prefers the quaternion over the euler angles', () => {
		const entity = fakeEntity();
		const quaternion = eulerToQuaternion({ x: 0, y: Math.PI / 4, z: 0 });
		const op = transformOperation([
			{
				uuid: 'entity-1',
				before: {
					// Deliberately inconsistent: the quaternion is authoritative, so
					// the misleading euler values must be ignored.
					rotation: { x: 1, y: 1, z: 1 },
					quaternion,
				},
			},
		]);

		applySceneOperationPoses(op, 'undo', resolverFor(entity));

		const applied = entity.getPose().rotation;
		expect(applied.y).toBeCloseTo(quaternion.y);
		expect(applied.w).toBeCloseTo(quaternion.w);
	});

	it('falls back to euler angles when no quaternion was recorded', () => {
		const entity = fakeEntity();
		const op = transformOperation([
			{ uuid: 'entity-1', before: { rotation: { x: 0, y: Math.PI / 2, z: 0 } } },
		]);

		applySceneOperationPoses(op, 'undo', resolverFor(entity));

		const expected = eulerToQuaternion({ x: 0, y: Math.PI / 2, z: 0 });
		expect(entity.getPose().rotation.y).toBeCloseTo(expected.y);
	});

	it('restores scale and rebuilds colliders', () => {
		const entity = fakeEntity();
		const op = transformOperation([
			{ uuid: 'entity-1', before: { scale: { x: 2, y: 2, z: 2 } } },
		]);

		applySceneOperationPoses(op, 'undo', resolverFor(entity));

		expect(entity.setScale).toHaveBeenCalledWith(2, 2, 2);
		// Picking raycasts the physics world, so a reverted scale that skipped
		// the collider rebuild would leave the entity unpickable at its new size.
		expect(entity.colliderScaleDirty).toBe(false);
	});

	it('applies every entry of a multi-entity operation', () => {
		const first = fakeEntity('entity-1');
		const second = fakeEntity('entity-2');
		const op = transformOperation([
			{ uuid: 'entity-1', before: { position: { x: 1, y: 0, z: 0 } } },
			{ uuid: 'entity-2', before: { position: { x: 2, y: 0, z: 0 } } },
		]);

		applySceneOperationPoses(op, 'undo', resolverFor(first, second));

		expect(first.getPose().position.x).toBe(1);
		expect(second.getPose().position.x).toBe(2);
	});

	it('skips entries whose entity is gone', () => {
		const entity = fakeEntity('entity-1');
		const op = transformOperation([
			{ uuid: 'missing', before: { position: { x: 1, y: 0, z: 0 } } },
			{ uuid: 'entity-1', before: { position: { x: 4, y: 0, z: 0 } } },
		]);

		expect(() =>
			applySceneOperationPoses(op, 'undo', resolverFor(entity)),
		).not.toThrow();
		expect(entity.getPose().position.x).toBe(4);
	});

	it('skips entries with no pose for the direction being applied', () => {
		const entity = fakeEntity();
		// Create and delete operations carry uuids only; there is nothing to write.
		const op = transformOperation([{ uuid: 'entity-1' }]);

		applySceneOperationPoses(op, 'undo', resolverFor(entity));

		expect(entity.setPose).not.toHaveBeenCalled();
		expect(entity.setScale).not.toHaveBeenCalled();
	});

	it('leaves untouched components alone', () => {
		const entity = fakeEntity();
		const op = transformOperation([
			{ uuid: 'entity-1', before: { position: { x: 1, y: 1, z: 1 } } },
		]);

		applySceneOperationPoses(op, 'undo', resolverFor(entity));

		// A move-only operation must not reset the entity's scale.
		expect(entity.setScale).not.toHaveBeenCalled();
		expect(entity.getScale()).toEqual({ x: 1, y: 1, z: 1 });
	});

	it('writes an absolute pose, not a delta from the current one', () => {
		const entity = fakeEntity();
		const op = transformOperation([
			{ uuid: 'entity-1', before: { position: { x: 1, y: 2, z: 3 } } },
		]);

		applySceneOperationPoses(op, 'undo', resolverFor(entity));
		applySceneOperationPoses(op, 'undo', resolverFor(entity));

		// Applying twice lands in the same place. A delta-based write would send
		// the entity flying off by its own coordinates.
		expect(entity.getPose().position).toEqual({ x: 1, y: 2, z: 3 });
	});

	it('hands the entity a plain position rather than a Vector3', () => {
		const entity = fakeEntity();
		const op = transformOperation([
			{ uuid: 'entity-1', before: { position: { x: 1.5, y: -2, z: 0 } } },
		]);

		applySceneOperationPoses(op, 'undo', resolverFor(entity));

		// `setPose` forwards straight into the wasm runtime, which reads plain
		// numeric fields.
		const [call] = entity.setPose.mock.calls;
		expect(call![0].position).toEqual({ x: 1.5, y: -2, z: 0 });
	});
});
