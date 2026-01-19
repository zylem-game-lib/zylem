/**
 * BehaviorDescriptor
 *
 * Type-safe behavior descriptors that provide options inference.
 * Used with entity.add() to declaratively attach behaviors to entities.
 */

import type { IWorld } from 'bitecs';
import type { BehaviorSystem, BehaviorSystemFactory } from './behavior-system';

/**
 * A typed behavior descriptor that associates a symbol key with:
 * - Default options (providing type inference)
 * - A system factory to create the behavior system
 */
export interface BehaviorDescriptor<
  O extends Record<string, any> = Record<string, any>,
> {
  /** Unique symbol identifying this behavior */
  readonly key: symbol;
  /** Default options (used for type inference) */
  readonly defaultOptions: O;
  /** Factory to create the behavior system */
  readonly systemFactory: BehaviorSystemFactory;
}

/**
 * Reference to a behavior stored on an entity
 */
export interface BehaviorRef<
  O extends Record<string, any> = Record<string, any>,
> {
  /** The behavior descriptor */
  descriptor: BehaviorDescriptor<O>;
  /** Merged options (defaults + overrides) */
  options: O;
  /** Optional FSM instance - set lazily when entity is spawned */
  fsm?: any;
}

/**
 * Handle returned by entity.use() for lazy access to behavior runtime.
 * FSM is null until entity is spawned and components are initialized.
 */
export interface BehaviorHandle<
  O extends Record<string, any> = Record<string, any>,
> {
  /** Get the FSM instance (null until entity is spawned) */
  getFSM(): any | null;

  /**
   * Convenience passthrough for FSMs that expose `getLastHits()`.
   * Returns `null` until the FSM exists, or if the FSM doesn't support it.
   *
   * This enables ergonomic usage like:
   * `const hits = boundary.getLastHits();`
   */
  getLastHits?(): any | null;

  /**
   * Convenience passthrough for FSMs that expose `getMovement()`.
   * Returns adjusted movement values based on boundary hits.
   * Returns the original values if FSM doesn't exist or doesn't support it.
   *
   * This enables ergonomic usage like:
   * `({ moveX, moveY } = boundary.getMovement(moveX, moveY));`
   */
  getMovement(moveX: number, moveY: number): { moveX: number; moveY: number };

  /** Get the current options */
  getOptions(): O;
  /** Access the underlying behavior ref */
  readonly ref: BehaviorRef<O>;
}

/**
 * Configuration for defining a new behavior
 */
export interface DefineBehaviorConfig<O extends Record<string, any>> {
  /** Human-readable name for debugging */
  name: string;
  /** Default options - these define the type */
  defaultOptions: O;
  /** Factory function to create the system */
  systemFactory: BehaviorSystemFactory;
}

/**
 * Define a typed behavior descriptor.
 *
 * @example
 * ```typescript
 * export const ThrusterBehavior = defineBehavior({
 *   name: 'thruster',
 *   defaultOptions: { linearThrust: 10, angularThrust: 5 },
 *   systemFactory: (ctx) => new ThrusterMovementBehavior(ctx.world),
 * });
 *
 * // Usage with type inference
 * ship.add(ThrusterBehavior, { linearThrust: 15 });
 * ```
 */
export function defineBehavior<O extends Record<string, any>>(
  config: DefineBehaviorConfig<O>,
): BehaviorDescriptor<O> {
  return {
    key: Symbol.for(`zylem:behavior:${config.name}`),
    defaultOptions: config.defaultOptions,
    systemFactory: config.systemFactory,
  };
}
