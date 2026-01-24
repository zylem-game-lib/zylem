export { m as makeMoveable } from './moveable-B_vyA6cw.js';
export { m as makeRotatable, a as makeTransformable } from './transformable-CUhvyuYO.js';
import 'three';
import '@dimforge/rapier3d-compat';

declare function wait(delay: number, callback: Function): void;
declare const actionOnPress: (isPressed: boolean, callback: Function) => void;
declare const actionOnRelease: (isPressed: boolean, callback: Function) => void;
type CooldownOptions = {
    timer: number;
    immediate?: boolean;
};
declare const actionWithCooldown: ({ timer, immediate }: CooldownOptions, callback: Function, update: Function) => void;
declare const actionWithThrottle: (timer: number, callback: Function) => void;

declare const actions_actionOnPress: typeof actionOnPress;
declare const actions_actionOnRelease: typeof actionOnRelease;
declare const actions_actionWithCooldown: typeof actionWithCooldown;
declare const actions_actionWithThrottle: typeof actionWithThrottle;
declare const actions_wait: typeof wait;
declare namespace actions {
  export { actions_actionOnPress as actionOnPress, actions_actionOnRelease as actionOnRelease, actions_actionWithCooldown as actionWithCooldown, actions_actionWithThrottle as actionWithThrottle, actions_wait as wait };
}

export { actions };
