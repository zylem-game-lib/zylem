import { describe, expect, it } from 'vitest';

import {
	createFirstPersonInputComponent,
	createFirstPersonStateComponent,
} from '../../../src/lib/behaviors/first-person/components';
import {
	FirstPersonFSM,
	FirstPersonState,
} from '../../../src/lib/behaviors/first-person/first-person-fsm';

describe('FirstPersonFSM', () => {
	it('transitions between idle, walking, and running from input state', () => {
		const input = createFirstPersonInputComponent();
		const state = createFirstPersonStateComponent();
		const fsm = new FirstPersonFSM({ input, state });

		input.moveZ = 1;
		fsm.update(input, state);
		expect(fsm.getState()).toBe(FirstPersonState.Walking);

		input.sprint = true;
		fsm.update(input, state);
		expect(fsm.getState()).toBe(FirstPersonState.Running);

		input.moveZ = 0;
		input.sprint = false;
		fsm.update(input, state);
		expect(fsm.getState()).toBe(FirstPersonState.Idle);
	});
});
