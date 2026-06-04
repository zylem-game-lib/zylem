import { describe, expect, it } from 'vitest';

import { ThrusterFSM, ThrusterState } from '../../../src/lib/behaviors/thruster/thruster-fsm';
import { ThrusterMovementBehavior } from '../../../src/lib/behaviors/thruster/thruster-movement.behavior';

function createBody() {
	const linearVelocity = { x: 0, y: 0, z: 0 };
	const angularVelocity = { x: 0, y: 0, z: 0 };
	return {
		rotation: () => ({ x: 0, y: 0, z: 0, w: 1 }),
		linvel: () => linearVelocity,
		setLinvel: (next: { x: number; y: number; z: number }) => {
			linearVelocity.x = next.x;
			linearVelocity.y = next.y;
			linearVelocity.z = next.z;
		},
		angvel: () => angularVelocity,
		setAngvel: (next: { x: number; y: number; z: number }) => {
			angularVelocity.x = next.x;
			angularVelocity.y = next.y;
			angularVelocity.z = next.z;
		},
		setLinearDamping: () => {},
	};
}

describe('ThrusterBehavior', () => {
	it('applies forward thrust and reverse thrust along facing', () => {
		const body = createBody();
		const behavior = new ThrusterMovementBehavior({} as any);
		const entity = {
			physics: { body },
			thruster: { linearThrust: 10, angularThrust: 5 },
			$thruster: { thrust: 1, rotate: 0, thrustX: 0, thrustY: 0 },
		};

		behavior.updateEntity(entity, 1 / 60);
		expect(body.linvel().y).toBeGreaterThan(0);

		const boostedSpeed = Math.hypot(body.linvel().x, body.linvel().y);
		entity.$thruster.thrust = -1;
		behavior.updateEntity(entity, 1 / 60);
		expect(body.linvel().y).toBeLessThan(boostedSpeed);
	});

	it('applies angular thrust from rotate input', () => {
		const body = createBody();
		const behavior = new ThrusterMovementBehavior({} as any);
		const entity = {
			physics: { body },
			thruster: { linearThrust: 10, angularThrust: 5 },
			$thruster: { thrust: 0, rotate: 1, thrustX: 0, thrustY: 0 },
		};

		behavior.updateEntity(entity, 1 / 60);
		expect(body.angvel().z).toBeLessThan(0);
	});

	it('applies world-space vector thrust', () => {
		const body = createBody();
		const behavior = new ThrusterMovementBehavior({} as any);
		const entity = {
			physics: { body },
			thruster: { linearThrust: 10, angularThrust: 5 },
			$thruster: { thrust: 0, rotate: 0, thrustX: 1, thrustY: 1 },
		};

		behavior.updateEntity(entity, 1 / 60);
		expect(body.linvel().x).toBeCloseTo(0.7071067811865475);
		expect(body.linvel().y).toBeCloseTo(0.7071067811865475);
	});

	it('tracks idle and active FSM states from player input', () => {
		const input = { thrust: 0, rotate: 0, thrustX: 0, thrustY: 0 };
		const fsm = new ThrusterFSM({ input });

		expect(fsm.getState()).toBe(ThrusterState.Idle);
		fsm.update({ thrust: 1, rotate: 0, thrustX: 0, thrustY: 0 });
		expect(fsm.getState()).toBe(ThrusterState.Active);
		fsm.update({ thrust: 0, rotate: 0, thrustX: 0, thrustY: 0 });
		expect(fsm.getState()).toBe(ThrusterState.Idle);
	});
});
