# Stage Subsystem API Reference

Public API surface for every module under `packages/game-lib/src/lib/stage/`.
Signatures are copied faithfully from source; `private` members are omitted.

---

## debug-entity-cursor.ts

Reusable Three.js debug overlay that draws a translucent box + wireframe AABB around a target `Object3D` for the SELECT/DELETE debug tools.

```ts
export class DebugEntityCursor {
  constructor(scene: Scene);

  setColor(color: Color | number): void;

  /** Update the cursor to enclose the provided Object3D using a world-space AABB. */
  updateFromObject(object: Object3D | null | undefined): void;

  hide(): void;

  dispose(): void;
}
```

---

## entity-spawner.ts

Authoring helper that wraps an entity factory so game code can spawn entities into a live stage at absolute or relative positions.

```ts
export interface EntitySpawner {
  spawn: (stage: Stage, x: number, y: number) => Promise<GameEntity<any>>;
  spawnRelative: (source: any, stage: Stage, offset?: Vector2) => Promise<any | void>;
}

export function entitySpawner(
  factory: (x: number, y: number) => Promise<any> | GameEntity<any>,
): EntitySpawner;
```

---

## stage-camera-debug-delegate.ts

Adapter implementing the camera's `CameraDebugDelegate` contract by bridging global `debugState` and the stage's entity maps to the camera.

```ts
export class StageCameraDebugDelegate implements CameraDebugDelegate {
  constructor(stage: ZylemStage);

  subscribe(listener: (state: CameraDebugState) => void): () => void;

  resolveTarget(uuid: string): Object3D | null;
}
```

---

## stage-camera-delegate.ts

Encapsulates camera resolution and `CameraManager` construction for a stage.

```ts
export class StageCameraDelegate {
  constructor(stage: ZylemStage);

  /** Create a default third-person camera based on window size. */
  createDefaultCamera(): ZylemCamera;

  /** Resolve the camera to use for the stage (override, wrapper, or default). */
  resolveCamera(
    cameraOverride?: ZylemCamera | null,
    cameraWrapper?: CameraWrapper,
  ): ZylemCamera;

  /** Build a CameraManager from stage options (single or multiple cameras). */
  buildCameraManager(
    cameraOverride?: ZylemCamera | null,
    ...cameraWrappers: (CameraWrapper | undefined)[]
  ): CameraManager;
}
```

---

## stage-config.ts

Stage configuration types, engine defaults, and the option-parsing logic that normalizes the heterogeneous `createStage(...)` argument list.

```ts
/** Source for the unified-Stage wasm runtime: bytes, fetch URL, or a builder. */
export type StageWasmSource =
  | ArrayBuffer
  | RequestInfo
  | URL
  | (() => Promise<ArrayBuffer | RequestInfo | URL>);

/** Authoring-side configuration for the unified-Stage wasm runtime. */
export interface StageWasmRuntimeConfig {
  source: StageWasmSource;
  options?: Omit<WasmStageRuntimeOptions, 'imports'>;
}

export type StageGLTFAssetLoaderConfig = {
  meshopt?: boolean;
  ktx2TranscoderPath?: URL | string;
};

export type StageAssetLoaderConfig = {
  gltf?: StageGLTFAssetLoaderConfig;
};

/** Default static path for the Basis Universal transcoder used by KTX2Loader. */
export const DEFAULT_KTX2_TRANSCODER_PATH = '/three/basis/';

/** Apply engine defaults (e.g. KTX2 transcoder path) to a stage's GLTF loader config. */
export function resolveGLTFLoaderConfig(
  gltf?: StageGLTFAssetLoaderConfig,
): StageGLTFAssetLoaderConfig;

/** Stage configuration type for user-facing options. */
export type StageConfigLike = Partial<{
  inputs: Record<string, string[]>;
  backgroundColor: Color | string;
  backgroundImage: string | null;
  backgroundShader: ZylemShader;
  gravity: Vector3 | Vec3Components;
  variables: Record<string, any>;
  /** Physics update rate in Hz (default 60). */
  physicsRate: number;
  assetLoaders: StageAssetLoaderConfig;
  runtimeAdapter: StageRuntimeAdapter;
  runtimeDebugBinding?: RuntimeDebugBinding;
  wasmRuntime?: StageWasmRuntimeConfig;
  defaultLighting: boolean;
}>;

/** Internal stage configuration class. */
export class StageConfig {
  constructor(
    public inputs: Record<string, string[]>,
    public backgroundColor: Color | string,
    public backgroundImage: string | null,
    public backgroundShader: ZylemShader | null,
    public gravity: Vector3 | Vec3Components,
    public variables: Record<string, any>,
    public physicsRate: number = 60,
    public assetLoaders: StageAssetLoaderConfig = {},
    public runtimeAdapter: StageRuntimeAdapter | undefined = undefined,
    public runtimeDebugBinding: RuntimeDebugBinding | undefined = undefined,
    public defaultLighting: boolean = true,
    public wasmRuntime: StageWasmRuntimeConfig | undefined = undefined,
  );
}

/** Create default stage configuration. */
export function createDefaultStageConfig(): StageConfig;

/** Result of parsing stage options. */
export interface ParsedStageOptions {
  config: StageConfig;
  entities: BaseNode[];
  asyncEntities: Array<BaseNode | Promise<any> | (() => BaseNode | Promise<any>)>;
  /** @deprecated Use `cameras` array instead for multi-camera support */
  camera?: CameraWrapper;
  cameras: CameraWrapper[];
}

/** Parse stage options array and resolve configuration. */
export function parseStageOptions(options?: any[]): ParsedStageOptions;

/** Factory for authoring stage configuration objects in user code. */
export function stageConfig(config: StageConfigLike): StageConfigLike;
```

---

## stage-debug-delegate.ts

Self-managing in-world debug/editor interaction layer that subscribes to `debugState`, draws collider wireframes, and handles hover/select/delete/spawn via raycasting.

```ts
export type AddEntityFactory = (
  params: { position: Vector3; normal?: Vector3 },
) => Promise<any> | any;

export interface StageDebugDelegateOptions {
  maxRayDistance?: number;
  addEntityFactory?: AddEntityFactory | null;
}

export class StageDebugDelegate {
  constructor(stage: ZylemStage, options?: StageDebugDelegateOptions);

  update(): void;

  /** Full teardown — unsubscribes from debugState and cleans up all resources. */
  dispose(): void;
}
```

---

## stage-default.ts

Reactive, library-wide default config for newly created stages, plus the option-merging helper used by the `stage()` builder.

```ts
export function getStageOptions(options: StageOptions): StageOptions;
```

> Note: `stageDefaultsState` and `getStageDefaultConfig` are module-private (not exported).

---

## stage-entity-delegate.ts

The stage's entity lifecycle engine: queuing, progressive loading, spawning, batching, deferred models, removal, lookup, and ECS behavior-system management.

```ts
type NodeLike = { create: Function };
export type StageEntityInput = NodeLike | Promise<any> | (() => NodeLike | Promise<any>);

/** Runtime context provided by ZylemStage after scene and world are initialized. */
export interface EntityDelegateContext {
  scene: ZylemScene;
  world: ZylemWorld;
  renderStrategy: RenderStrategyManager | null;
  camera: ZylemCamera;
  runtimeAdapter?: StageRuntimeAdapter | null;
  wasmStage?: WasmStageRuntime | null;
}

export class StageEntityDelegate {
  /** Entities queued before load completes. */
  children: BaseNode[];

  /** UUID → BaseNode map of all live entities. */
  readonly childrenMap: Map<string, BaseNode>;

  /** UUID → BaseNode map populated when debug mode is active. */
  readonly debugMap: Map<string, BaseNode>;

  /** ECS behavior systems auto-registered from entity refs or manually added. */
  readonly behaviorSystems: BehaviorSystem[];
  readonly behaviorSystemByKey: Map<symbol, BehaviorSystem>;
  readonly registeredSystemKeys: Set<symbol>;
  readonly behaviorEntityIndex: Map<symbol, Set<BehaviorEntityLink>>;

  /** Unified-Stage wasm runtime; shared with descriptor systemFactory calls. */
  wasmStage: WasmStageRuntime | null;

  constructor(
    loadingDelegate: StageLoadingDelegate,
    entityModelDelegate: StageEntityModelDelegate,
  );

  get isLoaded(): boolean;
  set isLoaded(value: boolean);

  /** Bind runtime context after scene and world are initialized. */
  attach(context: EntityDelegateContext): void;

  /** Create, register, and add an entity to the scene/world. */
  spawnEntity(child: BaseNode): Promise<void>;

  handleLateModelReady(entity: GameEntity<any>): void;

  /** Add the entity to internal maps and notify listeners. */
  addEntityToStage(entity: BaseNode): void;

  /** Remove an entity and its resources by its UUID. */
  removeEntityByUuid(uuid: string): boolean;

  /** Get an entity by its name; returns null if not found. */
  getEntityByName(name: string): BaseNode | null;

  /** Build a serializable state snapshot for an entity. */
  buildEntityState(child: BaseNode): Partial<BaseEntityInterface>;

  /** Subscribe to entity-added events. */
  onEntityAdded(
    callback: (entity: BaseNode) => void,
    options?: { replayExisting?: boolean },
  ): () => void;

  /** Enqueue items to be spawned (BaseNode, factory, or Promise). */
  enqueue(...items: StageEntityInput[]): void;

  /** Runs the entity load generator, yielding to the event loop in batches. */
  runEntityLoadGenerator(): Promise<void>;

  /** Register an ECS behavior system to run each frame. */
  registerSystem(systemOrFactory: BehaviorSystem | BehaviorSystemFactory): void;

  /** Destroy all entities and clear internal state. */
  destroyAll(): void;
}
```

---

## stage-entity-model-delegate.ts

Bridges async model loading to scene attachment: observes entities without a renderable group and adds them once `entity:model:loaded` fires.

```ts
export class StageEntityModelDelegate {
  /** Initialize the delegate with the scene reference and start listening. */
  attach(scene: ZylemScene, onEntityReady?: (entity: GameEntity<any>) => void): void;

  /** Register an entity for observation; group is added to scene when its model loads. */
  observe(entity: GameEntity<any>): void;

  /** Unregister an entity (e.g., when removed before model loads). */
  unobserve(entityId: string): void;

  /** Cleanup all subscriptions and pending entities. */
  dispose(): void;
}
```

---

## stage-events.ts

Bridges the reactive `stageState` proxy to DOM `CustomEvent`s for non-valtio consumers.

```ts
/** Event name for stage state changes. */
export const STAGE_STATE_CHANGE = 'STAGE_STATE_CHANGE';

/** Event detail payload for STAGE_STATE_CHANGE events. */
export interface StageStateChangeEvent {
  entities: StageStateInterface['entities'];
  variables: StageStateInterface['variables'];
}

/** Subscribe to stageState and dispatch STAGE_STATE_CHANGE to window; returns unsubscribe. */
export function initStageStateDispatcher(): () => void;

/** Manually dispatch the current stage state. */
export function dispatchStageState(): void;
```

---

## stage-factory.ts

Builds runnable `Stage` instances from serialized `StageBlueprint` data.

```ts
export const StageFactory: {
  createFromBlueprint(blueprint: StageBlueprint): Promise<Stage>;
};
```

---

## stage-loading-delegate.ts

Fan-out hub for a stage's loading lifecycle events, broadcasting to direct subscribers and the global `gameEventBus`.

```ts
export class StageLoadingDelegate {
  /** Set stage context for event bus emissions. */
  setStageContext(stageName: string, stageIndex: number): void;

  /** Subscribe to loading events; returns unsubscribe. */
  onLoading(callback: (event: LoadingEvent) => void): () => void;

  /** Emit a loading event to all subscribers and to the game event bus. */
  emit(event: LoadingEvent): void;

  emitStart(message?: string): void;

  emitProgress(message: string, current: number, total: number): void;

  emitComplete(message?: string): void;

  /** Clear all loading handlers. */
  dispose(): void;
}
```

---

## stage-manager.ts

Global stage navigation, IndexedDB persistence, and a static blueprint registry built around a reactive previous/current/next sliding window.

```ts
/** Reactive sliding-window stage state. */
export const stageState: {
  previous: StageBlueprint | null;
  current: StageBlueprint | null;
  next: StageBlueprint | null;
  isLoading: boolean;
};

export const StageManager: {
  staticRegistry: Map<string, StageBlueprint>;

  registerStaticStage(id: string, blueprint: StageBlueprint): void;

  loadStageData(stageId: string): Promise<StageBlueprint>;

  transitionForward(
    nextStageId: string,
    loadStaticStage?: (id: string) => Promise<StageBlueprint>,
  ): Promise<void>;

  /** Manually set the next stage to pre-load it. */
  preloadNext(
    stageId: string,
    loadStaticStage?: (id: string) => Promise<StageBlueprint>,
  ): Promise<void>;
};
```

---

## stage-state.ts

Central reactive data layer: the `stageState` valtio proxy plus a WeakMap/proxy-backed per-object variable store with path-based accessors.

```ts
/** Initial stage state with default values (exported for ZylemStage construction). */
export const initialStageState: {
  backgroundColor: Color;
  backgroundImage: null;
  backgroundShader: null;
  inputs: { p1: string[]; p2: string[] };
  gravity: Vector3;
  variables: Record<string, never>;
  physicsRate: number;
  defaultLighting: boolean;
  entities: GameEntityInterface[];
};

/** Stage state proxy for reactive updates. */
export const stageState: StageStateInterface;

/** Set a variable on an object by path. */
export function setVariable(target: object, path: string, value: unknown): void;

/** Create/initialize a variable with a default value (only if not already set). */
export function createVariable<T>(target: object, path: string, defaultValue: T): T;

/** Get a variable from an object by path. */
export function getVariable<T = unknown>(target: object, path: string): T | undefined;

/** Subscribe to changes on a single variable path; returns unsubscribe. */
export function onVariableChange<T = unknown>(
  target: object,
  path: string,
  callback: (value: T) => void,
): () => void;

/** Subscribe to changes on multiple variable paths; returns unsubscribe. */
export function onVariableChanges<T extends unknown[] = unknown[]>(
  target: object,
  paths: string[],
  callback: (values: T) => void,
): () => void;

/** Clear all variables for a target object (used on stage/entity dispose). */
export function clearVariables(target: object): void;

// Re-exported (internal-use) stage state helpers:
export const setStageBackgroundColor: (value: Color) => void;
export const setStageBackgroundImage: (value: string | null) => void;
export const setStageVariables: (variables: Record<string, any>) => void;
export const resetStageVariables: () => void;
```

---

## stage.ts

The user-facing, durable stage handle with a fluent authoring API; recreates an internal `ZylemStage` on each `load()`.

```ts
export class Stage {
  wrappedStage: ZylemStage | null;
  options: StageOptionItem[];

  /** Per-stage input configuration overrides; merged with game-level defaults on load. */
  inputConfig: GameInputConfig | null;

  /** @internal Callback set by the game to trigger input reconfiguration. */
  onInputConfigChanged: (() => void) | null;

  constructor(options: StageOptions);

  /** Set composable input configuration for this stage (deep-merged). */
  setInputConfiguration(...configs: GameInputConfig[]): this;

  load(
    id: string,
    camera?: ZylemCamera | CameraWrapper | null,
    rendererManager?: RendererManager | null,
  ): Promise<void>;

  addEntities(entities: BaseNode[]): Promise<void>;

  add(...inputs: Array<EntityInput>): void;

  start(params: SetupContext<ZylemStage>): void;

  onUpdate(...callbacks: UpdateFunction<ZylemStage>[]): this;
  onSetup(...callbacks: SetupFunction<ZylemStage>[]): this;
  onDestroy(...callbacks: DestroyFunction<ZylemStage>[]): this;

  onLoading(callback: (event: LoadingEvent) => void): (() => void) | undefined;

  /** Find an entity by name on the current stage. */
  getEntityByName<T extends symbol | void = void>(
    name: string,
    type?: T,
  ): T extends keyof EntityTypeMap ? EntityTypeMap[T] | undefined : BaseNode | undefined;

  /** Add a camera to this stage. */
  addCamera(camera: ZylemCamera | CameraWrapper, name?: string): string | null;

  /** Remove a camera from this stage by name or reference. */
  removeCamera(nameOrRef: string | ZylemCamera | CameraWrapper): boolean;

  /** Set the active camera by name or reference. */
  setActiveCamera(nameOrRef: string | ZylemCamera | CameraWrapper): boolean;

  /** Get a camera by name from the camera manager. */
  getCamera(name: string): ZylemCamera | null;

  /** Dispatch an event from the stage (local + global event bus). */
  dispatch<K extends keyof StageEvents>(event: K, payload: StageEvents[K]): void;

  /** Listen for events on this stage instance; returns unsubscribe. */
  listen<K extends keyof StageEvents>(
    event: K,
    handler: (payload: StageEvents[K]) => void,
  ): () => void;

  /** Clean up stage resources including event subscriptions. */
  dispose(): void;
}

/** Create a stage with optional camera. */
export function createStage(...options: StageOptions): Stage;
```

---

## zylem-stage.ts

The runtime heart of a loaded stage: owns scene, physics world, cameras, optional wasm runtime, and all delegates; drives the per-frame update loop.

```ts
export interface ZylemStageConfig {
  inputs: Record<string, string[]>;
  backgroundColor: Color | string;
  backgroundImage: string | null;
  backgroundShader: any | null;
  gravity: Vector3 | Vec3Components;
  variables: Record<string, any>;
  /** Physics update rate in Hz (default 60). */
  physicsRate: number;
  assetLoaders?: StageAssetLoaderConfig;
  runtimeAdapter?: StageRuntimeAdapter;
  runtimeDebugBinding?: RuntimeDebugBinding;
  wasmRuntime?: StageWasmRuntimeConfig;
  defaultLighting: boolean;
  stageRef?: Stage;
}

export type StageOptionItem = Partial<ZylemStageConfig> | CameraWrapper | StageEntityInput;
export type StageOptions = [] | [Partial<ZylemStageConfig>, ...StageOptionItem[]];
export type StageState = ZylemStageConfig & { entities: GameEntityInterface[] };

// Re-exported for convenience:
export type { LoadingEvent };

export class ZylemStage extends LifeCycleBase<ZylemStage> {
  public type: string;

  state: StageState;
  gravity: Vector3 | Vec3Components;

  world: ZylemWorld | null;
  scene: ZylemScene | null;
  renderStrategy: RenderStrategyManager | null;
  /** Unified-Stage wasm runtime; non-null only when wasmRuntime was configured. */
  wasmStage: WasmStageRuntime | null;

  debugDelegate: StageDebugDelegate | null;

  uuid: string;
  wrapperRef: Stage | null;
  camera?: CameraWrapper;
  cameras: CameraWrapper[];
  cameraRef?: ZylemCamera | null;
  cameraManagerRef: CameraManager | null;
  rendererManager: RendererManager | null;
  runtimeAdapter: StageRuntimeAdapter | null;

  /** Entity management delegate — public for external consumers. */
  readonly entityDelegate: StageEntityDelegate;

  /** Idempotency guard for _setup. */
  public hasSetup: boolean;

  constructor(options?: StageOptions);

  /** Load and initialize the stage's scene and world. */
  load(
    id: string,
    camera?: ZylemCamera | null,
    rendererManager?: RendererManager | null,
  ): Promise<void>;

  public outOfLoop(): void;

  /** Update debug overlays and helpers if enabled. */
  public debugUpdate(): void;

  /** Forward to entity delegate. */
  spawnEntity(child: BaseNode): Promise<void>;
  buildEntityState(child: BaseNode): Partial<BaseEntityInterface>;
  onEntityAdded(
    callback: (entity: BaseNode) => void,
    options?: { replayExisting?: boolean },
  ): () => void;
  onLoading(callback: (event: LoadingEvent) => void): () => void;

  /** Register an ECS behavior system to run each frame; returns this. */
  registerSystem(systemOrFactory: BehaviorSystem | BehaviorSystemFactory): this;

  removeEntityByUuid(uuid: string): boolean;
  getEntityByName(name: string): BaseNode | null;
  enqueue(...items: StageEntityInput[]): void;

  logMissingEntities(): void;

  /** Add a camera to this stage's camera manager. */
  addCamera(camera: ZylemCamera, name?: string): string | null;
  /** Remove a camera from this stage's camera manager. */
  removeCamera(nameOrRef: string | ZylemCamera): boolean;
  /** Set the active camera by name or reference. */
  setActiveCamera(nameOrRef: string | ZylemCamera): boolean;
  /** Get a camera by name from the camera manager. */
  getCamera(name: string): ZylemCamera | null;

  /** Resize renderer viewport. */
  resize(width: number, height: number): void;
}
```
