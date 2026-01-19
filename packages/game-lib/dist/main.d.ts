import { G as Game } from './core-mb03pEIV.js';
export { V as Vect3, Z as ZylemGameConfig, c as createGame, g as gameConfig, a as globalChange, b as globalChanges, d as variableChange, e as variableChanges, v as vessel } from './core-mb03pEIV.js';
export { a as StageOptions, c as createStage } from './stage-types-C0cxLHJb.js';
import { S as StageBlueprint } from './blueprints-DsIas2rk.js';
export { e as entitySpawner } from './blueprints-DsIas2rk.js';
export { P as PerspectiveType, d as Perspectives, c as createCamera } from './camera-CeJPAgGg.js';
import { Z as ZylemWorld } from './entities-CVb8vLFG.js';
export { A as ACTOR_TYPE, B as BOX_TYPE, P as PLANE_TYPE, R as RECT_TYPE, b as SPHERE_TYPE, S as SPRITE_TYPE, T as TEXT_TYPE, h as ZONE_TYPE, f as ZylemBox, p as createActor, k as createBox, n as createPlane, r as createRect, l as createSphere, m as createSprite, q as createText, o as createZone } from './entities-CVb8vLFG.js';
import { G as GameEntity, g as GameEntityOptions, b as UpdateContext, h as BehaviorCallbackType, i as BehaviorDescriptor } from './entity-ts-8CIGZ.js';
export { j as Behavior, s as BehaviorHandle, r as BehaviorRef, d as BehaviorSystem, e as BehaviorSystemFactory, t as DefineBehaviorConfig, p as EntityConfigPayload, l as EntityEvents, E as EventEmitterDelegate, k as GameEvents, m as GameLoadingPayload, L as LoadingEvent, a as SetupContext, o as StageConfigPayload, f as StageEvents, n as StateDispatchPayload, Z as ZylemEvents, q as defineBehavior, z as zylemEventBus } from './entity-ts-8CIGZ.js';
export { boundary2d, ricochet2DCollision, ricochet2DInBounds } from './behaviors.js';
import { M as MoveableEntity } from './moveable-B_vyA6cw.js';
export { m as makeMoveable, b as move, a as moveable, r as resetVelocity } from './moveable-B_vyA6cw.js';
import { RigidBody, World } from '@dimforge/rapier3d-compat';
import * as RAPIER from '@dimforge/rapier3d-compat';
export { RAPIER };
import { Vector3, Quaternion } from 'three';
import * as three from 'three';
export { three as THREE };
import { StateMachine } from 'typescript-fsm';
export { m as makeRotatable, a as makeTransformable, r as rotatable, b as rotateInDirection } from './transformable-CUhvyuYO.js';
export { Howl } from 'howler';
export { S as StageEntity } from './entity-Bq_eNEDI.js';
import 'bitecs';
import '@sinclair/typebox';
import 'three/examples/jsm/postprocessing/EffectComposer.js';
import 'mitt';

declare const stageState: {
    previous: StageBlueprint | null;
    current: StageBlueprint | null;
    next: StageBlueprint | null;
    isLoading: boolean;
};
declare const StageManager: {
    staticRegistry: Map<string, {
        name?: string | undefined;
        assets?: string[] | undefined;
        id: string;
        entities: {
            position?: [number, number] | undefined;
            data?: {
                [x: string]: any;
            } | undefined;
            id: string;
            type: string;
        }[];
    }>;
    registerStaticStage(id: string, blueprint: StageBlueprint): void;
    loadStageData(stageId: string): Promise<StageBlueprint>;
    transitionForward(nextStageId: string, loadStaticStage?: (id: string) => Promise<StageBlueprint>): Promise<void>;
    /**
     * Manually set the next stage to pre-load it.
     */
    preloadNext(stageId: string, loadStaticStage?: (id: string) => Promise<StageBlueprint>): Promise<void>;
};

/**
 * Factory interface for generating entity copies
 */
interface TemplateFactory<E extends GameEntity<O>, O extends GameEntityOptions = GameEntityOptions> {
    /** The template entity used for cloning */
    readonly template: E;
    /**
     * Generate multiple copies of the template entity
     * @param count Number of copies to generate
     * @returns Array of new entity instances
     */
    generate(count: number): E[];
}
/**
 * Create an entity factory from a template entity.
 *
 * @param template The entity to use as a template for cloning
 * @returns Factory object with generate() method
 *
 * @example
 * ```typescript
 * const asteroidTemplate = createSprite({ images: [{ name: 'asteroid', file: asteroidImg }] });
 * const asteroidFactory = createEntityFactory(asteroidTemplate);
 * const asteroids = asteroidFactory.generate(10);
 *
 * asteroids.forEach((asteroid, i) => {
 *     asteroid.setPosition(Math.random() * 20 - 10, Math.random() * 15 - 7.5, 0);
 *     stage.add(asteroid);
 * });
 * ```
 */
declare function createEntityFactory<E extends GameEntity<O>, O extends GameEntityOptions = GameEntityOptions>(template: E): TemplateFactory<E, O>;

interface MovementSequence2DStep {
    name: string;
    moveX?: number;
    moveY?: number;
    timeInSeconds: number;
}
interface MovementSequence2DOptions {
    sequence: MovementSequence2DStep[];
    loop?: boolean;
}
type MovementSequence2DCallback = (current: MovementSequence2DStep, index: number, ctx: UpdateContext<MoveableEntity>) => void;
/**
 * Behavior that sequences 2D movements over time.
 * Each step sets linear velocity via `moveXY` for a duration, then advances.
 * Defaults to looping when the end is reached.
 */
declare function movementSequence2D(opts: MovementSequence2DOptions, onStep?: MovementSequence2DCallback): {
    type: BehaviorCallbackType;
    handler: (ctx: UpdateContext<MoveableEntity>) => void;
};

/**
 * Core ECS Components
 *
 * These are pure data interfaces with no logic.
 * They work alongside the existing bitecs components in transformable.system.ts
 */

interface TransformComponent {
    position: Vector3;
    rotation: Quaternion;
}
declare function createTransformComponent(): TransformComponent;
interface PhysicsBodyComponent {
    body: RigidBody;
}
declare function createPhysicsBodyComponent(body: RigidBody): PhysicsBodyComponent;

/**
 * Thruster-specific ECS Components
 *
 * These components are specific to the thruster movement system.
 */
interface ThrusterMovementComponent {
    /** Linear thrust force in Newtons (or scaled units) */
    linearThrust: number;
    /** Angular thrust torque scalar */
    angularThrust: number;
    /** Optional linear damping override */
    linearDamping?: number;
    /** Optional angular damping override */
    angularDamping?: number;
}
declare function createThrusterMovementComponent(linearThrust: number, angularThrust: number, options?: {
    linearDamping?: number;
    angularDamping?: number;
}): ThrusterMovementComponent;
interface ThrusterInputComponent {
    /** Forward thrust intent: 0..1 */
    thrust: number;
    /** Rotation intent: -1..1 */
    rotate: number;
}
declare function createThrusterInputComponent(): ThrusterInputComponent;
interface ThrusterStateComponent {
    /** Whether the thruster is enabled */
    enabled: boolean;
    /** Current thrust after FSM/gating */
    currentThrust: number;
}
declare function createThrusterStateComponent(): ThrusterStateComponent;

/**
 * ThrusterMovementBehavior
 *
 * This is the heart of the thruster movement system - a pure, stateless force generator.
 * Works identically for player, AI, and replay.
 */

/**
 * Zylem-style Behavior interface
 */
interface Behavior {
    update(dt: number): void;
}
/**
 * Entity with thruster components
 */
interface ThrusterEntity {
    physics: PhysicsBodyComponent;
    thruster: ThrusterMovementComponent;
    input: ThrusterInputComponent;
}
/**
 * ThrusterMovementBehavior - Force generator for thruster-equipped entities
 *
 * Responsibilities:
 * - Query entities with PhysicsBody, ThrusterMovement, and ThrusterInput components
 * - Apply velocities based on thrust input (2D mode)
 * - Apply angular velocity based on rotation input
 */
declare class ThrusterMovementBehavior implements Behavior {
    private world;
    constructor(world: ZylemWorld);
    /**
     * Query function - returns entities with required thruster components
     */
    private queryEntities;
    update(_dt: number): void;
}

/**
 * PhysicsStepBehavior
 *
 * Single authoritative place where Rapier advances.
 * Runs after all force-producing behaviors.
 */

/**
 * PhysicsStepBehavior - Authoritative physics step
 *
 * This behavior is responsible for advancing the Rapier physics simulation.
 * It should run AFTER all force-producing behaviors (like ThrusterMovementBehavior).
 */
declare class PhysicsStepBehavior implements Behavior {
    private physicsWorld;
    constructor(physicsWorld: World);
    update(dt: number): void;
}

/**
 * PhysicsSyncBehavior
 *
 * Syncs physics state (position, rotation) from Rapier bodies to ECS TransformComponents.
 * This is what keeps Three.js honest - rendering reads from TransformComponent.
 */

/**
 * PhysicsSyncBehavior - Physics → ECS sync
 *
 * Responsibilities:
 * - Query entities with PhysicsBodyComponent and TransformComponent
 * - Copy position from body.translation() to transform.position
 * - Copy rotation from body.rotation() to transform.rotation
 *
 * This runs AFTER PhysicsStepBehavior, before rendering.
 */
declare class PhysicsSyncBehavior implements Behavior {
    private world;
    constructor(world: ZylemWorld);
    /**
     * Query entities that have both physics body and transform components
     */
    private queryEntities;
    update(_dt: number): void;
}

/**
 * ThrusterFSM
 *
 * State machine controller for thruster behavior.
 * FSM does NOT touch physics or ThrusterMovementBehavior - it only writes ThrusterInputComponent.
 */

declare enum ThrusterState {
    Idle = "idle",
    Active = "active",
    Boosting = "boosting",
    Disabled = "disabled",
    Docked = "docked"
}
declare enum ThrusterEvent {
    Activate = "activate",
    Deactivate = "deactivate",
    Boost = "boost",
    EndBoost = "endBoost",
    Disable = "disable",
    Enable = "enable",
    Dock = "dock",
    Undock = "undock"
}
interface ThrusterFSMContext {
    input: ThrusterInputComponent;
}
interface PlayerInput {
    thrust: number;
    rotate: number;
}
declare class ThrusterFSM {
    private ctx;
    machine: StateMachine<ThrusterState, ThrusterEvent, never>;
    constructor(ctx: ThrusterFSMContext);
    /**
     * Get current state
     */
    getState(): ThrusterState;
    /**
     * Dispatch an event to transition state
     */
    dispatch(event: ThrusterEvent): void;
    /**
     * Update FSM state based on player input.
     * Auto-transitions between Idle/Active to report current state.
     * Does NOT modify input - just observes and reports.
     */
    update(playerInput: PlayerInput): void;
}

/**
 * Thruster Behavior Descriptor
 *
 * Type-safe descriptor for the thruster behavior system using the new entity.use() API.
 * This wraps the existing ThrusterMovementBehavior and components.
 */
/**
 * Thruster behavior options (typed for entity.use() autocomplete)
 */
interface ThrusterBehaviorOptions {
    /** Forward thrust force (default: 10) */
    linearThrust: number;
    /** Rotation torque (default: 5) */
    angularThrust: number;
}
/**
 * ThrusterBehavior - typed descriptor for thruster movement.
 *
 * Uses the existing ThrusterMovementBehavior under the hood.
 *
 * @example
 * ```typescript
 * import { ThrusterBehavior } from "@zylem/game-lib";
 *
 * const ship = createSprite({ ... });
 * ship.use(ThrusterBehavior, { linearThrust: 15, angularThrust: 8 });
 * ```
 */
declare const ThrusterBehavior: BehaviorDescriptor<ThrusterBehaviorOptions>;

/**
 * ScreenWrapBehavior
 *
 * When an entity exits the defined 2D bounds, it wraps around to the opposite edge.
 * Asteroids-style screen wrapping with FSM for edge detection.
 */
/**
 * Screen wrap options (typed for entity.use() autocomplete)
 */
interface ScreenWrapOptions {
    /** Width of the wrapping area (default: 20) */
    width: number;
    /** Height of the wrapping area (default: 15) */
    height: number;
    /** Center X position (default: 0) */
    centerX: number;
    /** Center Y position (default: 0) */
    centerY: number;
    /** Distance from edge to trigger NearEdge state (default: 2) */
    edgeThreshold: number;
}
/**
 * ScreenWrapBehavior - Wraps entities around 2D bounds
 *
 * @example
 * ```typescript
 * import { ScreenWrapBehavior } from "@zylem/game-lib";
 *
 * const ship = createSprite({ ... });
 * const wrapRef = ship.use(ScreenWrapBehavior, { width: 20, height: 15 });
 *
 * // Access FSM to observe edge state
 * const fsm = wrapRef.getFSM();
 * console.log(fsm?.getState()); // 'center', 'near-edge-left', 'wrapped', etc.
 * ```
 */
declare const ScreenWrapBehavior: BehaviorDescriptor<ScreenWrapOptions>;

/**
 * ScreenWrapFSM
 *
 * State machine for screen wrap behavior.
 * Reports position relative to bounds edges.
 */

declare enum ScreenWrapState {
    Center = "center",
    NearEdgeLeft = "near-edge-left",
    NearEdgeRight = "near-edge-right",
    NearEdgeTop = "near-edge-top",
    NearEdgeBottom = "near-edge-bottom",
    Wrapped = "wrapped"
}
declare enum ScreenWrapEvent {
    EnterCenter = "enter-center",
    ApproachLeft = "approach-left",
    ApproachRight = "approach-right",
    ApproachTop = "approach-top",
    ApproachBottom = "approach-bottom",
    Wrap = "wrap"
}
declare class ScreenWrapFSM {
    machine: StateMachine<ScreenWrapState, ScreenWrapEvent, never>;
    constructor();
    getState(): ScreenWrapState;
    dispatch(event: ScreenWrapEvent): void;
    /**
     * Update FSM based on entity position relative to bounds
     */
    update(position: {
        x: number;
        y: number;
    }, bounds: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
        edgeThreshold: number;
    }, wrapped: boolean): void;
}

/**
 * WorldBoundary2DFSM
 *
 * Minimal FSM + extended state to track which world boundaries were hit.
 *
 * Notes:
 * - "Hit boundaries" is inherently a *set* (can hit left+bottom in one frame),
 *   so we store it as extended state (`lastHits`) rather than a single FSM state.
 * - The FSM state is still useful for coarse status like "inside" vs "touching".
 */

type WorldBoundary2DHit = 'top' | 'bottom' | 'left' | 'right';
type WorldBoundary2DHits = Record<WorldBoundary2DHit, boolean>;
interface WorldBoundary2DPosition {
    x: number;
    y: number;
}
interface WorldBoundary2DBounds {
    top: number;
    bottom: number;
    left: number;
    right: number;
}
declare enum WorldBoundary2DState {
    Inside = "inside",
    Touching = "touching"
}
declare enum WorldBoundary2DEvent {
    EnterInside = "enter-inside",
    TouchBoundary = "touch-boundary"
}
/**
 * Compute which boundaries are being hit for a position and bounds.
 * This matches the semantics of the legacy `boundary2d` behavior:
 * - left hit if x <= left
 * - right hit if x >= right
 * - bottom hit if y <= bottom
 * - top hit if y >= top
 */
declare function computeWorldBoundary2DHits(position: WorldBoundary2DPosition, bounds: WorldBoundary2DBounds): WorldBoundary2DHits;
declare function hasAnyWorldBoundary2DHit(hits: WorldBoundary2DHits): boolean;
/**
 * FSM wrapper with "extended state" (lastHits / lastPosition).
 * Systems should call `update(...)` once per frame.
 */
declare class WorldBoundary2DFSM {
    readonly machine: StateMachine<WorldBoundary2DState, WorldBoundary2DEvent, never>;
    private lastHits;
    private lastPosition;
    private lastUpdatedAtMs;
    constructor();
    getState(): WorldBoundary2DState;
    /**
     * Returns the last computed hits (always available after first update call).
     */
    getLastHits(): WorldBoundary2DHits;
    /**
     * Returns adjusted movement values based on boundary hits.
     * If the entity is touching a boundary and trying to move further into it,
     * that axis component is zeroed out.
     *
     * @param moveX - The desired X movement
     * @param moveY - The desired Y movement
     * @returns Adjusted { moveX, moveY } with boundary-blocked axes zeroed
     */
    getMovement(moveX: number, moveY: number): {
        moveX: number;
        moveY: number;
    };
    /**
     * Returns the last position passed to `update`, if any.
     */
    getLastPosition(): WorldBoundary2DPosition | null;
    /**
     * Best-effort timestamp (ms) of the last `update(...)` call.
     * This is optional metadata; systems can ignore it.
     */
    getLastUpdatedAtMs(): number | null;
    /**
     * Update FSM + extended state based on current position and bounds.
     * Returns the computed hits for convenience.
     */
    update(position: WorldBoundary2DPosition, bounds: WorldBoundary2DBounds): WorldBoundary2DHits;
    private dispatch;
}

interface WorldBoundary2DOptions {
    /**
     * World boundaries (in world units).
     * - left hit if x <= left
     * - right hit if x >= right
     * - bottom hit if y <= bottom
     * - top hit if y >= top
     */
    boundaries: WorldBoundary2DBounds;
}
/**
 * WorldBoundary2DBehavior
 *
 * @example
 * ```ts
 * import { WorldBoundary2DBehavior } from "@zylem/game-lib";
 *
 * const ship = createSprite({ ... });
 * const boundary = ship.use(WorldBoundary2DBehavior, {
 *   boundaries: { left: -10, right: 10, bottom: -7.5, top: 7.5 },
 * });
 *
 * ship.onUpdate(({ me }) => {
 *   let moveX = ..., moveY = ...;
 *   ({ moveX, moveY } = boundary.getMovement(moveX, moveY));
 *   me.moveXY(moveX, moveY);
 * });
 * ```
 */
declare const WorldBoundary2DBehavior: BehaviorDescriptor<WorldBoundary2DOptions>;

declare function destroy(entity: any, globals?: any): void;

/**
 * Plays a ricochet sound effect when boundary collision occurs
 */
declare function ricochetSound(frequency?: number, duration?: number): void;

/**
 * Plays a ping-pong beep sound effect.
 */
declare function pingPongBeep(frequency?: number, duration?: number): void;

/**
 * Set a global value by path.
 * Emits a 'game:state:updated' event when the value changes.
 * @example setGlobal('score', 100)
 * @example setGlobal('player.health', 50)
 */
declare function setGlobal(path: string, value: unknown): void;
/**
 * Create/initialize a global with a default value.
 * Only sets the value if it doesn't already exist.
 * Use this to ensure globals have initial values before game starts.
 * @example createGlobal('score', 0)
 * @example createGlobal('player.health', 100)
 */
declare function createGlobal<T>(path: string, defaultValue: T): T;
/**
 * Get a global value by path.
 * @example getGlobal('score') // 100
 * @example getGlobal<number>('player.health') // 50
 */
declare function getGlobal<T = unknown>(path: string): T | undefined;
/**
 * Subscribe to changes on a global value at a specific path.
 * Returns an unsubscribe function. Subscriptions are automatically
 * cleaned up when the game is disposed.
 * @example const unsub = onGlobalChange('score', (val) => console.log(val));
 */
declare function onGlobalChange<T = unknown>(path: string, callback: (value: T) => void): () => void;
/**
 * Subscribe to changes on multiple global paths.
 * Callback fires when any of the paths change, receiving all current values.
 * Subscriptions are automatically cleaned up when the game is disposed.
 * @example const unsub = onGlobalChanges(['score', 'lives'], ([score, lives]) => console.log(score, lives));
 */
declare function onGlobalChanges<T extends unknown[] = unknown[]>(paths: string[], callback: (values: T) => void): () => void;
/**
 * Get the entire globals object (read-only snapshot).
 */
declare function getGlobals<T = Record<string, unknown>>(): T;
/**
 * Unsubscribe all active global subscriptions.
 * Used internally on game dispose to prevent old callbacks from firing.
 */
declare function clearGlobalSubscriptions(): void;

/**
 * Set a variable on an object by path.
 * @example setVariable(stage1, 'totalAngle', 0.5)
 * @example setVariable(entity, 'enemy.count', 10)
 */
declare function setVariable(target: object, path: string, value: unknown): void;
/**
 * Create/initialize a variable with a default value on a target object.
 * Only sets the value if it doesn't already exist.
 * @example createVariable(stage1, 'totalAngle', 0)
 * @example createVariable(entity, 'enemy.count', 10)
 */
declare function createVariable<T>(target: object, path: string, defaultValue: T): T;
/**
 * Get a variable from an object by path.
 * @example getVariable(stage1, 'totalAngle') // 0.5
 * @example getVariable<number>(entity, 'enemy.count') // 10
 */
declare function getVariable<T = unknown>(target: object, path: string): T | undefined;
/**
 * Subscribe to changes on a variable at a specific path for a target object.
 * Returns an unsubscribe function.
 * @example const unsub = onVariableChange(stage1, 'score', (val) => console.log(val));
 */
declare function onVariableChange<T = unknown>(target: object, path: string, callback: (value: T) => void): () => void;
/**
 * Subscribe to changes on multiple variable paths for a target object.
 * Callback fires when any of the paths change, receiving all current values.
 * Returns an unsubscribe function.
 * @example const unsub = onVariableChanges(stage1, ['count', 'total'], ([count, total]) => console.log(count, total));
 */
declare function onVariableChanges<T extends unknown[] = unknown[]>(target: object, paths: string[], callback: (values: T) => void): () => void;

type DebugTools = 'select' | 'translate' | 'rotate' | 'scale' | 'delete' | 'none';
interface DebugState {
    enabled: boolean;
    paused: boolean;
    tool: DebugTools;
    selectedEntity: GameEntity<any> | null;
    hoveredEntity: GameEntity<any> | null;
    flags: Set<string>;
}
declare const debugState: DebugState;
declare function setPaused(paused: boolean): void;
declare function setDebugTool(tool: DebugTools): void;

/**
 * State interface for editor-to-game communication
 */
interface ZylemGameState {
    gameState?: {
        debugFlag?: boolean;
        [key: string]: unknown;
    };
    toolbarState?: {
        tool?: DebugTools;
        paused?: boolean;
    };
    [key: string]: unknown;
}
declare class ZylemGameElement extends HTMLElement {
    private _game;
    private _state;
    private container;
    constructor();
    /**
     * Focus the game container for keyboard input
     */
    focus(): void;
    set game(game: Game<any>);
    get game(): Game<any> | null;
    set state(value: ZylemGameState);
    get state(): ZylemGameState;
    /**
     * Sync the web component's state with the game-lib's internal debug state
     */
    private syncDebugState;
    /**
     * Sync toolbar state with game-lib's debug state
     */
    private syncToolbarState;
    disconnectedCallback(): void;
}

export { BehaviorDescriptor, type DebugTools, Game, type PhysicsBodyComponent, PhysicsStepBehavior, PhysicsSyncBehavior, type PlayerInput, ScreenWrapBehavior, ScreenWrapEvent, ScreenWrapFSM, type ScreenWrapOptions, ScreenWrapState, StageBlueprint, StageManager, type TemplateFactory, ThrusterBehavior, type ThrusterBehaviorOptions, type ThrusterEntity, ThrusterEvent, ThrusterFSM, type ThrusterFSMContext, type ThrusterInputComponent, ThrusterMovementBehavior, type ThrusterMovementComponent, ThrusterState, type ThrusterStateComponent, type TransformComponent, UpdateContext, WorldBoundary2DBehavior, type WorldBoundary2DBounds, WorldBoundary2DEvent, WorldBoundary2DFSM, type WorldBoundary2DHit, type WorldBoundary2DHits, type WorldBoundary2DOptions, type WorldBoundary2DPosition, WorldBoundary2DState, ZylemGameElement, type ZylemGameState, clearGlobalSubscriptions, computeWorldBoundary2DHits, createEntityFactory, createGlobal, createPhysicsBodyComponent, createThrusterInputComponent, createThrusterMovementComponent, createThrusterStateComponent, createTransformComponent, createVariable, debugState, destroy, getGlobal, getGlobals, getVariable, hasAnyWorldBoundary2DHit, movementSequence2D, onGlobalChange, onGlobalChanges, onVariableChange, onVariableChanges, pingPongBeep, ricochetSound, setDebugTool, setGlobal, setPaused, setVariable, stageState };
