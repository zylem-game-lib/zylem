import { describe, expect, it } from 'vitest';

import type {
	EntityHandle,
	Simulation,
	StagePose,
	StageRenderSlot,
} from '@zylem/behaviors/core';
import {
	SimulationBody,
	type SimulationStepClock,
} from '../../../src/lib/collision/simulation-body';

type Vec3 = [number, number, number];
type Quat = [number, number, number, number];

const IDENTITY_ROT: Quat = [0, 0, 0, 1];

/**
 * Minimal mock of the wasm `Simulation`: `getPose` returns the live body
 * pose while `readRenderSlot`/`readPreviousRenderSlot` return whatever is
 * "in the shared render buffer" — stale zeros right after a spawn/teleport,
 * valid poses once fixed steps have written the slot.
 */
class MockSimulation {
	livePosition: Vec3 = [0, 0, 0];
	liveRotation: Quat = [...IDENTITY_ROT];
	renderPosition: Vec3 = [0, 0, 0];
	renderRotation: Quat = [...IDENTITY_ROT];
	previousRenderPosition: Vec3 = [0, 0, 0];
	previousRenderRotation: Quat = [...IDENTITY_ROT];

	getPose(_handle: EntityHandle, out: StagePose): StagePose {
		out.position = [...this.livePosition];
		out.rotation = [...this.liveRotation];
		return out;
	}

	setPosition(_handle: EntityHandle, x: number, y: number, z: number): boolean {
		this.livePosition = [x, y, z];
		return true;
	}

	setRotation(_handle: EntityHandle, x: number, y: number, z: number, w: number): boolean {
		this.liveRotation = [x, y, z, w];
		return true;
	}

	readRenderSlot(_handle: EntityHandle, out: StageRenderSlot): StageRenderSlot {
		out.position = [...this.renderPosition];
		out.rotation = [...this.renderRotation];
		return out;
	}

	readPreviousRenderSlot(_handle: EntityHandle, out: StageRenderSlot): StageRenderSlot {
		out.position = [...this.previousRenderPosition];
		out.rotation = [...this.previousRenderRotation];
		return out;
	}

	linearVelocityWrites: Vec3[] = [];
	angularVelocityWrites: Vec3[] = [];

	setLinearVelocity(_handle: EntityHandle, x: number, y: number, z: number): boolean {
		this.linearVelocityWrites.push([x, y, z]);
		return true;
	}

	setAngularVelocity(_handle: EntityHandle, x: number, y: number, z: number): boolean {
		this.angularVelocityWrites.push([x, y, z]);
		return true;
	}
}

const HANDLE: EntityHandle = { id: 1, slot: 0 };

function makeBody(steps: number) {
	const simulation = new MockSimulation();
	const clock: SimulationStepClock = { steps };
	const body = new SimulationBody(simulation as unknown as Simulation, HANDLE, clock);
	return { simulation, clock, body };
}

function expectPosition(
	actual: { x: number; y: number; z: number },
	expected: Vec3,
) {
	expect(actual.x).toBeCloseTo(expected[0]);
	expect(actual.y).toBeCloseTo(expected[1]);
	expect(actual.z).toBeCloseTo(expected[2]);
}

describe('SimulationBody render-pose discontinuity window', () => {
	it('returns the live spawn pose while render buffers are stale (mid-game spawn)', () => {
		const { simulation, body } = makeBody(5);
		simulation.livePosition = [3, 4, 5];
		// Render buffers still hold zeros — slot not written until next step.

		const pose = body.getRenderPose(0.5);

		expectPosition(pose.position, [3, 4, 5]);
	});

	it('collapses previous = current inside the window (no interpolation sweep)', () => {
		const { simulation, body } = makeBody(5);
		simulation.livePosition = [3, 4, 5];

		const history = body.getPoseHistory();

		expectPosition(history.previous.position, [3, 4, 5]);
		expectPosition(history.current.position, [3, 4, 5]);
	});

	it('resumes buffer interpolation once the window expires', () => {
		const { simulation, clock, body } = makeBody(5);
		simulation.livePosition = [9, 9, 9];
		simulation.previousRenderPosition = [1, 1, 1];
		simulation.renderPosition = [3, 3, 3];

		// Two fixed steps have run since spawn; buffers are coherent.
		clock.steps = 7;
		const pose = body.getRenderPose(0.5);

		// Midpoint of previous → current, not the live pose.
		expectPosition(pose.position, [2, 2, 2]);
	});

	it('stays on live pose one step after spawn (previous slot still stale)', () => {
		const { simulation, clock, body } = makeBody(5);
		simulation.livePosition = [3, 4, 5];
		simulation.renderPosition = [3, 4, 5];
		// previousRenderPosition still zeros — interpolating would sweep from origin.

		clock.steps = 6;
		const pose = body.getRenderPose(0.5);

		expectPosition(pose.position, [3, 4, 5]);
	});

	it('setTranslation re-collapses to the live pose immediately (teleport)', () => {
		const { simulation, clock, body } = makeBody(0);
		// Window from construction has expired; buffers hold the old pose.
		clock.steps = 10;
		simulation.previousRenderPosition = [1, 1, 1];
		simulation.renderPosition = [1, 1, 1];
		simulation.livePosition = [1, 1, 1];

		body.setTranslation({ x: 50, y: 60, z: 70 });
		const pose = body.getRenderPose(0.5);

		expectPosition(pose.position, [50, 60, 70]);
	});

	it('setRotation re-collapses to the live pose immediately', () => {
		const { simulation, clock, body } = makeBody(0);
		clock.steps = 10;
		simulation.previousRenderRotation = [...IDENTITY_ROT];
		simulation.renderRotation = [...IDENTITY_ROT];

		body.setRotation({ x: 0, y: 1, z: 0, w: 0 });
		const pose = body.getRenderPose(0.5);

		expect(pose.rotation.y).toBeCloseTo(1);
		expect(pose.rotation.w).toBeCloseTo(0);
	});

	it('interpolation resumes after a teleport window expires', () => {
		const { simulation, clock, body } = makeBody(0);
		clock.steps = 10;
		body.setTranslation({ x: 50, y: 60, z: 70 });

		// Two steps later the buffers have caught up with the new pose.
		clock.steps = 12;
		simulation.previousRenderPosition = [50, 60, 70];
		simulation.renderPosition = [52, 62, 72];

		const pose = body.getRenderPose(0.5);

		expectPosition(pose.position, [51, 61, 71]);
	});

	it('writeRenderPose uses the live pose inside the window (instanced path)', () => {
		const { simulation, body } = makeBody(5);
		simulation.livePosition = [3, 4, 5];
		// Render buffers still zeros.

		const outPosition = { x: -1, y: -1, z: -1 };
		const outRotation = { x: 0, y: 0, z: 0, w: 1 };
		body.writeRenderPose(0.5, outPosition, outRotation);

		expectPosition(outPosition, [3, 4, 5]);
	});

	it('lockRotations zeroes angular velocity when locking (Rapier compat)', () => {
		const { simulation, body } = makeBody(0);

		body.lockRotations(true);
		expect(simulation.angularVelocityWrites).toEqual([[0, 0, 0]]);

		body.lockRotations(false);
		expect(simulation.angularVelocityWrites).toHaveLength(1);
	});

	it('lockTranslations zeroes linear velocity when locking (Rapier compat)', () => {
		const { simulation, body } = makeBody(0);

		body.lockTranslations(true);
		expect(simulation.linearVelocityWrites).toEqual([[0, 0, 0]]);

		body.lockTranslations(false);
		expect(simulation.linearVelocityWrites).toHaveLength(1);
	});

	it('writeRenderPose interpolates buffers after the window expires', () => {
		const { simulation, clock, body } = makeBody(5);
		simulation.livePosition = [9, 9, 9];
		simulation.previousRenderPosition = [1, 1, 1];
		simulation.renderPosition = [3, 3, 3];

		clock.steps = 7;
		const outPosition = { x: 0, y: 0, z: 0 };
		const outRotation = { x: 0, y: 0, z: 0, w: 1 };
		body.writeRenderPose(0.5, outPosition, outRotation);

		expectPosition(outPosition, [2, 2, 2]);
	});
});
