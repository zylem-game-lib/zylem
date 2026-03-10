import { describe, expect, it } from 'vitest';

import {
	Shooter2DBehavior,
	type Shooter2DHandle,
} from '../../../src/lib/behaviors/shooter-2d';

function createProjectile() {
	const projectile: any = {
		transformStore: {
			velocity: { x: 0, y: 0, z: 0 },
			dirty: { velocity: false },
		},
		position: null as { x: number; y: number; z: number } | null,
		rotation: 0,
		prependSetup(callback: ({ me }: { me: any }) => void) {
			this._setup = callback;
			return this;
		},
		setPosition(x: number, y: number, z: number) {
			this.position = { x, y, z };
		},
		setRotationZ(angle: number) {
			this.rotation = angle;
		},
	};

	return projectile;
}

function createFireHarness(options?: { cooldownMs?: number; spawnOffset?: { x: number; y: number } }) {
	const spawned: any[] = [];
	const projectile = createProjectile();
	const ref: any = {
		options: {
			projectileFactory: () => projectile,
			projectileSpeed: 12,
			cooldownMs: options?.cooldownMs ?? 0,
			spawnOffset: options?.spawnOffset ?? { x: 0, y: 1 },
			rotateProjectile: true,
		},
	};
	const handle = Shooter2DBehavior.createHandle?.(ref) as Shooter2DHandle;
	const stage = {
		add(entity: any) {
			spawned.push(entity);
			entity._setup?.({ me: entity });
		},
	};
	const source: any = {
		body: {
			translation: () => ({ x: 5, y: 7, z: 0 }),
			rotation: () => ({ x: 0, y: 0, z: 0, w: 1 }),
		},
		topDownMovementState: { facingAngle: 0 },
	};

	return {
		handle,
		source,
		stage,
		spawned,
		projectile,
		ref,
	};
}

describe('Shooter2DBehavior', () => {
	it('fires exactly one projectile', async () => {
		const { handle, source, stage, spawned } = createFireHarness();

		const fired = await handle.fire({
			source,
			stage,
			target: { x: 5, y: 10 },
		});

		expect(fired).toBe(spawned[0]);
		expect(spawned).toHaveLength(1);
	});

	it('rotates spawn offset into world space', async () => {
		const { handle, source, stage, projectile } = createFireHarness({
			spawnOffset: { x: 1, y: 0 },
		});
		source.topDownMovementState.facingAngle = -Math.PI / 2;

		await handle.fire({
			source,
			stage,
			target: { x: 6, y: 7 },
		});

		expect(projectile.position).toEqual({ x: 5, y: 6, z: 0 });
	});

	it('launches the projectile toward the target', async () => {
		const { handle, source, stage, projectile } = createFireHarness();

		await handle.fire({
			source,
			stage,
			target: { x: 8, y: 11 },
		});

		expect(projectile.transformStore.velocity.x).toBeCloseTo(7.2);
		expect(projectile.transformStore.velocity.y).toBeCloseTo(9.6);
		expect(projectile.rotation).toBeCloseTo(-0.6435011087932844);
	});

	it('blocks repeat fire until cooldown expires', async () => {
		const { handle, source, stage, spawned, ref } = createFireHarness({
			cooldownMs: 100,
		});

		await handle.fire({
			source,
			stage,
			target: { x: 5, y: 10 },
		});
		const blocked = await handle.fire({
			source,
			stage,
			target: { x: 5, y: 10 },
		});
		expect(blocked).toBeNull();
		expect(spawned).toHaveLength(1);

		const system = Shooter2DBehavior.systemFactory({
			world: null,
			ecs: {} as any,
			scene: null,
			getBehaviorLinks: () => [{ entity: source, ref }],
		});
		system.update({} as any, 0.11);

		const firedAgain = await handle.fire({
			source,
			stage,
			target: { x: 5, y: 10 },
		});
		expect(firedAgain).not.toBeNull();
		expect(spawned).toHaveLength(2);
	});

	it('falls back to the current facing when target is degenerate', async () => {
		const { handle, source, stage, projectile } = createFireHarness();
		source.topDownMovementState.facingAngle = Math.PI;

		await handle.fire({
			source,
			stage,
			target: { x: 5, y: 7 },
		});

		expect(projectile.transformStore.velocity.x).toBeCloseTo(-0);
		expect(projectile.transformStore.velocity.y).toBeCloseTo(-12);
		expect(projectile.rotation).toBeCloseTo(Math.PI);
	});
});
