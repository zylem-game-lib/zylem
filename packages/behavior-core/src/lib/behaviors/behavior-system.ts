/**
 * BehaviorSystem Interface
 *
 * Legacy behavior systems reserved the first `update` argument for an ECS world
 * handle; it is always `undefined` now.
 */

/** @deprecated Retained only for the first argument slot of `BehaviorSystem.update`. */
export type BehaviorEcsHandle = unknown;

/**
 * A behavior system that processes entities with specific components.
 *
 * @example
 * ```typescript
 * class ThrusterMovementSystem implements BehaviorSystem {
 *   update(_ecs: BehaviorEcsHandle | undefined, delta: number): void {
 *     // Iterate behavior links, push intent into wasm runtime, etc.
 *   }
 * }
 * ```
 */
export interface BehaviorSystem {
	/** Optional eager initialization when a behavior link is registered on a live entity */
	attach?(link: BehaviorEntityLink): void;
	/** Called once per frame. The first argument is always `undefined` (reserved legacy slot). */
	update(ecs: BehaviorEcsHandle | undefined, delta: number): void;
	/** Optional cleanup when a behavior link is detached from a live entity */
	detach?(link: BehaviorEntityLink): void;
	/** Optional cleanup when stage is destroyed */
	destroy?(ecs?: BehaviorEcsHandle): void;
}

/**
 * Runtime link between a spawned entity and one of its behavior refs.
 * Systems can iterate these links to avoid scanning all world entities.
 */
export interface BehaviorEntityLink {
	entity: any;
	ref: any;
}

/**
 * Context provided to behavior-system factories.
 *
 * After the runtime-only stage migration, `wasmStage` is the source of
 * truth — descriptors should call `wasmStage.attach<X>(handle, opts)` /
 * `wasmStage.query<X>(handle)` from inside the system instead of touching
 * `entity.body` directly. The legacy `world` / `scene` fields remain for
 * unmigrated descriptors.
 */
export interface BehaviorSystemContext {
	world: any;
	scene: any;
	/** Wasm-driven Stage runtime; omitted when the stage has no wasm module. */
	wasmStage?: import('../runtime/wasm-stage-runtime').WasmStageRuntime | null;
	/**
	 * Returns live behavior links for a descriptor key.
	 * O(1) lookup into a pre-built stage index.
	 */
	getBehaviorLinks?: (key: symbol) => Iterable<BehaviorEntityLink>;
	/**
	 * Host-injected entity factory. Behaviors that spawn entities at runtime
	 * (e.g. destructible-3d fragments) use this instead of importing the engine
	 * entity factory directly, keeping the behavior layer decoupled.
	 */
	createEntity?: import('../entities/entity').CreateEntityFn;
	/**
	 * Host-injected accessor for the global game-state bag, passed to entity
	 * lifecycle hooks (e.g. `nodeDestroy`).
	 */
	getGlobals?: () => any;
}

/**
 * Factory function that creates a BehaviorSystem.
 * Receives the stage for access to world, scene, etc.
 */
export type BehaviorSystemFactory<T extends BehaviorSystem = BehaviorSystem> = (
	stage: BehaviorSystemContext
) => T;
