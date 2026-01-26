import { G as Game } from './core-Co_-lGMq.js';
export { V as Vect3, Z as ZylemGameConfig, c as createGame, g as gameConfig, a as globalChange, b as globalChanges, d as variableChange, e as variableChanges, v as vessel } from './core-Co_-lGMq.js';
export { a as StageOptions, d as createDisk, c as createStage } from './stage-types-BqXdYMzu.js';
import { S as StageBlueprint } from './blueprints-DGCyjTBI.js';
export { e as entitySpawner } from './blueprints-DGCyjTBI.js';
export { P as PerspectiveType, d as Perspectives, R as RendererType, e as ZylemRenderer, c as createCamera, i as isWebGPUSupported } from './camera-DrTbdaJ1.js';
export { A as ACTOR_TYPE, B as BOX_TYPE, P as PLANE_TYPE, R as RECT_TYPE, a as SPHERE_TYPE, S as SPRITE_TYPE, T as TEXT_TYPE, g as ZONE_TYPE, e as ZylemBox, o as createActor, j as createBox, m as createPlane, q as createRect, k as createSphere, l as createSprite, p as createText, n as createZone } from './entities-Nn7RlZgV.js';
import { G as GameEntity, g as GameEntityOptions } from './world-VVcvzTVb.js';
export { u as BehaviorDescriptor, w as BehaviorHandle, v as BehaviorRef, e as BehaviorSystem, f as BehaviorSystemFactory, x as DefineBehaviorConfig, o as EntityConfigPayload, k as EntityEvents, E as EventEmitterDelegate, j as GameEvents, l as GameLoadingPayload, L as LoadingEvent, a as SetupContext, n as StageConfigPayload, h as StageEvents, m as StateDispatchPayload, b as UpdateContext, i as ZylemEvents, Z as ZylemShader, p as ZylemShaderObject, q as ZylemTSLShader, t as defineBehavior, s as isGLSLShader, r as isTSLShader, z as zylemEventBus } from './world-VVcvzTVb.js';
export { Behavior, BoundaryRicochetCoordinator, MovementSequence2DBehavior, MovementSequence2DCurrentStep, MovementSequence2DEvent, MovementSequence2DFSM, MovementSequence2DHandle, MovementSequence2DMovement, MovementSequence2DOptions, MovementSequence2DProgress, MovementSequence2DState, MovementSequence2DStep, PhysicsBodyComponent, PhysicsStepBehavior, PhysicsSyncBehavior, PlayerInput, Ricochet2DBehavior, Ricochet2DCollisionContext, Ricochet2DEvent, Ricochet2DFSM, Ricochet2DHandle, Ricochet2DOptions, Ricochet2DResult, Ricochet2DState, ScreenWrapBehavior, ScreenWrapEvent, ScreenWrapFSM, ScreenWrapOptions, ScreenWrapState, ThrusterBehavior, ThrusterBehaviorOptions, ThrusterEntity, ThrusterEvent, ThrusterFSM, ThrusterFSMContext, ThrusterInputComponent, ThrusterMovementBehavior, ThrusterMovementComponent, ThrusterState, ThrusterStateComponent, TransformComponent, WorldBoundary2DBehavior, WorldBoundary2DBounds, WorldBoundary2DEvent, WorldBoundary2DFSM, WorldBoundary2DHandle, WorldBoundary2DHit, WorldBoundary2DHits, WorldBoundary2DOptions, WorldBoundary2DPosition, WorldBoundary2DState, computeWorldBoundary2DHits, createPhysicsBodyComponent, createThrusterInputComponent, createThrusterMovementComponent, createThrusterStateComponent, createTransformComponent, hasAnyWorldBoundary2DHit, useBehavior } from './behaviors.js';
export { m as makeMoveable, b as move, a as moveable, r as resetVelocity } from './moveable-B_vyA6cw.js';
export { m as makeRotatable, a as makeTransformable, r as rotatable, b as rotateInDirection } from './transformable-CUhvyuYO.js';
export { Howl } from 'howler';
import * as three from 'three';
export { three as THREE };
import * as RAPIER from '@dimforge/rapier3d-compat';
export { RAPIER };
export { S as StageEntity } from './entity-Bq_eNEDI.js';
export { Fn, float, time, uniform, uv, vec3, vec4 } from 'three/tsl';
import 'bitecs';
import './entity-types-DAu8sGJH.js';
import '@sinclair/typebox';
import 'three/webgpu';
import 'three/examples/jsm/postprocessing/EffectComposer.js';
import 'mitt';
import 'typescript-fsm';

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
            type: string;
            id: string;
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

declare const fireShader: {
    vertex: string;
    fragment: string;
};

declare const starShader: {
    vertex: string;
    fragment: string;
};

declare const standardShader: {
    vertex: string;
    fragment: string;
};

declare const debugShader: {
    vertex: string;
    fragment: string;
};

declare const objectVertexShader = "\nuniform vec2 uvScale;\nvarying vec2 vUv;\n\nvoid main() {\n\tvUv = uv;\n\tvec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\n\tgl_Position = projectionMatrix * mvPosition;\n}\n";

export { type DebugTools, Game, StageBlueprint, StageManager, type TemplateFactory, ZylemGameElement, type ZylemGameState, clearGlobalSubscriptions, createEntityFactory, createGlobal, createVariable, debugShader, debugState, destroy, fireShader, getGlobal, getGlobals, getVariable, objectVertexShader, onGlobalChange, onGlobalChanges, onVariableChange, onVariableChanges, pingPongBeep, ricochetSound, setDebugTool, setGlobal, setPaused, setVariable, stageState, standardShader, starShader };
