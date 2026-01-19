/**
 * World Boundary 2D Module
 *
 * Barrel exports for the `world-boundary-2d` behavior and its FSM helpers.
 */
export { WorldBoundary2DBehavior } from './world-boundary-2d.descriptor';

export {
	WorldBoundary2DFSM,
	computeWorldBoundary2DHits,
	hasAnyWorldBoundary2DHit,
	type WorldBoundary2DHit,
	type WorldBoundary2DHits,
	type WorldBoundary2DPosition,
	type WorldBoundary2DBounds,
	WorldBoundary2DState,
	WorldBoundary2DEvent,
} from './world-boundary-2d-fsm';

export type { WorldBoundary2DOptions } from './world-boundary-2d.descriptor';
