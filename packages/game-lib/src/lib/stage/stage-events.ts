import { subscribe } from 'valtio/vanilla';
import { stageState } from './stage-state';
import type { StageStateInterface } from '../types/stage-types';

/**
 * Event name for stage state changes.
 * Dispatched when the stage state proxy is updated.
 */
export const STAGE_STATE_CHANGE = 'STAGE_STATE_CHANGE';

/**
 * Event detail payload for STAGE_STATE_CHANGE events.
 */
export interface StageStateChangeEvent {
	entities: StageStateInterface['entities'];
	variables: StageStateInterface['variables'];
}

/**
 * Initialize the stage state dispatcher.
 * Subscribes to stageState changes and dispatches STAGE_STATE_CHANGE events to the window.
 * 
 * @returns Unsubscribe function to stop dispatching events.
 * 
 * @example
 * // Start dispatching stage state changes
 * const unsubscribe = initStageStateDispatcher();
 * 
 * // Later, stop dispatching
 * unsubscribe();
 */
export function initStageStateDispatcher(): () => void {
	return subscribe(stageState, () => {
		const detail: StageStateChangeEvent = {
			entities: stageState.entities,
			variables: stageState.variables,
		};
		window.dispatchEvent(new CustomEvent(STAGE_STATE_CHANGE, { detail }));
	});
}

/**
 * Manually dispatch the current stage state.
 * Useful for initial sync when a listener is added.
 */
export function dispatchStageState(): void {
	const detail: StageStateChangeEvent = {
		entities: stageState.entities,
		variables: stageState.variables,
	};
	window.dispatchEvent(new CustomEvent(STAGE_STATE_CHANGE, { detail }));
}
