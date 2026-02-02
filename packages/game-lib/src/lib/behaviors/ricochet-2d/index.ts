/**
 * Ricochet 2D Behavior Module
 *
 * Exports FSM, types, and behavior descriptor for 2D ricochet/reflection.
 */

// FSM and types
export {
	Ricochet2DFSM,
	Ricochet2DState,
	Ricochet2DEvent,
	type Ricochet2DResult,
	type Ricochet2DCollisionContext,
	type RicochetCallback,
} from './ricochet-2d-fsm';

// Behavior descriptor, options, and handle
export {
	Ricochet2DBehavior,
	type Ricochet2DOptions,
	type Ricochet2DHandle,
} from './ricochet-2d.descriptor';

