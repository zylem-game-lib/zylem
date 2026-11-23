/**
 * Behavior toggling on the real wasm runtime, through the same host the stage
 * uses: `handle.disable()` / `handle.enable()` must change what the simulation
 * does at once, and must do it without building new objects.
 */
import { describe, expect, it } from 'vitest';

import { ScreenWrapBehavior } from '@zylem/behaviors/screen-wrap';
import { ThrusterBehavior } from '@zylem/behaviors/thruster';
import { TopDownMovementBehavior } from '@zylem/behaviors/top-down-movement';
import { WorldBoundary2DBehavior } from '@zylem/behaviors/world-boundary-2d';

import { createBox } from '../../../src/lib/entities/primitives/box';
import { createRealStage } from '../../support/real-stage';

const BOUNDS = { left: -2, right: 2, bottom: -2, top: 2 };

function createShip() {
	const ship = createBox({ name: 'ship', position: { x: 0, y: 0, z: 0 } });
	return {
		ship,
		thruster: ship.use(ThrusterBehavior, { linearThrust: 10, angularThrust: 4 }),
		topDown: ship.use(TopDownMovementBehavior, { moveSpeed: 6 }),
		wrap: ship.use(ScreenWrapBehavior, { width: 4, height: 4 }),
		boundary: ship.use(WorldBoundary2DBehavior, { boundaries: BOUNDS }),
	};
}

function stop(ship: ReturnType<typeof createBox>): void {
	ship.body!.setLinvel({ x: 0, y: 0, z: 0 }, true);
}

describe('behavior toggling (real wasm)', () => {
	it('hands movement from one behavior to another when they are swapped', async () => {
		const stage = await createRealStage();
		const { ship, thruster, topDown, wrap, boundary } = createShip();
		topDown.disable();
		wrap.disable();
		boundary.disable();
		await stage.delegate.spawnEntity(ship);
		stage.step();

		// Thruster on: thrust moves the ship.
		(ship as any).$thruster.thrust = 1;
		stage.step(30);
		const afterThrust = ship.body!.translation();
		expect(Math.hypot(afterThrust.x, afterThrust.y)).toBeGreaterThan(0.1);

		// Swap. The thruster's input is cleared and top-down takes over.
		thruster.disable();
		topDown.enable();
		expect((ship as any).$thruster.thrust).toBe(0);
		stop(ship);
		const beforeMove = ship.body!.translation().x;
		(ship as any).$topDownMovement.moveX = 1;
		stage.step(30);
		expect(ship.body!.translation().x - beforeMove).toBeGreaterThan(1);

		// Both off: input reaches nothing, so a stopped ship stays put.
		topDown.disable();
		expect((ship as any).$topDownMovement.moveX).toBe(0);
		stop(ship);
		const parked = ship.body!.translation().x;
		(ship as any).$topDownMovement.moveX = 1;
		(ship as any).$thruster.thrust = 1;
		stage.step(30);
		expect(ship.body!.translation().x).toBeCloseTo(parked, 4);

		// Back on with the same handle: top-down drives again.
		topDown.enable();
		(ship as any).$topDownMovement.moveX = -1;
		stage.step(30);
		expect(ship.body!.translation().x).toBeLessThan(parked - 1);

		stage.destroy();
	});

	it('switches edge handling between clamping and wrapping', async () => {
		const stage = await createRealStage();
		const { ship, thruster, topDown, wrap, boundary } = createShip();
		thruster.disable();
		wrap.disable();
		await stage.delegate.spawnEntity(ship);
		stage.step();

		// Boundary on: the ship is held at the right edge.
		(ship as any).$topDownMovement.moveX = 1;
		stage.step(60);
		expect(ship.body!.translation().x).toBeCloseTo(BOUNDS.right, 2);
		expect(boundary.getLastHits()?.right).toBe(true);

		// Wrap on instead: the ship crosses the edge and comes back on the left.
		boundary.disable();
		wrap.enable();
		expect(boundary.getLastHits()?.right ?? false).toBe(false);
		stage.step(10);
		expect(ship.body!.translation().x).toBeLessThan(0);

		// Boundary on again: held at the right edge once more.
		wrap.disable();
		boundary.enable();
		stage.step(90);
		expect(ship.body!.translation().x).toBeCloseTo(BOUNDS.right, 2);
		expect(topDown.enabled).toBe(true);

		stage.destroy();
	});

	it('keeps the same objects and the same collection sizes through many swaps', async () => {
		const stage = await createRealStage();
		const fleet = [];
		for (let i = 0; i < 100; i++) {
			const entry = createShip();
			entry.topDown.disable();
			entry.wrap.disable();
			await stage.delegate.spawnEntity(entry.ship);
			fleet.push(entry);
		}
		const { delegate, world } = stage;

		// One full swap in each direction creates everything a behavior needs
		// the first time it runs (input component, FSM).
		const swap = (round: number) => {
			const odd = round % 2 === 1;
			for (const { thruster, topDown, wrap, boundary } of fleet) {
				if (odd) {
					thruster.disable();
					topDown.enable();
					boundary.disable();
					wrap.enable();
				} else {
					topDown.disable();
					thruster.enable();
					wrap.disable();
					boundary.enable();
				}
			}
		};
		swap(1);
		stage.step();
		swap(2);
		stage.step();

		const before = fleet.map(({ ship, thruster, topDown, wrap, boundary }) => ({
			handles: [thruster, topDown, wrap, boundary],
			slots: [...ship.getBehaviorSlots()],
			refs: ship.getBehaviorSlots().map((slot) => slot.ref),
			links: ship.getBehaviorSlots().map((slot) => slot.link),
			options: ship.getBehaviorSlots().map((slot) => slot.ref.options),
			fsms: ship.getBehaviorSlots().map((slot) => slot.ref.fsm),
			thrusterInput: (ship as any).$thruster,
			topDownInput: (ship as any).$topDownMovement,
			runtimeHandle: ship.runtimeHandle,
		}));
		const systems = [...delegate.behaviorSystems];
		const indexSize = delegate.behaviorEntityIndex.size;
		const bodies = world.collisionMap.size;

		for (let round = 3; round < 103; round++) {
			swap(round);
			if (round % 10 === 0) stage.step();
		}

		fleet.forEach(({ ship, thruster, topDown, wrap, boundary }, i) => {
			const was = before[i]!;
			const slots = ship.getBehaviorSlots();
			expect(slots).toHaveLength(4);
			slots.forEach((slot, s) => {
				expect(slot).toBe(was.slots[s]);
				expect(slot.ref).toBe(was.refs[s]);
				expect(slot.link).toBe(was.links[s]);
				expect(slot.ref.options).toBe(was.options[s]);
				expect(slot.ref.fsm).toBe(was.fsms[s]);
			});
			expect(ship.use(ThrusterBehavior)).toBe(was.handles[0]);
			expect([thruster, topDown, wrap, boundary]).toEqual(was.handles);
			expect((ship as any).$thruster).toBe(was.thrusterInput);
			expect((ship as any).$topDownMovement).toBe(was.topDownInput);
			expect(ship.runtimeHandle).toBe(was.runtimeHandle);
			// Round 102 was even: thruster and boundary on, the others off.
			expect(ship.getBehaviorRefs().map((ref) => ref.descriptor.key)).toEqual([
				ThrusterBehavior.key,
				WorldBoundary2DBehavior.key,
			]);
		});
		expect(delegate.behaviorSystems).toEqual(systems);
		expect(delegate.behaviorEntityIndex.size).toBe(indexSize);
		expect(world.collisionMap.size).toBe(bodies);

		stage.destroy();
	});
});
