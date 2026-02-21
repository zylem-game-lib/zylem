import { describe, expect, it } from 'vitest';
import { sequence } from '../../../src/lib/actions/composition';
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

describe('action composition with velocity intents', () => {
	it('sequence advances actions without carrying stale action-channel intent', () => {
		const body = new MockRigidBody();
		const store = createTransformStore();
		const entity = { transformStore: store } as any;

		const seq = sequence(
			moveBy({ x: 4, duration: 500 }),
			moveBy({ x: -2, duration: 500 }),
		);

		seq.tick(entity, 0.5);
		applyTransformChanges({ body: body as any }, store);
		expect(body.linvel().x).toBeCloseTo(8);

		clearVelocityIntent(store, 'actions');
		seq.tick(entity, 0.5);
		applyTransformChanges({ body: body as any }, store);
		expect(body.linvel().x).toBeCloseTo(-4);
		expect(seq.done).toBe(true);
	});
});
