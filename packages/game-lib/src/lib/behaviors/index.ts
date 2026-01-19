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

// Core ECS Components
export {
  type TransformComponent,
  type PhysicsBodyComponent,
  createTransformComponent,
  createPhysicsBodyComponent,
} from './components';

// Physics Behaviors
export { PhysicsStepBehavior } from './physics-step.behavior';
export { PhysicsSyncBehavior } from './physics-sync.behavior';

// Thruster Module (components, FSM, and behaviors)
export * from './thruster';

// Screen Wrap Module
export * from './screen-wrap';

// World Boundary 2D Module
export * from './world-boundary-2d';
