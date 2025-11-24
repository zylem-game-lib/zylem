import { G as Game } from './core-ld26hJdZ.js';
export { V as Vect3, Z as ZylemGameConfig, c as createGame, g as gameConfig, a as globalChange, b as globalChanges, d as variableChange, e as variableChanges, v as vessel } from './core-ld26hJdZ.js';
export { L as LoadingEvent, S as StageOptions, c as createStage } from './stage-B_kwbrgw.js';
export { e as entitySpawner } from './entity-spawner-BS1pkPfX.js';
export { P as PerspectiveType, a as Perspectives, c as camera } from './camera-Dk-fOVZE.js';
export { ZylemBox, actor, box, plane, rect, sphere, sprite, text, zone } from './entities.js';
export { B as Behavior } from './entity-n1qsMHll.js';
export { boundary2d, ricochet2DCollision, ricochet2DInBounds } from './behaviors.js';
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
}

export { Game, ZylemGameElement, destroy, pingPongBeep, ricochetSound };
