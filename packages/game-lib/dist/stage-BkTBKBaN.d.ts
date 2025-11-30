import { G as GameEntity, U as UpdateContext, S as SetupFunction, b as UpdateFunction, D as DestroyFunction, c as SetupContext, d as DestroyContext, e as BaseNode, L as LoadingEvent } from './entity-Xlc2H_ZT.js';
import * as bitecs from 'bitecs';
import { Vector3, Scene, Color, Object3D, Group } from 'three';
import RAPIER__default, { World, RigidBody, Collider } from '@dimforge/rapier3d-compat';
import { E as Entity, Z as ZylemCamera, L as LifecycleFunction, C as CameraDebugDelegate, b as CameraDebugState, d as CameraWrapper } from './camera-Dk-fOVZE.js';

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
    private loadingHandlers;
    ecs: bitecs.IWorld;
    testSystem: any;
    transformSystem: any;
    debugDelegate: StageDebugDelegate | null;
    cameraDebugDelegate: StageCameraDebugDelegate | null;
    uuid: string;
    wrapperRef: Stage | null;
    camera?: CameraWrapper;
    cameraRef?: ZylemCamera | null;
    /**
     * Create a new stage.
     * @param options Stage options: partial config, camera, and initial entities or factories
     */
    constructor(options?: StageOptions);
    private parseOptions;
    private isZylemStageConfig;
    private isBaseNode;
    private isCameraWrapper;
    private isEntityInput;
    private isThenable;
    private handleEntityImmediatelyOrQueue;
    private handlePromiseWithSpawnOnResolve;
    private saveState;
    private setState;
    /**
     * Load and initialize the stage's scene and world.
     * @param id DOM element id for the renderer container
     * @param camera Optional camera override
     */
    load(id: string, camera?: ZylemCamera | null): Promise<void>;
    private createDefaultCamera;
    protected _setup(params: SetupContext<ZylemStage>): void;
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
    private emitLoading;
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

type NodeLike = {
    create: Function;
};
type AnyNode = NodeLike | Promise<NodeLike>;
type EntityInput = AnyNode | (() => AnyNode) | (() => Promise<any>);
declare class Stage {
    wrappedStage: ZylemStage | null;
    options: StageOptionItem[];
    update: UpdateFunction<ZylemStage>;
    setup: SetupFunction<ZylemStage>;
    destroy: DestroyFunction<ZylemStage>;
    constructor(options: StageOptions);
    load(id: string, camera?: ZylemCamera | CameraWrapper | null): Promise<void>;
    addEntities(entities: BaseNode[]): Promise<void>;
    add(...inputs: Array<EntityInput>): void;
    private addToBlueprints;
    private addToStage;
    start(params: SetupContext<ZylemStage>): void;
    onUpdate(...callbacks: UpdateFunction<ZylemStage>[]): void;
    onSetup(callback: SetupFunction<ZylemStage>): void;
    onDestroy(callback: DestroyFunction<ZylemStage>): void;
    onLoading(callback: (event: LoadingEvent) => void): () => void;
    setVariable(key: string, value: any): void;
    getVariable(key: string): any;
}
/**
 * Create a stage with optional camera
 */
declare function createStage(...options: StageOptions): Stage;

export { type BaseEntityInterface as B, type StageOptions as S, Stage as a, createStage as c };
