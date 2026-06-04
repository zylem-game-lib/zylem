import {
	StateMachine as BaseStateMachine,
	type ILogger,
	type ITransition,
	type SyncCallback,
} from 'typescript-fsm';

export { t } from 'typescript-fsm';
export type { ILogger, ITransition, SyncCallback };

/**
 * Local wrapper around typescript-fsm's SyncStateMachine.
 *
 * typescript-fsm@1.6.0 incorrectly reports callback-less transitions as
 * unhandled even after moving to the next state, which causes noisy
 * `No transition...` console errors for valid FSM dispatches.
 */
export class SyncStateMachine<
	STATE extends string | number | symbol,
	EVENT extends string | number | symbol,
	CALLBACK extends Record<EVENT, SyncCallback> = Record<EVENT, SyncCallback>,
> extends BaseStateMachine<STATE, EVENT, CALLBACK> {
	constructor(
		init: STATE,
		transitions: ITransition<STATE, EVENT, CALLBACK[EVENT]>[] = [],
		logger: ILogger = console,
	) {
		super(init, transitions, logger);
	}

	dispatch<E extends EVENT>(_event: E, ..._args: unknown[]): Promise<void> {
		throw new Error('SyncStateMachine does not support async dispatch.');
	}

	syncDispatch<E extends EVENT>(event: E, ...args: unknown[]): boolean {
		const found = this.transitions.some((transition) => {
			if (transition.fromState !== this._current || transition.event !== event) {
				return false;
			}

			const current = this._current;
			this._current = transition.toState;

			if (!transition.cb) {
				return true;
			}

			try {
				transition.cb(...args);
				return true;
			} catch (error) {
				this._current = current;
				this.logger.error('Exception in callback', error);
				throw error;
			}
		});

		if (!found) {
			const errorMessage = this.formatErr(this._current, event);
			this.logger.error(errorMessage);
		}

		return found;
	}
}
