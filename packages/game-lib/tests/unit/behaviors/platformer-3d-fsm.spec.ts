import { describe, expect, it } from 'vitest';

import {
	createPlatformer3DInputComponent,
	createPlatformer3DStateComponent,
} from '../../../src/lib/behaviors/platformer-3d/components';
import {
	Platformer3DFSM,
	Platformer3DState,
} from '../../../src/lib/behaviors/platformer-3d/platformer-3d-fsm';

describe('Platformer3DFSM', () => {
	it('tracks grounded movement and airborne transitions', () => {
		const input = createPlatformer3DInputComponent();
		const state = createPlatformer3DStateComponent();
		state.grounded = true;

		const fsm = new Platformer3DFSM({ input, state });

		input.moveX = 1;
		fsm.update(input, state);
		expect(fsm.getState()).toBe(Platformer3DState.Walking);

		input.jump = true;
		fsm.update(input, state);
		expect(fsm.getState()).toBe(Platformer3DState.Jumping);

		input.jump = false;
		state.grounded = false;
		state.falling = true;
		fsm.update(input, state);
		expect(fsm.getState()).toBe(Platformer3DState.Falling);
	});
});
