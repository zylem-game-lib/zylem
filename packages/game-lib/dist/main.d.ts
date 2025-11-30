import { G as Game } from './core-CrZH2z1q.js';
export { V as Vect3, Z as ZylemGameConfig, c as createGame, g as gameConfig, a as globalChange, b as globalChanges, d as variableChange, e as variableChanges, v as vessel } from './core-CrZH2z1q.js';
export { S as StageOptions, c as createStage } from './stage-BkTBKBaN.js';
export { e as entitySpawner } from './entity-spawner-BrU-JJ-g.js';
export { P as PerspectiveType, a as Perspectives, c as camera } from './camera-Dk-fOVZE.js';
export { ZylemBox, actor, box, plane, rect, sphere, sprite, text, zone } from './entities.js';
import { U as UpdateContext, B as BehaviorCallbackType } from './entity-Xlc2H_ZT.js';
export { a as Behavior, L as LoadingEvent } from './entity-Xlc2H_ZT.js';
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

declare class ZylemGameElement extends HTMLElement {
    private _game;
    private container;
    constructor();
    set game(game: Game<any>);
    get game(): Game<any> | null;
    disconnectedCallback(): void;
}

export { Game, ZylemGameElement, destroy, movementSequence2D, pingPongBeep, ricochetSound };
