import { Group, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { applyTransformChanges } from '../../../src/lib/actions/capabilities/apply-transform';
import { rotateInDirection } from '../../../src/lib/actions/capabilities/rotatable';
import { createTransformStore } from '../../../src/lib/actions/capabilities/transform-store';

class MockRigidBody {
	public appliedRotation = { x: 0, y: 0, z: 0, w: 1 };

	linvel(): { x: number; y: number; z: number } {
		return { x: 0, y: 0, z: 0 };
	}

	setLinvel(): void {}
	setAngvel(): void {}
	translation(): { x: number; y: number; z: number } {
		return { x: 0, y: 0, z: 0 };
	}
	setTranslation(): void {}

	setRotation(next: { x: number; y: number; z: number; w: number }): void {
		this.appliedRotation = { ...next };
	}
}

describe('rotatable actions', () => {
	it('rotateInDirection writes the authoritative body rotation, not just the render group', () => {
		const body = new MockRigidBody();
		const group = new Group();
		const transformStore = createTransformStore();
		const entity = { body: body as any, group, transformStore };

		rotateInDirection(entity, new Vector3(1, 0, 0));

		expect(transformStore.dirty.rotation).toBe(true);
		expect(Math.abs(group.quaternion.y)).toBeCloseTo(Math.SQRT1_2, 5);
		expect(Math.abs(group.quaternion.w)).toBeCloseTo(Math.SQRT1_2, 5);

		applyTransformChanges(entity as any, transformStore);

		expect(body.appliedRotation.y).toBeCloseTo(Math.SQRT1_2, 5);
		expect(body.appliedRotation.w).toBeCloseTo(Math.SQRT1_2, 5);
	});
});
