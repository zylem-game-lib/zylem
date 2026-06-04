/**
 * First Person Controller Behavior Module
 *
 * Complete first-person movement and camera system with walk/run states,
 * mouse-look integration, and viewmodel (weapon) positioning.
 */

export * from './components';
export * from './first-person-fsm';
export { FirstPersonControllerBehavior, type FirstPersonEntity, type ViewmodelConfig } from './first-person.behavior';
export { FirstPersonController, type FirstPersonControllerOptions } from './first-person.descriptor';
