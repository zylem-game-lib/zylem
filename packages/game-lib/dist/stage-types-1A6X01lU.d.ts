import { i as SetupFunction, G as GameEntity, j as UpdateFunction, D as DestroyFunction, S as SetupContext, U as UpdateContext, k as DestroyContext, l as BaseNode, L as LoadingEvent, c as StageEvents } from './entity-BtSVUHY-.js';
import * as bitecs from 'bitecs';
import { defineSystem, IWorld } from 'bitecs';
import { Scene, Color, Object3D, Vector3, Group } from 'three';
import { f as ZylemWorld, S as SPRITE_TYPE, g as ZylemSprite, d as SPHERE_TYPE, h as ZylemSphere, R as RECT_TYPE, i as ZylemRect, T as TEXT_TYPE, j as ZylemText, B as BOX_TYPE, Z as ZylemBox, P as PLANE_TYPE, k as ZylemPlane, e as ZONE_TYPE, l as ZylemZone, A as ACTOR_TYPE, m as ZylemActor } from './entities-BR2vDiRh.js';
import { E as Entity, L as LifecycleFunction, S as StageEntity } from './entity-Bq_eNEDI.js';
import { Z as ZylemCamera, C as CameraDebugDelegate, b as CameraDebugState, d as CameraWrapper } from './camera-CpbDr4-V.js';
import RAPIER__default, { RigidBody, Collider } from '@dimforge/rapier3d-compat';

interface SceneState {
    backgroundColor: Color | string;
    backgroundImage: string | null;
}
declare class ZylemScene implements Entity<ZylemScene> {
    type: string;
    _setup?: SetupFunction<ZylemScene>;
    scene: Scene;
    zylemCamera: ZylemCamera;
    containerElement: HTMLElement | null;
    update: LifecycleFunction<ZylemScene>;
    _collision?: ((entity: any, other: any, globals?: any) => void) | undefined;
    _destroy?: ((globals?: any) => void) | undefined;
    name?: string | undefined;
    tag?: Set<string> | undefined;
    constructor(id: string, camera: ZylemCamera, state: SceneState);
    setup(): void;
    destroy(): void;
    /**
     * Setup camera with the scene
     */
    setupCamera(scene: Scene, camera: ZylemCamera): void;
    /**
     * Setup scene lighting
     */
    setupLighting(scene: Scene): void;
    /**
     * Update renderer size - delegates to camera
     */
    updateRenderer(width: number, height: number): void;
    /**
     * Add object to scene
     */
    add(object: Object3D, position?: Vector3): void;
    /**
     * Add game entity to scene
     */
    addEntity(entity: GameEntity<any>): void;
    /**
     * Add debug helpers to scene
     */
    debugScene(): void;
}

/**
 * Base entity interface - shared across modules to prevent circular dependencies
 */
interface BaseEntityInterface {
    uuid: string;
    name: string;
    eid: number;
    group: Group | null;
    body: RigidBody | null;
    collider: Collider | null;
}
/**
 * Game entity interface - minimal interface to break circular dependencies
 */
interface GameEntityInterface extends BaseEntityInterface {
    type: string;
    isStatic: boolean;
    setPosition(x: number, y: number, z: number): void;
    setRotation(x: number, y: number, z: number): void;
    setScale(x: number, y: number, z: number): void;
}

/**
 * Provides BaseNode-like lifecycle without ECS/children. Consumers implement
 * the protected hooks and may assign public setup/update/destroy callbacks.
 */
declare abstract class LifeCycleBase<TSelf> {
    update: UpdateFunction<TSelf>;
    setup: SetupFunction<TSelf>;
    destroy: DestroyFunction<TSelf>;
    protected abstract _setup(context: SetupContext<TSelf>): void;
    protected abstract _update(context: UpdateContext<TSelf>): void;
    protected abstract _destroy(context: DestroyContext<TSelf>): void;
    nodeSetup(context: SetupContext<TSelf>): void;
    nodeUpdate(context: UpdateContext<TSelf>): void;
    nodeDestroy(context: DestroyContext<TSelf>): void;
}

type StageSystem = {
    _childrenMap: Map<number, StageEntity & {
        body: RAPIER__default.RigidBody;
    }>;
};
type TransformSystemResult = {
    system: ReturnType<typeof defineSystem>;
    destroy: (world: IWorld) => void;
};
declare function createTransformSystem(stage: StageSystem): TransformSystemResult;

type AddEntityFactory = (params: {
    position: Vector3;
    normal?: Vector3;
}) => Promise<any> | any;
interface StageDebugDelegateOptions {
    maxRayDistance?: number;
    addEntityFactory?: AddEntityFactory | null;
}
declare class StageDebugDelegate {
    private stage;
    private options;
    private mouseNdc;
    private raycaster;
    private isMouseDown;
    private disposeFns;
    private debugCursor;
    private debugLines;
    constructor(stage: ZylemStage, options?: StageDebugDelegateOptions);
    update(): void;
    dispose(): void;
    private handleActionOnHit;
    private attachDomListeners;
}

/**
 * Debug delegate that bridges the stage's entity map and debug state to the camera.
 */
declare class StageCameraDebugDelegate implements CameraDebugDelegate {
    private stage;
    constructor(stage: ZylemStage);
    subscribe(listener: (state: CameraDebugState) => void): () => void;
    resolveTarget(uuid: string): Object3D | null;
    private snapshot;
}

interface ZylemStageConfig {
    inputs: Record<string, string[]>;
    backgroundColor: Color | string;
    backgroundImage: string | null;
    gravity: Vector3;
    variables: Record<string, any>;
    stageRef?: Stage;
}
type NodeLike$1 = {
    create: Function;
};
type StageEntityInput = NodeLike$1 | Promise<any> | (() => NodeLike$1 | Promise<any>);
type StageOptionItem = Partial<ZylemStageConfig> | CameraWrapper | StageEntityInput;
type StageOptions = [] | [Partial<ZylemStageConfig>, ...StageOptionItem[]];
type StageState = ZylemStageConfig & {
    entities: GameEntityInterface[];
};
/**
 * ZylemStage orchestrates scene, physics world, entities, and lifecycle.
 *
 * Responsibilities:
 * - Manage stage configuration (background, inputs, gravity, variables)
 * - Initialize and own `ZylemScene` and `ZylemWorld`
 * - Spawn, track, and remove entities; emit entity-added events
 * - Drive per-frame updates and transform system
 */
declare class ZylemStage extends LifeCycleBase<ZylemStage> {
    type: string;
    state: StageState;
    gravity: Vector3;
    world: ZylemWorld | null;
    scene: ZylemScene | null;
    children: Array<BaseNode>;
    _childrenMap: Map<number, BaseNode>;
    _removalMap: Map<number, BaseNode>;
    private pendingEntities;
    private pendingPromises;
    private isLoaded;
    _debugMap: Map<string, BaseNode>;
    private entityAddedHandlers;
    ecs: bitecs.IWorld;
    testSystem: any;
    transformSystem: ReturnType<typeof createTransformSystem> | null;
    debugDelegate: StageDebugDelegate | null;
    cameraDebugDelegate: StageCameraDebugDelegate | null;
    private debugStateUnsubscribe;
    uuid: string;
    wrapperRef: Stage | null;
    camera?: CameraWrapper;
    cameraRef?: ZylemCamera | null;
    private cameraDelegate;
    private loadingDelegate;
    /**
     * Create a new stage.
     * @param options Stage options: partial config, camera, and initial entities or factories
     */
    constructor(options?: StageOptions);
    private handleEntityImmediatelyOrQueue;
    private handlePromiseWithSpawnOnResolve;
    private saveState;
    private setState;
    /**
     * Load and initialize the stage's scene and world.
     * Uses generator pattern to yield control to event loop for real-time progress.
     * @param id DOM element id for the renderer container
     * @param camera Optional camera override
     */
    load(id: string, camera?: ZylemCamera | null): Promise<void>;
    /**
     * Generator that yields between entity loads for real-time progress updates.
     */
    private entityLoadGenerator;
    /**
     * Runs the entity load generator, yielding to the event loop between loads.
     * This allows the browser to process events and update the UI in real-time.
     */
    private runEntityLoadGenerator;
    protected _setup(params: SetupContext<ZylemStage>): void;
    private updateDebugDelegate;
    protected _update(params: UpdateContext<ZylemStage>): void;
    outOfLoop(): void;
    /** Update debug overlays and helpers if enabled. */
    debugUpdate(): void;
    /** Cleanup owned resources when the stage is destroyed. */
    protected _destroy(params: DestroyContext<ZylemStage>): void;
    /**
     * Create, register, and add an entity to the scene/world.
     * Safe to call only after `load` when scene/world exist.
     */
    spawnEntity(child: BaseNode): Promise<void>;
    buildEntityState(child: BaseNode): Partial<BaseEntityInterface>;
    /** Add the entity to internal maps and notify listeners. */
    addEntityToStage(entity: BaseNode): void;
    /**
     * Subscribe to entity-added events.
     * @param callback Invoked for each entity when added
     * @param options.replayExisting If true and stage already loaded, replays existing entities
     * @returns Unsubscribe function
     */
    onEntityAdded(callback: (entity: BaseNode) => void, options?: {
        replayExisting?: boolean;
    }): () => void;
    onLoading(callback: (event: LoadingEvent) => void): () => void;
    /**
     * Remove an entity and its resources by its UUID.
     * @returns true if removed, false if not found or stage not ready
     */
    removeEntityByUuid(uuid: string): boolean;
    /** Get an entity by its name; returns null if not found. */
    getEntityByName(name: string): BaseNode<any, any> | null;
    logMissingEntities(): void;
    /** Resize renderer viewport. */
    resize(width: number, height: number): void;
    /**
     * Enqueue items to be spawned. Items can be:
     * - BaseNode instances (immediate or deferred until load)
     * - Factory functions returning BaseNode or Promise<BaseNode>
     * - Promises resolving to BaseNode
     */
    enqueue(...items: StageEntityInput[]): void;
}

/**
 * Maps entity type symbols to their class types.
 * Used by getEntityByName to infer return types.
 */
interface EntityTypeMap {
    [SPRITE_TYPE]: ZylemSprite;
    [SPHERE_TYPE]: ZylemSphere;
    [RECT_TYPE]: ZylemRect;
    [TEXT_TYPE]: ZylemText;
    [BOX_TYPE]: ZylemBox;
    [PLANE_TYPE]: ZylemPlane;
    [ZONE_TYPE]: ZylemZone;
    [ACTOR_TYPE]: ZylemActor;
}

type NodeLike = {
    create: Function;
};
type AnyNode = NodeLike | Promise<NodeLike>;
type EntityInput = AnyNode | (() => AnyNode) | (() => Promise<any>);
declare class Stage {
    wrappedStage: ZylemStage | null;
    options: StageOptionItem[];
    private _pendingEntities;
    private setupCallbacks;
    private updateCallbacks;
    private destroyCallbacks;
    private pendingLoadingCallbacks;
    private eventDelegate;
    constructor(options: StageOptions);
    load(id: string, camera?: ZylemCamera | CameraWrapper | null): Promise<void>;
    private applyLifecycleCallbacks;
    addEntities(entities: BaseNode[]): Promise<void>;
    add(...inputs: Array<EntityInput>): void;
    private addToBlueprints;
    private addToStage;
    start(params: SetupContext<ZylemStage>): void;
    onUpdate(...callbacks: UpdateFunction<ZylemStage>[]): this;
    onSetup(...callbacks: SetupFunction<ZylemStage>[]): this;
    onDestroy(...callbacks: DestroyFunction<ZylemStage>[]): this;
    onLoading(callback: (event: LoadingEvent) => void): () => void;
    /**
     * Find an entity by name on the current stage.
     * @param name The name of the entity to find
     * @param type Optional type symbol for type inference (e.g., TEXT_TYPE, SPRITE_TYPE)
     * @returns The entity if found, or undefined
     * @example stage.getEntityByName('scoreText', TEXT_TYPE)
     */
    getEntityByName<T extends symbol | void = void>(name: string, type?: T): T extends keyof EntityTypeMap ? EntityTypeMap[T] | undefined : BaseNode | undefined;
    /**
     * Dispatch an event from the stage.
     * Events are emitted both locally and to the global event bus.
     */
    dispatch<K extends keyof StageEvents>(event: K, payload: StageEvents[K]): void;
    /**
     * Listen for events on this stage instance.
     * @returns Unsubscribe function
     */
    listen<K extends keyof StageEvents>(event: K, handler: (payload: StageEvents[K]) => void): () => void;
    /**
     * Clean up stage resources including event subscriptions.
     */
    dispose(): void;
}
/**
 * Create a stage with optional camera
 */
declare function createStage(...options: StageOptions): Stage;

/**
 * Stage state interface - minimal to prevent circular dependencies
 */
interface StageStateInterface {
    backgroundColor: Color;
    backgroundImage: string | null;
    inputs: {
        p1: string[];
        p2: string[];
    };
    variables: Record<string, any>;
    gravity: Vector3;
    entities: Partial<BaseEntityInterface>[];
    stageRef?: any;
}
/**
 * Minimal stage interface to break circular dependencies
 */
interface StageInterface {
    uuid: string;
    children: any[];
    state: StageStateInterface;
}

export { type StageStateInterface as S, type StageOptions as a, Stage as b, createStage as c, type StageInterface as d };
