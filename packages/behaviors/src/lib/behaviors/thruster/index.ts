/**
 * Thruster Behavior Module Index
 * 
 * Re-exports all thruster-related components and behaviors.
 */

// Components
export {
	type ThrusterMovementComponent,
	type ThrusterInputComponent,
	type ThrusterStateComponent,
	createThrusterMovementComponent,
	createThrusterInputComponent,
	createThrusterStateComponent,
} from './components';

// FSM
export {
	ThrusterState,
	ThrusterEvent,
	ThrusterFSM,
	type ThrusterFSMContext,
	type PlayerInput,
} from './thruster-fsm';

// Behaviors
export {
	ThrusterMovementBehavior,
	type Behavior,
	type ThrusterEntity,
} from './thruster-movement.behavior';

// Typed Descriptor (new entity.use() API)
export { ThrusterBehavior, type ThrusterBehaviorOptions } from './thruster.descriptor';
