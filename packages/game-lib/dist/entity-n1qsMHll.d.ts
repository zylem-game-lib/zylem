import { Vector3, Vector2, Color, Material, BufferGeometry, Mesh, Group, ShaderMaterial } from 'three';
import { Vector3 as Vector3$1, RigidBodyDesc, ColliderDesc, RigidBody, Collider } from '@dimforge/rapier3d-compat';
import { IComponent } from 'bitecs';

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

interface IGame<TGlobals extends Record<string, unknown> = any> {
    start: () => Promise<this>;
    nextStage: () => Promise<void>;
    previousStage: () => Promise<void>;
    reset: () => Promise<void>;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    loadStageFromId: (stageId: string) => Promise<void>;
    end: () => Promise<void>;
    goToStage: () => void;
    getGlobal: <K extends keyof TGlobals>(key: K) => TGlobals[K];
    setGlobal: <K extends keyof TGlobals>(key: K, value: TGlobals[K]) => void;
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
declare abstract class BaseNode<Options = any, T = any> implements NodeInterface {
    protected parent: NodeInterface | null;
    protected children: NodeInterface[];
    options: Options;
    eid: number;
    uuid: string;
    name: string;
    markedForRemoval: boolean;
    setup: SetupFunction<this>;
    loaded: LoadedFunction<this>;
    update: UpdateFunction<this>;
    destroy: DestroyFunction<this>;
    cleanup: CleanupFunction<this>;
    constructor(args?: BaseNodeOptions[]);
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
    getOptions(): Options;
    setOptions(options: Partial<Options>): void;
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
    build(options: Partial<MaterialOptions>, entityType: symbol): Promise<void>;
    withColor(color: Color): this;
    withShader(shaderType: ZylemShaderType): this;
    setTexture(texturePath?: TexturePath, repeat?: Vector2): Promise<void>;
    setColor(color: Color): void;
    setShader(customShader: ZylemShaderType): void;
}

interface CollisionOptions {
    static?: boolean;
    sensor?: boolean;
    size?: Vector3;
    position?: Vector3;
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

interface LifeCycleDelegate<U> {
    setup?: ((params: SetupContext<U>) => void)[];
    update?: ((params: UpdateContext<U>) => void)[];
    destroy?: ((params: DestroyContext<U>) => void)[];
}
interface CollisionContext<T, O extends GameEntityOptions, TGlobals extends Record<string, unknown> = any> {
    entity: T;
    other: GameEntity<O>;
    globals: TGlobals;
}
type BehaviorContext<T, O extends GameEntityOptions> = SetupContext<T, O> | UpdateContext<T, O> | CollisionContext<T, O> | DestroyContext<T, O>;
type BehaviorCallback<T, O extends GameEntityOptions> = (params: BehaviorContext<T, O>) => void;
interface CollisionDelegate<T, O extends GameEntityOptions> {
    collision?: ((params: CollisionContext<T, O>) => void)[];
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
    lifeCycleDelegate: LifeCycleDelegate<O>;
    collisionDelegate: CollisionDelegate<this, O>;
    collisionType?: string;
    behaviorCallbackMap: Record<BehaviorCallbackType, BehaviorCallback<this, O>[]>;
    constructor();
    create(): this;
    onSetup(...callbacks: ((params: SetupContext<this>) => void)[]): this;
    onUpdate(...callbacks: ((params: UpdateContext<this>) => void)[]): this;
    onDestroy(...callbacks: ((params: DestroyContext<this>) => void)[]): this;
    onCollision(...callbacks: ((params: CollisionContext<this, O>) => void)[]): this;
    _setup(params: SetupContext<this>): void;
    protected _loaded(_params: LoadedContext<this>): Promise<void>;
    _update(params: UpdateContext<this>): void;
    _destroy(params: DestroyContext<this>): void;
    protected _cleanup(_params: CleanupContext<this>): Promise<void>;
    _collision(other: GameEntity<O>, globals?: any): void;
    addBehavior(behaviorCallback: ({
        type: BehaviorCallbackType;
        handler: any;
    })): this;
    addBehaviors(behaviorCallbacks: ({
        type: BehaviorCallbackType;
        handler: any;
    })[]): this;
    protected updateMaterials(params: any): void;
    buildInfo(): Record<string, string>;
}

export { type AnalogState as A, type Behavior as B, type CleanupContext as C, type DestroyFunction as D, GameEntity as G, type InputGamepad as I, type LoadedContext as L, type MaterialOptions as M, type SetupFunction as S, type TexturePath as T, type UpdateContext as U, type Vec3 as V, type UpdateFunction as a, type SetupContext as b, type DestroyContext as c, BaseNode as d, type InputPlayerNumber as e, type Inputs as f, type ButtonState as g, GameEntityLifeCycle as h, type IGame as i, type GameEntityOptions as j, type CollisionContext as k, type BehaviorCallbackType as l };
