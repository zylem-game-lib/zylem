/**
 * Behaviors Module Index
 *
 * Re-exports all ECS components and behaviors.
 */

// Core Behavior System Interface
export type { BehaviorSystem, BehaviorSystemFactory } from './behavior-system';

// Behavior Descriptor Pattern
export { defineBehavior } from './behavior-descriptor';
export type {
	BehaviorDescriptor,
	BehaviorRef,
	BehaviorHandle,
	DefineBehaviorConfig,
} from './behavior-descriptor';

export { useBehavior } from './use-behavior';

// Core ECS Components
export {
	type TransformComponent,
	type PhysicsBodyComponent,
	createTransformComponent,
	createPhysicsBodyComponent,
} from './components';

// Thruster Module (components, FSM, and behaviors)
export * from './thruster';

// Screen Wrap Module
export * from './screen-wrap';

// Screen Visibility Module
export * from './screen-visibility';

// World Boundary 2D Module
export * from './world-boundary-2d';

// World Boundary 3D Module
export * from './world-boundary-3d';

// Ricochet 2D Module
export * from './ricochet-2d';

// Ricochet 3D Module
export * from './ricochet-3d';

// Platformer 3D Module
export * from './platformer-3d';

// First Person Controller Module
export * from './first-person';

// Jumper 3D Module
export * from './jumper-3d';

// Jumper 2D Module
export * from './jumper-2d';

// Cooldown Module
export * from './cooldown';

// Coordinators
export * from '../coordinators/boundary-ricochet.coordinator';
export * from '../coordinators/boundary-ricochet-3d.coordinator';
