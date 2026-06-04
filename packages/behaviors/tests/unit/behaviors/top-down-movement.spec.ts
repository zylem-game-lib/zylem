import { describe, expect, it } from 'vitest';

import { TopDownMovementRuntimeBehavior } from '../../../src/lib/behaviors/top-down-movement';

function createEntity() {
	return {
		body: {
			linvel: () => ({ x: 0, y: 0, z: 3 }),
		},
		transformStore: {
			velocity: { x: 0, y: 0, z: 0 },
			dirty: { velocity: false },
		},
		setRotationZ(angle: number) {
			this._rotation = angle;
		},
		_rotation: 0,
		topDownMovement: { moveSpeed: 8 },
		$topDownMovement: {
			moveX: 0,
			moveY: 0,
			faceX: 0,
			faceY: 0,
		},
		topDownMovementState: {
			facingAngle: 0,
			moving: false,
		},
	};
}

describe('TopDownMovementRuntimeBehavior', () => {
	it('normalizes diagonal movement', () => {
		const behavior = new TopDownMovementRuntimeBehavior();
		const entity = createEntity();
		entity.$topDownMovement.moveX = 1;
		entity.$topDownMovement.moveY = 1;

		behavior.updateEntity(entity as any, 1 / 60);

		expect(entity.transformStore.velocity.x).toBeCloseTo(5.65685424949238);
		expect(entity.transformStore.velocity.y).toBeCloseTo(5.65685424949238);
		expect(entity.transformStore.velocity.z).toBe(3);
		expect(entity.topDownMovementState.moving).toBe(true);
	});

	it('stops xy velocity when move input is zero', () => {
		const behavior = new TopDownMovementRuntimeBehavior();
		const entity = createEntity();
		entity.transformStore.velocity.x = 4;
		entity.transformStore.velocity.y = -2;

		behavior.updateEntity(entity as any, 1 / 60);

		expect(entity.transformStore.velocity.x).toBe(0);
		expect(entity.transformStore.velocity.y).toBe(0);
		expect(entity.topDownMovementState.moving).toBe(false);
	});

	it('updates facing angle from aim input', () => {
		const behavior = new TopDownMovementRuntimeBehavior();
		const entity = createEntity();
		entity.$topDownMovement.faceX = 1;
		entity.$topDownMovement.faceY = 0;

		behavior.updateEntity(entity as any, 1 / 60);

		expect(entity.topDownMovementState.facingAngle).toBeCloseTo(-Math.PI / 2);
		expect(entity._rotation).toBeCloseTo(-Math.PI / 2);
	});

	it('preserves last facing angle when aim input is idle', () => {
		const behavior = new TopDownMovementRuntimeBehavior();
		const entity = createEntity();
		entity.topDownMovementState.facingAngle = 1.25;

		behavior.updateEntity(entity as any, 1 / 60);

		expect(entity.topDownMovementState.facingAngle).toBeCloseTo(1.25);
		expect(entity._rotation).toBeCloseTo(1.25);
	});
});
