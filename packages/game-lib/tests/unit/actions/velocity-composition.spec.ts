import { describe, expect, it } from 'vitest';
import { applyTransformChanges } from '../../../src/lib/actions/capabilities/apply-transform';
import { createTransformStore } from '../../../src/lib/actions/capabilities/transform-store';
import { setVelocityIntent } from '../../../src/lib/actions/capabilities/velocity-intents';

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

describe('velocity composition', () => {
	it('composes first-person XZ with jumper Y in same frame', () => {
		const body = new MockRigidBody();
		const store = createTransformStore();

		setVelocityIntent(store, 'first-person', { x: 4, z: -6 }, { mode: 'replace', priority: 10 });
		setVelocityIntent(store, 'jumper-3d', { y: 8 }, { mode: 'replace', priority: 20 });

		applyTransformChanges({ body: body as any }, store);

		expect(body.linvel()).toEqual({ x: 4, y: 8, z: -6 });
	});

	it('uses highest-priority replace intent on the same axis', () => {
		const body = new MockRigidBody();
		const store = createTransformStore();

		setVelocityIntent(store, 'first-person', { x: 3 }, { mode: 'replace', priority: 10 });
		setVelocityIntent(store, 'jumper-3d', { x: 11 }, { mode: 'replace', priority: 20 });

		applyTransformChanges({ body: body as any }, store);

		expect(body.linvel().x).toBe(11);
	});

	it('applies add intents on top of replace intents', () => {
		const body = new MockRigidBody();
		body.setLinvel({ x: 2, y: 0, z: 0 });
		const store = createTransformStore();

		setVelocityIntent(store, 'first-person', { x: 5 }, { mode: 'replace', priority: 10 });
		setVelocityIntent(store, 'actions', { x: 1.5 }, { mode: 'add', priority: 5 });

		applyTransformChanges({ body: body as any }, store);

		expect(body.linvel().x).toBeCloseTo(6.5);
	});

	it('supports legacy per-axis writes alongside velocity channels', () => {
		const body = new MockRigidBody();
		body.setLinvel({ x: 0, y: 0, z: 9 });
		const store = createTransformStore();

		setVelocityIntent(store, 'first-person', { x: 7 }, { mode: 'replace', priority: 10 });
		store.velocity.y = 4;
		store.dirty.velocityY = true;

		applyTransformChanges({ body: body as any }, store);

		expect(body.linvel()).toEqual({ x: 7, y: 4, z: 9 });
		expect(store.dirty.velocityChannels).toBe(false);
		expect(Object.keys(store.velocityChannels)).toHaveLength(0);
	});
});
