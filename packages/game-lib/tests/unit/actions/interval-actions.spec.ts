import { describe, expect, it } from 'vitest';
import { moveBy } from '../../../src/lib/actions/interval-actions';
import { createTransformStore } from '../../../src/lib/actions/capabilities/transform-store';
import { applyTransformChanges } from '../../../src/lib/actions/capabilities/apply-transform';
import { clearVelocityIntent } from '../../../src/lib/actions/capabilities/velocity-intents';

class MockRigidBody {
	private velocity = { x: 0, y: 0, z: 0 };

	linvel(): { x: number; y: number; z: number } {
		return { ...this.velocity };
	}

	setLinvel(next: { x: number; y: number; z: number }): void {
		this.velocity = { ...next };
	}

	setRotation(): void {}
	setAngvel(): void {}
	translation(): { x: number; y: number; z: number } {
		return { x: 0, y: 0, z: 0 };
	}
	setTranslation(): void {}
}

describe('interval actions with velocity intents', () => {
	it('moveBy does not accumulate action velocity across frames when action channel is reset', () => {
		const body = new MockRigidBody();
		const store = createTransformStore();
		const entity = { transformStore: store } as any;
		const action = moveBy({ x: 10, duration: 1000 });

		action.tick(entity, 0.25);
		applyTransformChanges({ body: body as any }, store);
		expect(body.linvel().x).toBeCloseTo(10);

		// Simulate _tickActions reset behavior before next frame.
		clearVelocityIntent(store, 'actions');
		action.tick(entity, 0.25);
		applyTransformChanges({ body: body as any }, store);
		expect(body.linvel().x).toBeCloseTo(10);
	});
});
