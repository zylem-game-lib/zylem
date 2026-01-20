import { r as ZylemWorld, k as BehaviorDescriptor } from './world-B7lAKbQ0.js';
export { m as BehaviorHandle, l as BehaviorRef, B as BehaviorSystem, i as BehaviorSystemFactory, D as DefineBehaviorConfig, j as defineBehavior } from './world-B7lAKbQ0.js';
import { RigidBody, World } from '@dimforge/rapier3d-compat';
import { Vector3, Quaternion } from 'three';
import { StateMachine } from 'typescript-fsm';
import { B as BaseEntityInterface } from './entity-types-DAu8sGJH.js';
import './entity-Bq_eNEDI.js';
import 'bitecs';
import 'mitt';

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
declare const ThrusterBehavior: BehaviorDescriptor<ThrusterBehaviorOptions, Record<string, never>>;

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
declare const ScreenWrapBehavior: BehaviorDescriptor<ScreenWrapOptions, Record<string, never>>;

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
 * Handle methods provided by WorldBoundary2DBehavior
 */
interface WorldBoundary2DHandle {
    /**
     * Get the last computed boundary hits.
     * Returns null until entity is spawned and FSM is initialized.
     */
    getLastHits(): WorldBoundary2DHits | null;
    /**
     * Get adjusted movement values based on boundary hits.
     * Zeros out movement into boundaries the entity is touching.
     */
    getMovement(moveX: number, moveY: number): {
        moveX: number;
        moveY: number;
    };
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
 *   const hits = boundary.getLastHits(); // Fully typed!
 *   ({ moveX, moveY } = boundary.getMovement(moveX, moveY));
 *   me.moveXY(moveX, moveY);
 * });
 * ```
 */
declare const WorldBoundary2DBehavior: BehaviorDescriptor<WorldBoundary2DOptions, WorldBoundary2DHandle>;

/**
 * Ricochet2DFSM
 *
 * FSM + extended state to track ricochet events and results.
 * The FSM state tracks whether a ricochet is currently occurring.
 */

interface Ricochet2DResult {
    /** The reflected velocity vector */
    velocity: {
        x: number;
        y: number;
        z?: number;
    };
    /** The resulting speed after reflection */
    speed: number;
    /** The collision normal used for reflection */
    normal: {
        x: number;
        y: number;
        z?: number;
    };
}
interface Ricochet2DCollisionContext {
    entity?: BaseEntityInterface;
    otherEntity?: BaseEntityInterface;
    /** Current velocity of the entity (optional if entity is provided) */
    selfVelocity?: {
        x: number;
        y: number;
        z?: number;
    };
    /** Contact information from the collision */
    contact: {
        /** The collision normal */
        normal?: {
            x: number;
            y: number;
            z?: number;
        };
        /**
         * Optional position where the collision occurred.
         * If provided, used for precise offset calculation.
         */
        position?: {
            x: number;
            y: number;
            z?: number;
        };
    };
    /**
     * Optional position of the entity that owns this behavior.
     * Used with contact.position for offset calculations.
     */
    selfPosition?: {
        x: number;
        y: number;
        z?: number;
    };
    /**
     * Optional position of the other entity in the collision.
     * Used for paddle-style deflection: offset = (contactY - otherY) / halfHeight.
     */
    otherPosition?: {
        x: number;
        y: number;
        z?: number;
    };
    /**
     * Optional size of the other entity (e.g., paddle size).
     * If provided, used to normalize the offset based on the collision face.
     */
    otherSize?: {
        x: number;
        y: number;
        z?: number;
    };
}
declare enum Ricochet2DState {
    Idle = "idle",
    Ricocheting = "ricocheting"
}
declare enum Ricochet2DEvent {
    StartRicochet = "start-ricochet",
    EndRicochet = "end-ricochet"
}
/**
 * FSM wrapper with extended state (lastResult).
 * Systems or consumers call `computeRicochet(...)` when a collision occurs.
 */
declare class Ricochet2DFSM {
    readonly machine: StateMachine<Ricochet2DState, Ricochet2DEvent, never>;
    private lastResult;
    private lastUpdatedAtMs;
    constructor();
    getState(): Ricochet2DState;
    /**
     * Returns the last computed ricochet result, or null if none.
     */
    getLastResult(): Ricochet2DResult | null;
    /**
     * Best-effort timestamp (ms) of the last computation.
     */
    getLastUpdatedAtMs(): number | null;
    /**
     * Compute a ricochet result from collision context.
     * Returns the result for the consumer to apply, or null if invalid input.
     */
    computeRicochet(ctx: Ricochet2DCollisionContext, options?: {
        minSpeed?: number;
        maxSpeed?: number;
        speedMultiplier?: number;
        reflectionMode?: 'simple' | 'angled';
        maxAngleDeg?: number;
    }): Ricochet2DResult | null;
    /**
     * Extract velocity, position, and size data from entities or context.
     */
    private extractDataFromEntities;
    /**
     * Compute collision normal from entity positions using AABB heuristic.
     */
    private computeNormalFromPositions;
    /**
     * Compute basic reflection using the formula: v' = v - 2(v·n)n
     */
    private computeBasicReflection;
    /**
     * Compute angled deflection for paddle-style reflections.
     */
    private computeAngledDeflection;
    /**
     * Compute hit offset for angled deflection (-1 to 1).
     */
    private computeHitOffset;
    /**
     * Apply speed constraints to the reflected velocity.
     */
    private applySpeedClamp;
    /**
     * Clear the ricochet state (call after consumer has applied the result).
     */
    clearRicochet(): void;
    private dispatch;
}

interface Ricochet2DOptions {
    /**
     * Minimum speed after reflection.
     * Default: 2
     */
    minSpeed: number;
    /**
     * Maximum speed after reflection.
     * Default: 20
     */
    maxSpeed: number;
    /**
     * Speed multiplier applied during angled reflection.
     * Default: 1.05
     */
    speedMultiplier: number;
    /**
     * Reflection mode:
     * - 'simple': Basic axis inversion
     * - 'angled': Paddle-style deflection based on contact point
     * Default: 'angled'
     */
    reflectionMode: 'simple' | 'angled';
    /**
     * Maximum deflection angle in degrees for angled mode.
     * Default: 60
     */
    maxAngleDeg: number;
}
/**
 * Handle methods provided by Ricochet2DBehavior
 */
interface Ricochet2DHandle {
    /**
     * Compute a ricochet/reflection result from collision context.
     * Returns the result for the consumer to apply, or null if invalid input.
     *
     * @param ctx - Collision context with selfVelocity and contact normal
     * @returns Ricochet result with velocity, speed, and normal, or null
     */
    getRicochet(ctx: Ricochet2DCollisionContext): Ricochet2DResult | null;
    /**
     * Get the last computed ricochet result, or null if none.
     */
    getLastResult(): Ricochet2DResult | null;
}
/**
 * Ricochet2DBehavior
 *
 * @example
 * ```ts
 * import { Ricochet2DBehavior } from "@zylem/game-lib";
 *
 * const ball = createSphere({ ... });
 * const ricochet = ball.use(Ricochet2DBehavior, {
 *   minSpeed: 3,
 *   maxSpeed: 15,
 *   reflectionMode: 'angled',
 * });
 *
 * ball.onCollision(({ entity, other }) => {
 *   const velocity = entity.body.linvel();
 *   const result = ricochet.getRicochet({
 *     selfVelocity: velocity,
 *     contact: { normal: { x: 1, y: 0 } }, // from collision data
 *   });
 *
 *   if (result) {
 *     entity.body.setLinvel(result.velocity, true);
 *   }
 * });
 * ```
 */
declare const Ricochet2DBehavior: BehaviorDescriptor<Ricochet2DOptions, Ricochet2DHandle>;

/**
 * MovementSequence2DFSM
 *
 * FSM + extended state to manage timed movement sequences.
 * Tracks current step, time remaining, and computes movement for consumer.
 */

interface MovementSequence2DStep {
    /** Identifier for this step */
    name: string;
    /** X velocity for this step */
    moveX?: number;
    /** Y velocity for this step */
    moveY?: number;
    /** Duration in seconds */
    timeInSeconds: number;
}
interface MovementSequence2DMovement {
    moveX: number;
    moveY: number;
}
interface MovementSequence2DProgress {
    stepIndex: number;
    totalSteps: number;
    stepTimeRemaining: number;
    done: boolean;
}
interface MovementSequence2DCurrentStep {
    name: string;
    index: number;
    moveX: number;
    moveY: number;
    timeRemaining: number;
}
declare enum MovementSequence2DState {
    Idle = "idle",
    Running = "running",
    Paused = "paused",
    Completed = "completed"
}
declare enum MovementSequence2DEvent {
    Start = "start",
    Pause = "pause",
    Resume = "resume",
    Complete = "complete",
    Reset = "reset"
}
declare class MovementSequence2DFSM {
    readonly machine: StateMachine<MovementSequence2DState, MovementSequence2DEvent, never>;
    private sequence;
    private loop;
    private currentIndex;
    private timeRemaining;
    constructor();
    /**
     * Initialize the sequence. Call this once with options.
     */
    init(sequence: MovementSequence2DStep[], loop: boolean): void;
    getState(): MovementSequence2DState;
    /**
     * Start the sequence (from Idle or Completed).
     */
    start(): void;
    /**
     * Pause the sequence.
     */
    pause(): void;
    /**
     * Resume a paused sequence.
     */
    resume(): void;
    /**
     * Reset to Idle state.
     */
    reset(): void;
    /**
     * Update the sequence with delta time.
     * Returns the current movement to apply.
     * Automatically starts if in Idle state.
     */
    update(delta: number): MovementSequence2DMovement;
    /**
     * Get the current movement without advancing time.
     */
    getMovement(): MovementSequence2DMovement;
    /**
     * Get current step info.
     */
    getCurrentStep(): MovementSequence2DCurrentStep | null;
    /**
     * Get sequence progress.
     */
    getProgress(): MovementSequence2DProgress;
    private dispatch;
}

interface MovementSequence2DOptions {
    /**
     * The sequence of movement steps.
     * Each step has name, moveX, moveY, and timeInSeconds.
     */
    sequence: MovementSequence2DStep[];
    /**
     * Whether to loop when the sequence ends.
     * Default: true
     */
    loop: boolean;
}
/**
 * Handle methods provided by MovementSequence2DBehavior
 */
interface MovementSequence2DHandle {
    /**
     * Get the current movement velocity.
     * Returns { moveX: 0, moveY: 0 } if sequence is empty or completed.
     */
    getMovement(): MovementSequence2DMovement;
    /**
     * Get the current step info.
     * Returns null if sequence is empty.
     */
    getCurrentStep(): MovementSequence2DCurrentStep | null;
    /**
     * Get sequence progress.
     */
    getProgress(): MovementSequence2DProgress;
    /**
     * Pause the sequence. Movement values remain but time doesn't advance.
     */
    pause(): void;
    /**
     * Resume a paused sequence.
     */
    resume(): void;
    /**
     * Reset the sequence to the beginning.
     */
    reset(): void;
}
/**
 * MovementSequence2DBehavior
 *
 * @example
 * ```ts
 * import { MovementSequence2DBehavior } from "@zylem/game-lib";
 *
 * const enemy = makeMoveable(createSprite({ ... }));
 * const sequence = enemy.use(MovementSequence2DBehavior, {
 *   sequence: [
 *     { name: 'right', moveX: 3, moveY: 0, timeInSeconds: 2 },
 *     { name: 'left', moveX: -3, moveY: 0, timeInSeconds: 2 },
 *   ],
 *   loop: true,
 * });
 *
 * enemy.onUpdate(({ me }) => {
 *   const { moveX, moveY } = sequence.getMovement();
 *   me.moveXY(moveX, moveY);
 * });
 * ```
 */
declare const MovementSequence2DBehavior: BehaviorDescriptor<MovementSequence2DOptions, MovementSequence2DHandle>;

export { type Behavior, BehaviorDescriptor, MovementSequence2DBehavior, type MovementSequence2DCurrentStep, MovementSequence2DEvent, MovementSequence2DFSM, type MovementSequence2DHandle, type MovementSequence2DMovement, type MovementSequence2DOptions, type MovementSequence2DProgress, MovementSequence2DState, type MovementSequence2DStep, type PhysicsBodyComponent, PhysicsStepBehavior, PhysicsSyncBehavior, type PlayerInput, Ricochet2DBehavior, type Ricochet2DCollisionContext, Ricochet2DEvent, Ricochet2DFSM, type Ricochet2DHandle, type Ricochet2DOptions, type Ricochet2DResult, Ricochet2DState, ScreenWrapBehavior, ScreenWrapEvent, ScreenWrapFSM, type ScreenWrapOptions, ScreenWrapState, ThrusterBehavior, type ThrusterBehaviorOptions, type ThrusterEntity, ThrusterEvent, ThrusterFSM, type ThrusterFSMContext, type ThrusterInputComponent, ThrusterMovementBehavior, type ThrusterMovementComponent, ThrusterState, type ThrusterStateComponent, type TransformComponent, WorldBoundary2DBehavior, type WorldBoundary2DBounds, WorldBoundary2DEvent, WorldBoundary2DFSM, type WorldBoundary2DHandle, type WorldBoundary2DHit, type WorldBoundary2DHits, type WorldBoundary2DOptions, type WorldBoundary2DPosition, WorldBoundary2DState, computeWorldBoundary2DHits, createPhysicsBodyComponent, createThrusterInputComponent, createThrusterMovementComponent, createThrusterStateComponent, createTransformComponent, hasAnyWorldBoundary2DHit };
