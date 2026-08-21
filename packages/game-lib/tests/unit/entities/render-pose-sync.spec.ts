import { Group, Mesh, Quaternion } from 'three';
import { describe, expect, it, vi } from 'vitest';

import {
	syncRenderPoseFromBody,
	syncRenderRotationFromBody,
	type SpawnPlacementEntity,
} from '../../../src/lib/entities/spawn-placement';
import { createBox } from '../../../src/lib/entities/box';

/** A quarter turn about Y, as a plain quaternion. */
const QUARTER_TURN_Y = new Quaternion().setFromAxisAngle({ x: 0, y: 1, z: 0 } as any, Math.PI / 2);

function quat() {
	const { x, y, z, w } = QUARTER_TURN_Y;
	return { x, y, z, w };
}

/** A physics body that reports whatever pose was last written to it. */
function fakeBody(rotation = quat(), position = { x: 0, y: 0, z: 0 }) {
	const state = { rotation, position };
	return {
		state,
		translation: () => state.position,
		rotation: () => state.rotation,
		setTranslation: (next: typeof position) => {
			state.position = next;
		},
		setRotation: (next: typeof rotation) => {
			state.rotation = next;
		},
		markPoseDiscontinuity: vi.fn(),
	};
}

function entityWithBody(
	overrides: Partial<SpawnPlacementEntity> = {},
): SpawnPlacementEntity & { group: Group } {
	const group = new Group();
	return {
		options: {},
		group,
		physicsAttached: true,
		body: fakeBody() as never,
		...overrides,
	} as SpawnPlacementEntity & { group: Group };
}

describe('syncRenderRotationFromBody', () => {
	it('writes the body rotation onto the render object', () => {
		const entity = entityWithBody();

		syncRenderRotationFromBody(entity);

		expect(entity.group.quaternion.angleTo(QUARTER_TURN_Y)).toBeCloseTo(0);
	});

	it('leaves an entity that owns its own facing alone', () => {
		// Matches the per-frame `syncRenderPoses`: writing here would fight
		// whatever is steering the entity.
		const entity = entityWithBody({ controlledRotation: true });

		syncRenderRotationFromBody(entity);

		expect(entity.group.quaternion.angleTo(new Quaternion())).toBeCloseTo(0);
	});

	it('reads the wasm pose when there is no physics body', () => {
		const entity = entityWithBody({
			physicsAttached: false,
			body: null,
			runtimeHandle: 3,
			wasmStageRef: {
				getPose: (handle: number) =>
					handle === 3
						? { position: [0, 0, 0], rotation: [...QUARTER_TURN_Y.toArray()] }
						: null,
			} as never,
		});

		syncRenderRotationFromBody(entity);

		expect(entity.group.quaternion.angleTo(QUARTER_TURN_Y)).toBeCloseTo(0);
	});

	it('falls back to the wasm pose when the body read throws', () => {
		const entity = entityWithBody({
			body: {
				rotation: () => {
					throw new Error('body detached');
				},
			} as never,
			runtimeHandle: 0,
			wasmStageRef: {
				getPose: () => ({ position: [0, 0, 0], rotation: [...QUARTER_TURN_Y.toArray()] }),
			} as never,
		});

		syncRenderRotationFromBody(entity);

		expect(entity.group.quaternion.angleTo(QUARTER_TURN_Y)).toBeCloseTo(0);
	});

	it('does nothing for an entity with no render object', () => {
		const entity = entityWithBody({ group: undefined });

		expect(() => syncRenderRotationFromBody(entity)).not.toThrow();
	});

	it('prefers the mesh when there is no group', () => {
		const mesh = new Mesh();
		const entity = entityWithBody({ group: undefined, mesh });

		syncRenderRotationFromBody(entity);

		expect(mesh.quaternion.angleTo(QUARTER_TURN_Y)).toBeCloseTo(0);
	});
});

describe('syncRenderPoseFromBody', () => {
	it('writes both halves of the pose', () => {
		const entity = entityWithBody({
			body: fakeBody(quat(), { x: 1, y: 2, z: 3 }) as never,
		});

		syncRenderPoseFromBody(entity);

		expect(entity.group.position.toArray()).toEqual([1, 2, 3]);
		expect(entity.group.quaternion.angleTo(QUARTER_TURN_Y)).toBeCloseTo(0);
	});
});

describe('setPose', () => {
	/** A box with a fake body attached, as if it had been spawned. */
	function spawnedBox() {
		const box = createBox({ size: { x: 1, y: 1, z: 1 } });
		const body = fakeBody(
			{ x: 0, y: 0, z: 0, w: 1 },
			{ x: 0, y: 0, z: 0 },
		);
		(box as { body: unknown }).body = body;
		box.physicsAttached = true;
		return { box, body };
	}

	it('shows a rotation immediately, without waiting for the next update', () => {
		// The regression this exists for: rotation reached the render object only
		// through the per-frame `syncRenderPoses`, which is skipped while the
		// stage is paused — so rotating from the editor did nothing visible until
		// playback resumed.
		const { box } = spawnedBox();
		const target = box.group ?? box.mesh!;

		box.setPose({ rotation: quat() });

		expect(target.quaternion.angleTo(QUARTER_TURN_Y)).toBeCloseTo(0);
	});

	it('still shows a position-only change immediately', () => {
		const { box } = spawnedBox();
		const target = box.group ?? box.mesh!;

		box.setPose({ position: { x: 4, y: 5, z: 6 } });

		expect(target.position.toArray()).toEqual([4, 5, 6]);
	});

	it('applies position and rotation together', () => {
		const { box } = spawnedBox();
		const target = box.group ?? box.mesh!;

		box.setPose({ position: { x: 1, y: 0, z: -1 }, rotation: quat() });

		expect(target.position.toArray()).toEqual([1, 0, -1]);
		expect(target.quaternion.angleTo(QUARTER_TURN_Y)).toBeCloseTo(0);
	});
});
