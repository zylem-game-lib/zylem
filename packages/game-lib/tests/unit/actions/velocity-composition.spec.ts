import { describe, expect, it } from 'vitest';
import { applyTransformChanges } from '../../../src/lib/actions/capabilities/apply-transform';
import { createTransformStore } from '@zylem/behaviors/core';
import { setVelocityIntent } from '@zylem/behaviors/core';

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

	it('routes through the WASM runtime FFI when there is no Rapier body (Phase B)', () => {
		const calls: { linvel?: [number, number, number]; position?: [number, number, number] } = {};
		const runtime = {
			getLinearVelocity: () => [0, 0, 0] as [number, number, number],
			setLinearVelocity: (_s: number, x: number, y: number, z: number) => {
				calls.linvel = [x, y, z];
				return true;
			},
			setAngularVelocity: () => true,
			setRotation: () => true,
			setPosition: (_s: number, x: number, y: number, z: number) => {
				calls.position = [x, y, z];
				return true;
			},
			getPose: () => ({ position: [10, 0, 0] as [number, number, number], rotation: [0, 0, 0, 1] as [number, number, number, number] }),
		};
		const store = createTransformStore();

		setVelocityIntent(store, 'first-person', { x: 4, z: -6 }, { mode: 'replace', priority: 10 });
		store.position.x = 2;
		store.dirty.position = true;

		applyTransformChanges(
			{ body: null, runtimeHandle: 0, wasmStageRef: runtime } as any,
			store,
		);

		expect(calls.linvel).toEqual([4, 0, -6]);
		// position is a delta applied to the current runtime pose (10 + 2).
		expect(calls.position).toEqual([12, 0, 0]);
		expect(store.dirty.position).toBe(false);
	});

	it('is a no-op when there is neither a body nor a runtime handle', () => {
		const store = createTransformStore();
		setVelocityIntent(store, 'x', { x: 1 }, { mode: 'replace', priority: 1 });
		// Should not throw.
		expect(() => applyTransformChanges({ body: null } as any, store)).not.toThrow();
	});
});
