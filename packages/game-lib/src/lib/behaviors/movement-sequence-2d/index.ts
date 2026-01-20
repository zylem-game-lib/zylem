/**
 * Movement Sequence 2D Behavior Module
 *
 * Exports FSM, types, and behavior descriptor for 2D movement sequencing.
 */

// FSM and types
export {
	MovementSequence2DFSM,
	MovementSequence2DState,
	MovementSequence2DEvent,
	type MovementSequence2DStep,
	type MovementSequence2DMovement,
	type MovementSequence2DProgress,
	type MovementSequence2DCurrentStep,
} from './movement-sequence-2d-fsm';

// Behavior descriptor, options, and handle
export {
	MovementSequence2DBehavior,
	type MovementSequence2DOptions,
	type MovementSequence2DHandle,
} from './movement-sequence-2d.descriptor';
