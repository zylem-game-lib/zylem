/**
 * @zylem/behavior-core
 *
 * Runtime-agnostic foundation shared by `@zylem/game-lib` and `@zylem/behaviors`:
 * the behavior descriptor/system contracts, the transform/velocity capability
 * substrate, small math/state utilities, the wasm Stage runtime contract, and
 * structural stand-ins for the engine entity and camera perspective.
 *
 * This package never imports `@zylem/game-lib`; the host engine injects concrete
 * implementations (entity factory, globals) through `BehaviorSystemContext`.
 */

// Behavior contracts
export * from './lib/behaviors/behavior-descriptor';
export * from './lib/behaviors/behavior-system';
export * from './lib/behaviors/use-behavior';
export * from './lib/behaviors/components';

// Capability substrate
export * from './lib/actions/capabilities/transform-store';
export * from './lib/actions/capabilities/velocity-intents';
export * from './lib/actions/capabilities/moveable';

// Utilities
export * from './lib/core/vector';
export * from './lib/core/utility/sync-state-machine';

// Wasm Stage runtime contract
export * from './lib/runtime/wasm-stage-runtime';

// Structural engine stand-ins
export * from './lib/entities/entity';
export * from './lib/camera/perspectives/first-person-perspective';
