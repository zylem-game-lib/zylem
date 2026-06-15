import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from 'three';
import { describe, expect, it } from 'vitest';
import { fadeOpacity, moveBy, resetEntityOpacity } from '../../../src/lib/actions/interval-actions';
import { createTransformStore } from '@zylem/behaviors/core';
import { applyTransformChanges } from '../../../src/lib/actions/capabilities/apply-transform';
import { clearVelocityIntent } from '@zylem/behaviors/core';

function createFadeTestEntity(initialOpacity = 1) {
	const material = new MeshBasicMaterial({
		color: 0xffffff,
		transparent: initialOpacity < 1,
		opacity: initialOpacity,
	});
	const mesh = new Mesh(new BoxGeometry(), material);
	const group = new Group();
	group.add(mesh);
	return { group, mesh, material };
}

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

describe('fadeOpacity', () => {
	it('lerps material opacity from 1 to 0 over duration', () => {
		const { group, material } = createFadeTestEntity(1);
		const entity = { group } as any;
		const action = fadeOpacity({ from: 1, to: 0, duration: 1000 });

		action.tick(entity, 0.5);
		expect(material.transparent).toBe(true);
		expect(material.opacity).toBeCloseTo(0.5);

		action.tick(entity, 0.5);
		expect(material.opacity).toBeCloseTo(0);
		expect(action.done).toBe(true);
	});

	it('lerps material opacity from 0 to 1 and restores opaque when complete', () => {
		const { group, material } = createFadeTestEntity(0);
		const entity = { group } as any;
		const action = fadeOpacity({
			from: 0,
			to: 1,
			duration: 400,
			restoreOpaque: true,
		});

		action.tick(entity, 0.2);
		expect(material.transparent).toBe(true);
		expect(material.opacity).toBeCloseTo(0.5);

		action.tick(entity, 0.2);
		expect(material.opacity).toBeCloseTo(1);
		expect(material.transparent).toBe(false);
		expect(action.done).toBe(true);
	});

	it('resetEntityOpacity sets opacity on entity materials', () => {
		const { group, material } = createFadeTestEntity(0.3);
		const entity = { group } as any;

		resetEntityOpacity(entity, 1, false);

		expect(material.opacity).toBe(1);
		expect(material.transparent).toBe(false);
	});
});
