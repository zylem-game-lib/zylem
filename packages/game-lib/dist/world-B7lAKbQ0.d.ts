import { Vector3, Vector2, Color, Material, BufferGeometry, Mesh, Group, ShaderMaterial } from 'three';
import RAPIER__default, { Vector3 as Vector3$1, RigidBodyDesc, ColliderDesc, RigidBody, Collider, World } from '@dimforge/rapier3d-compat';
import { E as Entity } from './entity-Bq_eNEDI.js';
import { IWorld, IComponent } from 'bitecs';
import * as mitt from 'mitt';

/**
 * BehaviorSystem Interface
 *
 * Base interface for ECS-based behavior systems that run at the stage level.
 * Systems query entities with matching components and process them each frame.
 */

/**
 * A behavior system that processes entities with specific components.
 *
 * @example
 * ```typescript
 * class ThrusterMovementSystem implements BehaviorSystem {
 *   update(ecs: IWorld, delta: number): void {
 *     // Query and process entities with thruster components
 *   }
 * }
 * ```
 */
interface BehaviorSystem {
    /** Called once per frame with ECS world and delta time */
    update(ecs: IWorld, delta: number): void;
    /** Optional cleanup when stage is destroyed */
    destroy?(ecs: IWorld): void;
}
/**
 * Factory function that creates a BehaviorSystem.
 * Receives the stage for access to world, scene, etc.
 */
type BehaviorSystemFactory<T extends BehaviorSystem = BehaviorSystem> = (stage: {
    world: any;
    ecs: IWorld;
}) => T;

/**
 * BehaviorDescriptor
 *
 * Type-safe behavior descriptors that provide options inference.
 * Used with entity.use() to declaratively attach behaviors to entities.
 *
 * Each behavior can define its own handle type via `createHandle`,
 * providing behavior-specific methods with full type safety.
 */

/**
 * Base handle returned by entity.use() for lazy access to behavior runtime.
 * FSM is null until entity is spawned and components are initialized.
 */
interface BaseBehaviorHandle<O extends Record<string, any> = Record<string, any>> {
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
interface BehaviorRef<O extends Record<string, any> = Record<string, any>> {
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
interface BehaviorDescriptor<O extends Record<string, any> = Record<string, any>, H extends Record<string, any> = Record<string, never>> {
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
type BehaviorHandle<O extends Record<string, any> = Record<string, any>, H extends Record<string, any> = Record<string, never>> = BaseBehaviorHandle<O> & H;
/**
 * Configuration for defining a new behavior
 */
interface DefineBehaviorConfig<O extends Record<string, any>, H extends Record<string, any> = Record<string, never>> {
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
declare function defineBehavior<O extends Record<string, any>, H extends Record<string, any> = Record<string, never>>(config: DefineBehaviorConfig<O, H>): BehaviorDescriptor<O, H>;

/** Input
 *
 * Maximum number of local players is 8.
 * All input can be mapped to a gamepad or keyboard but shares the common
 * interface represented as a gamepad.
 */
type InputPlayerNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type InputPlayer = `p${InputPlayerNumber}`;
interface ButtonState {
    pressed: boolean;
    released: boolean;
    held: number;
}
interface AnalogState {
    value: number;
    held: number;
}
interface InputGamepad {
    playerNumber: InputPlayerNumber;
    buttons: {
        A: ButtonState;
        B: ButtonState;
        X: ButtonState;
        Y: ButtonState;
        Start: ButtonState;
        Select: ButtonState;
        L: ButtonState;
        R: ButtonState;
    };
    directions: {
        Up: ButtonState;
        Down: ButtonState;
        Left: ButtonState;
        Right: ButtonState;
    };
    shoulders: {
        LTrigger: ButtonState;
        RTrigger: ButtonState;
    };
    axes: {
        Horizontal: AnalogState;
        Vertical: AnalogState;
    };
}
type Inputs = Record<InputPlayer, InputGamepad>;

type LoadingEvent = {
    type: 'start' | 'progress' | 'complete';
    message?: string;
    progress?: number;
    total?: number;
    current?: number;
};
interface IGame<TGlobals extends Record<string, unknown> = any> {
    start: () => Promise<this>;
    nextStage: () => void;
    previousStage: () => void;
    reset: () => Promise<void>;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    onLoading: (callback: (event: LoadingEvent) => void) => void;
    loadStageFromId: (stageId: string) => Promise<void>;
    end: () => Promise<void>;
    goToStage: () => void;
}
interface IStage {
    onUpdate: (callback: UpdateFunction<IStage>) => void;
    onSetup: (callback: SetupFunction<IStage>) => void;
    onDestroy: (callback: DestroyFunction<IStage>) => void;
}
interface ICamera {
    move: (position: Vector3) => void;
    rotate: (pitch: number, yaw: number, roll: number) => void;
}

type GlobalRecord = Record<string, unknown>;
/** Setup */
interface SetupContext<T, TGlobals extends GlobalRecord = any> {
    me: T;
    globals: TGlobals;
    inputs?: Inputs;
    camera?: ICamera;
    stage?: IStage;
    game?: IGame<TGlobals>;
}
interface SetupFunction<T, TGlobals extends GlobalRecord = any> {
    (context: SetupContext<T, TGlobals>): void;
}
/** Loaded */
interface LoadedContext<T, TGlobals extends GlobalRecord = any> {
    me: T;
    globals: TGlobals;
}
interface LoadedFunction<T, TGlobals extends GlobalRecord = any> {
    (context: LoadedContext<T, TGlobals>): void;
}
/** Update */
type UpdateContext<T, TGlobals extends GlobalRecord = any> = {
    me: T;
    delta: number;
    inputs: Inputs;
    globals: TGlobals;
    camera: ICamera;
    stage?: IStage;
    game?: IGame<TGlobals>;
};
interface UpdateFunction<T, TGlobals extends GlobalRecord = any> {
    (context: UpdateContext<T, TGlobals>): void;
}
/** Destroy */
interface DestroyContext<T, TGlobals extends GlobalRecord = any> {
    me: T;
    globals: TGlobals;
}
interface DestroyFunction<T, TGlobals extends GlobalRecord = any> {
    (context: DestroyContext<T, TGlobals>): void;
}
/** Cleanup */
interface CleanupContext<T, TGlobals extends GlobalRecord = any> {
    me: T;
    globals: TGlobals;
}
interface CleanupFunction<T, TGlobals extends GlobalRecord = any> {
    (context: CleanupContext<T, TGlobals>): void;
}

type Vec3 = Vector3 | Vector3$1;

declare function shortHash(objString: string): string;

type ZylemShaderType = 'standard' | 'fire' | 'star' | 'debug';

interface MaterialOptions {
    path?: string;
    repeat?: Vector2;
    shader?: ZylemShaderType;
    color?: Color;
}
type BatchGeometryMap = Map<symbol, number>;
interface BatchMaterialMapObject {
    geometryMap: BatchGeometryMap;
    material: Material;
}
type BatchKey = ReturnType<typeof shortHash>;
type TexturePath = string | null;
declare class MaterialBuilder {
    static batchMaterialMap: Map<BatchKey, BatchMaterialMapObject>;
    materials: Material[];
    batchMaterial(options: Partial<MaterialOptions>, entityType: symbol): void;
    build(options: Partial<MaterialOptions>, entityType: symbol): void;
    withColor(color: Color): this;
    withShader(shaderType: ZylemShaderType): this;
    /**
     * Set texture - loads in background (deferred).
     * Material is created immediately with null map, texture applies when loaded.
     */
    setTexture(texturePath?: TexturePath, repeat?: Vector2): void;
    setColor(color: Color): void;
    setShader(customShader: ZylemShaderType): void;
}

/**
 * Options for configuring entity collision behavior.
 */
interface CollisionOptions {
    static?: boolean;
    sensor?: boolean;
    size?: Vector3$1;
    position?: Vector3$1;
    collisionType?: string;
    collisionFilter?: string[];
}
declare class CollisionBuilder {
    static: boolean;
    sensor: boolean;
    gravity: Vec3;
    build(options: Partial<CollisionOptions>): [RigidBodyDesc, ColliderDesc];
    withCollision(collisionOptions: Partial<CollisionOptions>): this;
    collider(options: CollisionOptions): ColliderDesc;
    bodyDesc({ isDynamicBody }: {
        isDynamicBody?: boolean | undefined;
    }): RigidBodyDesc;
}

interface NodeInterface {
    uuid: string;
    name: string;
    markedForRemoval: boolean;
    nodeSetup(params: SetupContext<any>): void;
    nodeUpdate(params: UpdateContext<any>): void;
    nodeDestroy(params: DestroyContext<any>): void;
    setParent(parent: NodeInterface | null): void;
    getParent(): NodeInterface | null;
}

type BaseNodeOptions<T = any> = BaseNode | Partial<T>;
/**
 * Lifecycle callback arrays - each lifecycle event can have multiple callbacks
 * that execute in order.
 */
interface LifecycleCallbacks<T> {
    setup: Array<SetupFunction<T>>;
    loaded: Array<LoadedFunction<T>>;
    update: Array<UpdateFunction<T>>;
    destroy: Array<DestroyFunction<T>>;
    cleanup: Array<CleanupFunction<T>>;
}
declare abstract class BaseNode<Options = any, T = any> implements NodeInterface {
    protected parent: NodeInterface | null;
    protected children: NodeInterface[];
    options: Options;
    eid: number;
    uuid: string;
    name: string;
    markedForRemoval: boolean;
    /**
     * Lifecycle callback arrays - use onSetup(), onUpdate(), etc. to add callbacks
     */
    protected lifecycleCallbacks: LifecycleCallbacks<this>;
    constructor(args?: BaseNodeOptions[]);
    /**
     * Add setup callbacks to be executed in order during nodeSetup
     */
    onSetup(...callbacks: Array<SetupFunction<this>>): this;
    /**
     * Add loaded callbacks to be executed in order during nodeLoaded
     */
    onLoaded(...callbacks: Array<LoadedFunction<this>>): this;
    /**
     * Add update callbacks to be executed in order during nodeUpdate
     */
    onUpdate(...callbacks: Array<UpdateFunction<this>>): this;
    /**
     * Add destroy callbacks to be executed in order during nodeDestroy
     */
    onDestroy(...callbacks: Array<DestroyFunction<this>>): this;
    /**
     * Add cleanup callbacks to be executed in order during nodeCleanup
     */
    onCleanup(...callbacks: Array<CleanupFunction<this>>): this;
    /**
     * Prepend setup callbacks (run before existing ones)
     */
    prependSetup(...callbacks: Array<SetupFunction<this>>): this;
    /**
     * Prepend update callbacks (run before existing ones)
     */
    prependUpdate(...callbacks: Array<UpdateFunction<this>>): this;
    setParent(parent: NodeInterface | null): void;
    getParent(): NodeInterface | null;
    add(baseNode: NodeInterface): void;
    remove(baseNode: NodeInterface): void;
    getChildren(): NodeInterface[];
    isComposite(): boolean;
    abstract create(): T;
    protected abstract _setup(params: SetupContext<this>): void;
    protected abstract _loaded(params: LoadedContext<this>): Promise<void>;
    protected abstract _update(params: UpdateContext<this>): void;
    protected abstract _destroy(params: DestroyContext<this>): void;
    protected abstract _cleanup(params: CleanupContext<this>): Promise<void>;
    nodeSetup(params: SetupContext<this>): void;
    nodeUpdate(params: UpdateContext<this>): void;
    nodeDestroy(params: DestroyContext<this>): void;
    nodeLoaded(params: LoadedContext<this>): Promise<void>;
    nodeCleanup(params: CleanupContext<this>): Promise<void>;
    getOptions(): Options;
    setOptions(options: Partial<Options>): void;
}

/**
 * TODO: allow for multiple materials requires geometry groups
 * TODO: allow for instanced uniforms
 * TODO: allow for geometry groups
 * TODO: allow for batched meshes
 * import { InstancedUniformsMesh } from 'three-instanced-uniforms-mesh';
 * may not need geometry groups for shaders though
 * setGeometry<T extends BufferGeometry>(geometry: T) {
 *   MeshBuilder.bachedMesh = new BatchedMesh(10, 5000, 10000, material);
 * }
 */
type MeshBuilderOptions = Partial<Pick<GameEntityOptions, 'batched' | 'material'>>;
declare class MeshBuilder {
    _build(meshOptions: MeshBuilderOptions, geometry: BufferGeometry, materials: Material[]): Mesh;
    _postBuild(): void;
}

declare abstract class EntityCollisionBuilder extends CollisionBuilder {
    abstract collider(options: GameEntityOptions): ColliderDesc;
}
declare abstract class EntityMeshBuilder extends MeshBuilder {
    build(options: GameEntityOptions): BufferGeometry;
    postBuild(): void;
}

interface Behavior {
    component: IComponent;
    values: any;
}

/**
 * Reusable delegate for event emission and subscription.
 * Use via composition in Game, Stage, and Entity classes.
 *
 * @example
 * class Game {
 *   private eventDelegate = new EventEmitterDelegate<GameEvents>();
 *
 *   dispatch<K extends keyof GameEvents>(event: K, payload: GameEvents[K]) {
 *     this.eventDelegate.dispatch(event, payload);
 *   }
 * }
 */
declare class EventEmitterDelegate<TEvents extends Record<string, unknown>> {
    private emitter;
    private unsubscribes;
    constructor();
    /**
     * Dispatch an event to all listeners.
     */
    dispatch<K extends keyof TEvents>(event: K, payload: TEvents[K]): void;
    /**
     * Subscribe to an event. Returns an unsubscribe function.
     */
    listen<K extends keyof TEvents>(event: K, handler: (payload: TEvents[K]) => void): () => void;
    /**
     * Subscribe to all events.
     */
    listenAll(handler: (type: keyof TEvents, payload: TEvents[keyof TEvents]) => void): () => void;
    /**
     * Clean up all subscriptions.
     */
    dispose(): void;
}

/**
 * Payload for game loading events with stage context.
 */
interface GameLoadingPayload extends LoadingEvent {
    stageName?: string;
    stageIndex?: number;
}
/** Payload for stage configuration sent to editor. */
interface StageConfigPayload {
    id: string;
    backgroundColor: string;
    backgroundImage: string | null;
    gravity: {
        x: number;
        y: number;
        z: number;
    };
    inputs: Record<string, string[]>;
    variables: Record<string, unknown>;
}
/** Payload for entity configuration sent to editor. */
interface EntityConfigPayload {
    uuid: string;
    name: string;
    type: string;
    position: {
        x: number;
        y: number;
        z: number;
    };
    rotation: {
        x: number;
        y: number;
        z: number;
    };
    scale: {
        x: number;
        y: number;
        z: number;
    };
}
/** Payload for state dispatch events from game to editor. */
interface StateDispatchPayload {
    scope: 'game' | 'stage' | 'entity';
    path: string;
    value: unknown;
    previousValue?: unknown;
    config?: {
        id: string;
        aspectRatio: number;
        fullscreen: boolean;
        bodyBackground: string | undefined;
        internalResolution: {
            width: number;
            height: number;
        } | undefined;
        debug: boolean;
    } | null;
    stageConfig?: StageConfigPayload | null;
    entities?: EntityConfigPayload[] | null;
}
type GameEvents = {
    'loading:start': GameLoadingPayload;
    'loading:progress': GameLoadingPayload;
    'loading:complete': GameLoadingPayload;
    'paused': {
        paused: boolean;
    };
    'debug': {
        enabled: boolean;
    };
    'state:dispatch': StateDispatchPayload;
};
type StageEvents = {
    'stage:loaded': {
        stageId: string;
    };
    'stage:unloaded': {
        stageId: string;
    };
    'stage:variable:changed': {
        key: string;
        value: unknown;
    };
};
type EntityEvents = {
    'entity:spawned': {
        entityId: string;
        name: string;
    };
    'entity:destroyed': {
        entityId: string;
    };
    'entity:collision': {
        entityId: string;
        otherId: string;
    };
    'entity:model:loading': {
        entityId: string;
        files: string[];
    };
    'entity:model:loaded': {
        entityId: string;
        success: boolean;
        meshCount?: number;
    };
    'entity:animation:loaded': {
        entityId: string;
        animationCount: number;
    };
};
type ZylemEvents = GameEvents & StageEvents & EntityEvents;
/**
 * Global event bus for cross-package communication.
 *
 * Usage:
 * ```ts
 * import { zylemEventBus } from '@zylem/game-lib';
 *
 * // Subscribe
 * const unsub = zylemEventBus.on('loading:progress', (e) => console.log(e));
 *
 * // Emit
 * zylemEventBus.emit('loading:progress', { type: 'progress', progress: 0.5 });
 *
 * // Cleanup
 * unsub();
 * ```
 */
declare const zylemEventBus: mitt.Emitter<ZylemEvents>;

interface CollisionContext<T, O extends GameEntityOptions, TGlobals extends Record<string, unknown> = any> {
    entity: T;
    other: GameEntity<O | any>;
    globals: TGlobals;
}
type BehaviorContext<T, O extends GameEntityOptions> = SetupContext<T, O> | UpdateContext<T, O> | CollisionContext<T, O> | DestroyContext<T, O>;
type BehaviorCallback<T, O extends GameEntityOptions> = (params: BehaviorContext<T, O>) => void;
interface CollisionDelegate<T, O extends GameEntityOptions> {
    collision?: ((params: CollisionContext<any, any>) => void)[];
}
type IBuilder<BuilderOptions = any> = {
    preBuild: (options: BuilderOptions) => BuilderOptions;
    build: (options: BuilderOptions) => BuilderOptions;
    postBuild: (options: BuilderOptions) => BuilderOptions;
};
type GameEntityOptions = {
    name?: string;
    color?: Color;
    size?: Vec3;
    position?: Vec3;
    batched?: boolean;
    collision?: Partial<CollisionOptions>;
    material?: Partial<MaterialOptions>;
    custom?: {
        [key: string]: any;
    };
    collisionType?: string;
    collisionGroup?: string;
    collisionFilter?: string[];
    _builders?: {
        meshBuilder?: IBuilder | EntityMeshBuilder | null;
        collisionBuilder?: IBuilder | EntityCollisionBuilder | null;
        materialBuilder?: MaterialBuilder | null;
    };
};
declare abstract class GameEntityLifeCycle {
    abstract _setup(params: SetupContext<this>): void;
    abstract _update(params: UpdateContext<this>): void;
    abstract _destroy(params: DestroyContext<this>): void;
}
interface EntityDebugInfo {
    buildInfo: () => Record<string, string>;
}
type BehaviorCallbackType = 'setup' | 'update' | 'destroy' | 'collision';
declare class GameEntity<O extends GameEntityOptions> extends BaseNode<O> implements GameEntityLifeCycle, EntityDebugInfo {
    behaviors: Behavior[];
    group: Group | undefined;
    mesh: Mesh | undefined;
    materials: Material[] | undefined;
    bodyDesc: RigidBodyDesc | null;
    body: RigidBody | null;
    colliderDesc: ColliderDesc | undefined;
    collider: Collider | undefined;
    custom: Record<string, any>;
    debugInfo: Record<string, any>;
    debugMaterial: ShaderMaterial | undefined;
    collisionDelegate: CollisionDelegate<this, O>;
    collisionType?: string;
    /**
     * @deprecated Use the new ECS-based behavior system instead.
     * Use 'any' for callback types to avoid contravariance issues
     * with function parameters. Type safety is enforced where callbacks are registered.
     */
    behaviorCallbackMap: Record<BehaviorCallbackType, BehaviorCallback<any, any>[]>;
    protected eventDelegate: EventEmitterDelegate<EntityEvents>;
    private behaviorRefs;
    constructor();
    create(): this;
    /**
     * Add collision callbacks
     */
    onCollision(...callbacks: ((params: CollisionContext<this, O>) => void)[]): this;
    /**
     * Use a behavior on this entity via typed descriptor.
     * Behaviors will be auto-registered as systems when the entity is spawned.
     * @param descriptor The behavior descriptor (import from behaviors module)
     * @param options Optional overrides for the behavior's default options
     * @returns BehaviorHandle with behavior-specific methods for lazy FSM access
     */
    use<O extends Record<string, any>, H extends Record<string, any> = Record<string, never>>(descriptor: BehaviorDescriptor<O, H>, options?: Partial<O>): BehaviorHandle<O, H>;
    /**
     * Get all behavior references attached to this entity.
     * Used by the stage to auto-register required systems.
     */
    getBehaviorRefs(): BehaviorRef[];
    /**
     * Entity-specific setup - runs behavior callbacks
     * (User callbacks are handled by BaseNode's lifecycleCallbacks.setup)
     */
    _setup(params: SetupContext<this>): void;
    protected _loaded(_params: LoadedContext<this>): Promise<void>;
    /**
     * Entity-specific update - updates materials and runs behavior callbacks
     * (User callbacks are handled by BaseNode's lifecycleCallbacks.update)
     */
    _update(params: UpdateContext<this>): void;
    /**
     * Entity-specific destroy - runs behavior callbacks
     * (User callbacks are handled by BaseNode's lifecycleCallbacks.destroy)
     */
    _destroy(params: DestroyContext<this>): void;
    protected _cleanup(_params: CleanupContext<this>): Promise<void>;
    _collision(other: GameEntity<O>, globals?: any): void;
    /**
     * @deprecated Use the new ECS-based behavior system instead.
     * See `lib/behaviors/thruster/thruster-movement.behavior.ts` for an example.
     */
    addBehavior(behaviorCallback: {
        type: BehaviorCallbackType;
        handler: any;
    }): this;
    /**
     * @deprecated Use the new ECS-based behavior system instead.
     * See `lib/behaviors/thruster/thruster-movement.behavior.ts` for an example.
     */
    addBehaviors(behaviorCallbacks: {
        type: BehaviorCallbackType;
        handler: any;
    }[]): this;
    protected updateMaterials(params: any): void;
    buildInfo(): Record<string, string>;
    /**
     * Dispatch an event from this entity.
     * Events are emitted both locally and to the global event bus.
     */
    dispatch<K extends keyof EntityEvents>(event: K, payload: EntityEvents[K]): void;
    /**
     * Listen for events on this entity instance.
     * @returns Unsubscribe function
     */
    listen<K extends keyof EntityEvents>(event: K, handler: (payload: EntityEvents[K]) => void): () => void;
    /**
     * Clean up entity event subscriptions.
     */
    disposeEvents(): void;
}

/**
 * Interface for entities that handle collision events.
 */
interface CollisionHandlerDelegate {
    handlePostCollision(params: any): boolean;
    handleIntersectionEvent(params: any): void;
}
declare class ZylemWorld implements Entity<ZylemWorld> {
    type: string;
    world: World;
    collisionMap: Map<string, GameEntity<any>>;
    collisionBehaviorMap: Map<string, GameEntity<any>>;
    _removalMap: Map<string, GameEntity<any>>;
    static loadPhysics(gravity: Vector3): Promise<RAPIER__default.World>;
    constructor(world: World);
    addEntity(entity: any): void;
    setForRemoval(entity: any): void;
    destroyEntity(entity: GameEntity<any>): void;
    setup(): void;
    update(params: UpdateContext<any>): void;
    updatePostCollisionBehaviors(delta: number): void;
    updateColliders(delta: number): void;
    destroy(): void;
}

export { type BehaviorSystem as B, type CleanupContext as C, type DefineBehaviorConfig as D, EventEmitterDelegate as E, GameEntity as G, type InputGamepad as I, type LoadingEvent as L, type MaterialOptions as M, type SetupContext as S, type TexturePath as T, type UpdateContext as U, type Vec3 as V, type ZylemEvents as Z, type GameEntityOptions as a, type GameEvents as b, type StageEvents as c, type EntityEvents as d, type GameLoadingPayload as e, type StateDispatchPayload as f, type StageConfigPayload as g, type EntityConfigPayload as h, type BehaviorSystemFactory as i, defineBehavior as j, type BehaviorDescriptor as k, type BehaviorRef as l, type BehaviorHandle as m, type SetupFunction as n, type UpdateFunction as o, type DestroyFunction as p, type DestroyContext as q, ZylemWorld as r, BaseNode as s, type InputPlayerNumber as t, type Inputs as u, GameEntityLifeCycle as v, type IGame as w, type LoadedContext as x, type CollisionHandlerDelegate as y, zylemEventBus as z };
