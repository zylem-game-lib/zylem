import { G as Game } from './core-KxutpbQf.js';
export { V as Vect3, Z as ZylemGameConfig, c as createGame, g as gameConfig, a as globalChange, b as globalChanges, d as variableChange, e as variableChanges, v as vessel } from './core-KxutpbQf.js';
export { S as StageOptions, c as createStage } from './stage-BdyqquDY.js';
export { e as entitySpawner } from './entity-spawner-BS9zl8E_.js';
export { P as PerspectiveType, a as Perspectives, S as StageEntity, c as camera } from './camera-BLcG7KL-.js';
export { ZylemBox, actor, box, plane, rect, sphere, sprite, text, zone } from './entities.js';
import { U as UpdateContext, B as BehaviorCallbackType, G as GameEntity } from './entity-ByNgyo1y.js';
export { a as Behavior, L as LoadingEvent, S as SetupContext } from './entity-ByNgyo1y.js';
export { boundary2d, ricochet2DCollision, ricochet2DInBounds } from './behaviors.js';
import { M as MoveableEntity } from './moveable-B_vyA6cw.js';
export { m as makeMoveable, b as move, a as moveable, r as resetVelocity } from './moveable-B_vyA6cw.js';
export { m as makeRotatable, a as makeTransformable, r as rotatable, b as rotateInDirection } from './transformable-CUhvyuYO.js';
export { Howl } from 'howler';
import * as three from 'three';
export { three as THREE };
import * as RAPIER from '@dimforge/rapier3d-compat';
export { RAPIER };
import 'bitecs';
import 'three/addons/controls/OrbitControls.js';
import 'three/examples/jsm/postprocessing/EffectComposer.js';

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
 * Returns an unsubscribe function.
 * @example const unsub = onGlobalChange('score', (val) => console.log(val));
 */
declare function onGlobalChange<T = unknown>(path: string, callback: (value: T) => void): () => void;
/**
 * Subscribe to changes on multiple global paths.
 * Callback fires when any of the paths change, receiving all current values.
 * Returns an unsubscribe function.
 * @example const unsub = onGlobalChanges(['score', 'lives'], ([score, lives]) => console.log(score, lives));
 */
declare function onGlobalChanges<T extends unknown[] = unknown[]>(paths: string[], callback: (values: T) => void): () => void;
/**
 * Get the entire globals object (read-only snapshot).
 */
declare function getGlobals<T = Record<string, unknown>>(): T;

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

export { type DebugTools, Game, UpdateContext, ZylemGameElement, type ZylemGameState, createGlobal, createVariable, debugState, destroy, getGlobal, getGlobals, getVariable, movementSequence2D, onGlobalChange, onGlobalChanges, onVariableChange, onVariableChanges, pingPongBeep, ricochetSound, setDebugTool, setGlobal, setPaused, setVariable };
