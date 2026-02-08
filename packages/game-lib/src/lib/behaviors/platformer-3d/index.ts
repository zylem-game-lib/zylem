/**
 * Platformer 3D Behavior Module
 * 
 * Complete 3D platformer movement system with walking, running,
 * jumping (with multi-jump), and falling/landing states.
 */

export * from './components';
export * from './platformer-3d-fsm';
export { Platformer3DBehavior as Platformer3DMovementBehavior, type Platformer3DEntity } from './platformer-3d.behavior';
export { Platformer3DBehavior, type Platformer3DBehaviorOptions } from './platformer-3d.descriptor';
