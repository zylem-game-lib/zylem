import { describe, expect, it, vi } from 'vitest';

import {
	SyncStateMachine,
	t,
} from '../../../src/lib/core/utility/sync-state-machine';

enum TestState {
	Idle = 'idle',
	Active = 'active',
}

enum TestEvent {
	Start = 'start',
	Stop = 'stop',
}

describe('SyncStateMachine wrapper', () => {
	it('treats callback-less transitions as handled without logging errors', () => {
		const logger = { error: vi.fn() };
		const machine = new SyncStateMachine<TestState, TestEvent, never>(
			TestState.Idle,
			[
				t(TestState.Idle, TestEvent.Start, TestState.Active),
				t(TestState.Active, TestEvent.Stop, TestState.Idle),
			],
			logger,
		);

		expect(machine.can(TestEvent.Start)).toBe(true);
		expect(machine.syncDispatch(TestEvent.Start)).toBe(true);
		expect(machine.getState()).toBe(TestState.Active);
		expect(logger.error).not.toHaveBeenCalled();
	});

	it('still reports genuinely invalid transitions', () => {
		const logger = { error: vi.fn() };
		const machine = new SyncStateMachine<TestState, TestEvent, never>(
			TestState.Idle,
			[t(TestState.Idle, TestEvent.Start, TestState.Active)],
			logger,
		);

		expect(machine.can(TestEvent.Stop)).toBe(false);
		expect(machine.syncDispatch(TestEvent.Stop)).toBe(false);
		expect(machine.getState()).toBe(TestState.Idle);
		expect(logger.error).toHaveBeenCalledTimes(1);
	});
});
