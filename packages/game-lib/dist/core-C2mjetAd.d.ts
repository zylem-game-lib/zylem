import { I as InputGamepad, b as UpdateFunction, f as InputPlayerNumber, g as Inputs, h as ButtonState, A as AnalogState, c as SetupContext, U as UpdateContext, d as DestroyContext, i as GameEntityLifeCycle, e as BaseNode, j as IGame, S as SetupFunction, D as DestroyFunction, L as LoadingEvent, k as LoadedContext, C as CleanupContext } from './entity-bQElAdpo.js';
import { Z as ZylemCamera } from './camera-Dk-fOVZE.js';
import { B as BaseEntityInterface, a as Stage } from './stage-CrmY7V0i.js';
import { Color, Vector3 } from 'three';
import { Vector3 as Vector3$1 } from '@dimforge/rapier3d-compat';

interface InputProvider {
    getInput(delta: number): Partial<InputGamepad>;
    isConnected(): boolean;
    getName(): string;
}

type BasicTypes = number | string | boolean;
type BaseGlobals = Record<string, BasicTypes>;
type KeyboardMapping = Record<string, string[]>;
type MouseMapping = Record<string, string[]>;
interface GameInputPlayerConfig {
    key?: KeyboardMapping;
    mouse?: MouseMapping;
}
interface GameInputConfig {
    p1?: GameInputPlayerConfig;
    p2?: GameInputPlayerConfig;
    p3?: GameInputPlayerConfig;
    p4?: GameInputPlayerConfig;
    p5?: GameInputPlayerConfig;
    p6?: GameInputPlayerConfig;
    p7?: GameInputPlayerConfig;
    p8?: GameInputPlayerConfig;
}
interface ZylemGameConfig<StageInterface, GameInterface, TGlobals extends BaseGlobals> {
    id: string;
    globals?: TGlobals;
    stages?: StageInterface[];
    update?: UpdateFunction<GameInterface>;
    debug?: boolean;
    time?: number;
    input?: GameInputConfig;
}

declare class InputManager {
    private inputMap;
    private currentInputs;
    private previousInputs;
    constructor(config?: GameInputConfig);
    addInputProvider(playerNumber: InputPlayerNumber, provider: InputProvider): void;
    getInputs(delta: number): Inputs;
    mergeButtonState(a: ButtonState | undefined, b: ButtonState | undefined): ButtonState;
    mergeAnalogState(a: AnalogState | undefined, b: AnalogState | undefined): AnalogState;
    private mergeInputs;
}

/**
 * This class is an alternative to {@link Clock} with a different API design and behavior.
 * The goal is to avoid the conceptual flaws that became apparent in `Clock` over time.
 *
 * - `Timer` has an `update()` method that updates its internal state. That makes it possible to
 * call `getDelta()` and `getElapsed()` multiple times per simulation step without getting different values.
 * - The class can make use of the Page Visibility API to avoid large time delta values when the app
 * is inactive (e.g. tab switched or browser hidden).
 *
 * ```js
 * const timer = new Timer();
 * timer.connect( document ); // use Page Visibility API
 * ```
 *
 * @three_import import { Timer } from 'three/addons/misc/Timer.js';
 */
declare class Timer {
    protected _previousTime: number;
    protected _currentTime: number;
    protected _startTime: number;
    protected _delta: number;
    protected _elapsed: number;
    protected _timescale: number;
    protected _document: Document | null;
    protected _pageVisibilityHandler: (() => void) | null;
    /**
     * Constructs a new timer.
     */
    constructor();
    /**
     * Connect the timer to the given document.Calling this method is not mandatory to
     * use the timer but enables the usage of the Page Visibility API to avoid large time
     * delta values.
     *
     * @param {Document} document - The document.
     */
    connect(document: Document): void;
    /**
     * Disconnects the timer from the DOM and also disables the usage of the Page Visibility API.
     */
    disconnect(): void;
    /**
     * Returns the time delta in seconds.
     *
     * @return {number} The time delta in second.
     */
    getDelta(): number;
    /**
     * Returns the elapsed time in seconds.
     *
     * @return {number} The elapsed time in second.
     */
    getElapsed(): number;
    /**
     * Returns the timescale.
     *
     * @return {number} The timescale.
     */
    getTimescale(): number;
    /**
     * Sets the given timescale which scale the time delta computation
     * in `update()`.
     *
     * @param {number} timescale - The timescale to set.
     * @return {Timer} A reference to this timer.
     */
    setTimescale(timescale: number): Timer;
    /**
     * Resets the time computation for the current simulation step.
     *
     * @return {Timer} A reference to this timer.
     */
    reset(): Timer;
    /**
     * Can be used to free all internal resources. Usually called when
     * the timer instance isn't required anymore.
     */
    dispose(): void;
    /**
     * Updates the internal state of the timer. This method should be called
     * once per simulation step and before you perform queries against the timer
     * (e.g. via `getDelta()`).
     *
     * @param {number} timestamp - The current time in milliseconds. Can be obtained
     * from the `requestAnimationFrame` callback argument. If not provided, the current
     * time will be determined with `performance.now`.
     * @return {Timer} A reference to this timer.
     */
    update(timestamp?: number): Timer;
}

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

declare const AspectRatio: {
    readonly FourByThree: number;
    readonly SixteenByNine: number;
    readonly TwentyOneByNine: number;
    readonly OneByOne: number;
};
type AspectRatioValue = (typeof AspectRatio)[keyof typeof AspectRatio] | number;
/**
 * AspectRatioDelegate manages sizing a canvas to fit within a container
 * while preserving a target aspect ratio. It notifies a consumer via
 * onResize when the final width/height are applied so renderers/cameras
 * can update their viewports.
 */
declare class AspectRatioDelegate {
    container: HTMLElement;
    canvas: HTMLCanvasElement;
    aspectRatio: number;
    onResize?: (width: number, height: number) => void;
    private handleResizeBound;
    constructor(params: {
        container: HTMLElement;
        canvas: HTMLCanvasElement;
        aspectRatio: AspectRatioValue;
        onResize?: (width: number, height: number) => void;
    });
    /** Attach window resize listener and apply once. */
    attach(): void;
    /** Detach window resize listener. */
    detach(): void;
    /** Compute the largest size that fits container while preserving aspect. */
    measure(): {
        width: number;
        height: number;
    };
    /** Apply measured size to canvas and notify. */
    apply(): void;
}

type RetroResolution = {
    key: string;
    width: number;
    height: number;
    notes?: string;
};
type RetroPreset = {
    displayAspect: number;
    resolutions: RetroResolution[];
};
/**
 * Retro and console display presets.
 * displayAspect represents the intended display aspect (letterboxing target),
 * not necessarily the raw pixel aspect of internal buffers.
 */
declare const RetroPresets: Record<string, RetroPreset>;
type RetroPresetKey = keyof typeof RetroPresets;

type GameConfigLike = Partial<{
    id: string;
    globals: Record<string, any>;
    stages: StageInterface[];
    debug: boolean;
    time: number;
    input: GameInputConfig;
    /** numeric value or key in AspectRatio */
    aspectRatio: AspectRatioValue | keyof typeof AspectRatio;
    /** console/display preset to derive aspect ratio */
    preset: RetroPresetKey;
    /** lock internal render buffer to this resolution (e.g., '256x240' or { width, height }) */
    resolution: string | {
        width: number;
        height: number;
    };
    fullscreen: boolean;
    /** CSS background value for document body */
    bodyBackground: string;
    /** existing container by reference */
    container: HTMLElement;
    /** create/find container by id */
    containerId: string;
    /** optional canvas if caller wants to manage it */
    canvas: HTMLCanvasElement;
}>;
declare class GameConfig {
    id: string;
    globals: Record<string, any>;
    stages: StageInterface[];
    debug: boolean;
    time: number;
    input: GameInputConfig | undefined;
    aspectRatio: number;
    internalResolution: {
        width: number;
        height: number;
    } | undefined;
    fullscreen: boolean;
    bodyBackground: string | undefined;
    container: HTMLElement;
    containerId?: string | undefined;
    canvas?: HTMLCanvasElement | undefined;
    constructor(id: string, globals: Record<string, any>, stages: StageInterface[], debug: boolean, time: number, input: GameInputConfig | undefined, aspectRatio: number, internalResolution: {
        width: number;
        height: number;
    } | undefined, fullscreen: boolean, bodyBackground: string | undefined, container: HTMLElement, containerId?: string | undefined, canvas?: HTMLCanvasElement | undefined);
}
/**
 * Factory for authoring configuration objects in user code.
 * Returns a plain object that can be passed to `game(...)`.
 */
declare function gameConfig(config: GameConfigLike): GameConfigLike;

interface GameCanvasOptions {
    id: string;
    container?: HTMLElement;
    containerId?: string;
    canvas?: HTMLCanvasElement;
    bodyBackground?: string;
    fullscreen?: boolean;
    aspectRatio: AspectRatioValue | number;
}
/**
 * GameCanvas is a DOM delegate that owns:
 * - container lookup/creation and styling (including fullscreen centering)
 * - body background application
 * - canvas mounting into container
 * - aspect ratio sizing via AspectRatioDelegate
 */
declare class GameCanvas {
    id: string;
    container: HTMLElement;
    canvas: HTMLCanvasElement;
    bodyBackground?: string;
    fullscreen: boolean;
    aspectRatio: number;
    private ratioDelegate;
    constructor(options: GameCanvasOptions);
    applyBodyBackground(): void;
    mountCanvas(): void;
    mountRenderer(rendererDom: HTMLCanvasElement, onResize: (width: number, height: number) => void): void;
    centerIfFullscreen(): void;
    attachAspectRatio(onResize: (width: number, height: number) => void): void;
    destroy(): void;
    private ensureContainer;
}

type ZylemGameOptions<TGlobals extends BaseGlobals> = ZylemGameConfig<Stage, ZylemGame<TGlobals>, TGlobals> & Partial<GameConfig>;
declare class ZylemGame<TGlobals extends BaseGlobals> {
    id: string;
    initialGlobals: TGlobals;
    customSetup: ((params: SetupContext<ZylemGame<TGlobals>, TGlobals>) => void) | null;
    customUpdate: ((params: UpdateContext<ZylemGame<TGlobals>, TGlobals>) => void) | null;
    customDestroy: ((params: DestroyContext<ZylemGame<TGlobals>, TGlobals>) => void) | null;
    stages: Stage[];
    stageMap: Map<string, Stage>;
    currentStageId: string;
    previousTimeStamp: number;
    totalTime: number;
    timer: Timer;
    inputManager: InputManager;
    wrapperRef: Game<TGlobals>;
    statsRef: {
        begin: () => void;
        end: () => void;
        showPanel: (panel: number) => void;
        dom: HTMLElement;
    } | null;
    defaultCamera: ZylemCamera | null;
    container: HTMLElement | null;
    canvas: HTMLCanvasElement | null;
    aspectRatioDelegate: AspectRatioDelegate | null;
    resolvedConfig: GameConfig | null;
    gameCanvas: GameCanvas | null;
    private animationFrameId;
    private isDisposed;
    static FRAME_LIMIT: number;
    static FRAME_DURATION: number;
    static MAX_DELTA_SECONDS: number;
    constructor(options: ZylemGameOptions<TGlobals>, wrapperRef: Game<TGlobals>);
    loadGameCanvas(config: GameConfig): void;
    loadDebugOptions(options: ZylemGameOptions<TGlobals>): void;
    loadStage(stage: Stage): Promise<void>;
    unloadCurrentStage(): void;
    setGlobals(options: ZylemGameConfig<Stage, ZylemGame<TGlobals>, TGlobals>): void;
    params(): UpdateContext<ZylemGame<TGlobals>, TGlobals>;
    start(): void;
    loop(timestamp: number): void;
    dispose(): void;
    outOfLoop(): void;
    getStage(id: string): Stage | undefined;
    currentStage(): Stage | undefined;
}

type GameOptions<TGlobals extends BaseGlobals> = Array<ZylemGameConfig<Stage, any, TGlobals> | GameConfigLike | Stage | GameEntityLifeCycle | BaseNode>;

declare class Game<TGlobals extends BaseGlobals> implements IGame<TGlobals> {
    private wrappedGame;
    options: GameOptions<TGlobals>;
    update: UpdateFunction<ZylemGame<TGlobals>, TGlobals>;
    setup: SetupFunction<ZylemGame<TGlobals>, TGlobals>;
    destroy: DestroyFunction<ZylemGame<TGlobals>, TGlobals>;
    refErrorMessage: string;
    constructor(options: GameOptions<TGlobals>);
    start(): Promise<this>;
    private load;
    setOverrides(): void;
    pause(): Promise<void>;
    resume(): Promise<void>;
    reset(): Promise<void>;
    previousStage(): Promise<void>;
    loadStageFromId(stageId: string): Promise<void>;
    nextStage(): Promise<void>;
    goToStage(): Promise<void>;
    end(): Promise<void>;
    dispose(): void;
    onLoading(callback: (event: LoadingEvent) => void): void;
}
/**
 * create a new game
 * @param options GameOptions - Array of IGameOptions, Stage, GameEntity, or BaseNode objects
 * @param options.id Game name string (when using IGameOptions)
 * @param options.globals Game globals object (when using IGameOptions)
 * @param options.stages Array of stage objects (when using IGameOptions)
 * @returns Game
 */
declare function createGame<TGlobals extends BaseGlobals>(...options: GameOptions<TGlobals>): Game<TGlobals>;

declare class Vessel extends BaseNode<{}, Vessel> {
    static type: symbol;
    protected _setup(_params: SetupContext<this>): void;
    protected _loaded(_params: LoadedContext<this>): Promise<void>;
    protected _update(_params: UpdateContext<this>): void;
    protected _destroy(_params: DestroyContext<this>): void;
    protected _cleanup(_params: CleanupContext<this>): Promise<void>;
    create(): this;
}
declare function vessel(...args: Array<BaseNode>): BaseNode<{}, Vessel>;

/**
 * @deprecated This type is deprecated.
 */
type Vect3 = Vector3 | Vector3$1;

/**
 * Listen for a single global key change inside an onUpdate pipeline.
 * Usage: onUpdate(globalChange('p1Score', (value) => { ... }))
 */
declare function globalChange<T = any>(key: string, callback: (value: T, ctx: UpdateContext<any>) => void): (ctx: UpdateContext<any>) => void;
/**
 * Listen for multiple global key changes inside an onUpdate pipeline.
 * Calls back when any of the provided keys changes.
 * Usage: onUpdate(globalChanges(['p1Score','p2Score'], ([p1,p2]) => { ... }))
 */
declare function globalChanges<T = any>(keys: string[], callback: (values: T[], ctx: UpdateContext<any>) => void): (ctx: UpdateContext<any>) => void;
/**
 * Listen for a single stage variable change inside an onUpdate pipeline.
 * Usage: onUpdate(variableChange('score', (value, ctx) => { ... }))
 */
declare function variableChange<T = any>(key: string, callback: (value: T, ctx: UpdateContext<any>) => void): (ctx: UpdateContext<any>) => void;
/**
 * Listen for multiple stage variable changes; fires when any changes.
 * Usage: onUpdate(variableChanges(['a','b'], ([a,b], ctx) => { ... }))
 */
declare function variableChanges<T = any>(keys: string[], callback: (values: T[], ctx: UpdateContext<any>) => void): (ctx: UpdateContext<any>) => void;

export { Game as G, type Vect3 as V, type ZylemGameConfig as Z, globalChange as a, globalChanges as b, createGame as c, variableChange as d, variableChanges as e, gameConfig as g, vessel as v };
