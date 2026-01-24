/**
 * BehaviorDescriptor
 *
 * Type-safe behavior descriptors that provide options inference.
 * Used with entity.use() to declaratively attach behaviors to entities.
 *
 * Each behavior can define its own handle type via `createHandle`,
 * providing behavior-specific methods with full type safety.
 */

import type { BehaviorSystemFactory } from './behavior-system';

/**
 * Base handle returned by entity.use() for lazy access to behavior runtime.
 * FSM is null until entity is spawned and components are initialized.
 */
export interface BaseBehaviorHandle<
  O extends Record<string, any> = Record<string, any>,
> {
  /** Get the FSM instance (null until entity is spawned) */
  getFSM(): any | null;
  /** Get the current options */
  getOptions(): O;
  /** Access the underlying behavior ref */
  readonly ref: BehaviorRef<O>;
}

/**
 * Reference to a behavior stored on an entity
 */
export interface BehaviorRef<
  O extends Record<string, any> = Record<string, any>,
> {
  /** The behavior descriptor */
  descriptor: BehaviorDescriptor<O, any>;
  /** Merged options (defaults + overrides) */
  options: O;
  /** Optional FSM instance - set lazily when entity is spawned */
  fsm?: any;
}

/**
 * A typed behavior descriptor that associates a symbol key with:
 * - Default options (providing type inference)
 * - A system factory to create the behavior system
 * - An optional handle factory for behavior-specific methods
 */
export interface BehaviorDescriptor<
  O extends Record<string, any> = Record<string, any>,
  H extends Record<string, any> = Record<string, never>,
  I = unknown,
> {
  /** Unique symbol identifying this behavior */
  readonly key: symbol;
  /** Default options (used for type inference) */
  readonly defaultOptions: O;
  /** Factory to create the behavior system */
  readonly systemFactory: BehaviorSystemFactory;
  /**
   * Optional factory to create behavior-specific handle methods.
   * These methods are merged into the handle returned by entity.use().
   */
  readonly createHandle?: (ref: BehaviorRef<O>) => H;
}

/**
 * The full handle type returned by entity.use().
 * Combines base handle with behavior-specific methods.
 */
export type BehaviorHandle<
  O extends Record<string, any> = Record<string, any>,
  H extends Record<string, any> = Record<string, never>,
> = BaseBehaviorHandle<O> & H;

/**
 * Configuration for defining a new behavior
 */
export interface DefineBehaviorConfig<
  O extends Record<string, any>,
  H extends Record<string, any> = Record<string, never>,
  I = unknown,
> {
  /** Human-readable name for debugging */
  name: string;
  /** Default options - these define the type */
  defaultOptions: O;
  /** Factory function to create the system */
  systemFactory: BehaviorSystemFactory;
  /**
   * Optional factory to create behavior-specific handle methods.
   * The returned object is merged into the handle returned by entity.use().
   *
   * @example
   * ```typescript
   * createHandle: (ref) => ({
   *   getLastHits: () => ref.fsm?.getLastHits() ?? null,
   *   getMovement: (moveX, moveY) => ref.fsm?.getMovement(moveX, moveY) ?? { moveX, moveY },
   * }),
   * ```
   */
  createHandle?: (ref: BehaviorRef<O>) => H;
}

/**
 * Define a typed behavior descriptor.
 *
 * @example
 * ```typescript
 * export const WorldBoundary2DBehavior = defineBehavior({
 *   name: 'world-boundary-2d',
 *   defaultOptions: { boundaries: { top: 0, bottom: 0, left: 0, right: 0 } },
 *   systemFactory: (ctx) => new WorldBoundary2DSystem(ctx.world),
 *   createHandle: (ref) => ({
 *     getLastHits: () => ref.fsm?.getLastHits() ?? null,
 *     getMovement: (moveX: number, moveY: number) =>
 *       ref.fsm?.getMovement(moveX, moveY) ?? { moveX, moveY },
 *   }),
 * });
 *
 * // Usage - handle has getLastHits and getMovement with full types
 * const boundary = ship.use(WorldBoundary2DBehavior, { ... });
 * const hits = boundary.getLastHits(); // Fully typed!
 * ```
 */
export function defineBehavior<
  O extends Record<string, any>,
  H extends Record<string, any> = Record<string, never>,
  I = unknown,
>(
  config: DefineBehaviorConfig<O, H, I>,
): BehaviorDescriptor<O, H, I> {
  return {
    key: Symbol.for(`zylem:behavior:${config.name}`),
    defaultOptions: config.defaultOptions,
    systemFactory: config.systemFactory,
    createHandle: config.createHandle,
  };
}
