export { game } from './lib/game/game';
export type { ZylemGameConfig } from './lib/game/game-interfaces';
export { stage } from './lib/stage/stage';
export type { StageOptions } from './lib/stage/zylem-stage';
export { vessel } from './lib/core/vessel';
export { camera } from './lib/camera/camera';
export type { PerspectiveType } from './lib/camera/perspective';
export { Perspectives } from './lib/camera/perspective';
export type { Vect3 } from './lib/core/utility';
export { box } from './lib/entities/box';
export { sphere } from './lib/entities/sphere';
export { sprite } from './lib/entities/sprite';
export { plane } from './lib/entities/plane';
export { zone } from './lib/entities/zone';
export { actor } from './lib/entities/actor';
export { ZylemBox } from './lib/entities/box';
export { makeMoveable } from './lib/behaviors/moveable';
export * as actions from './lib/behaviors/actions';
export { destroy } from './lib/entities/destroy';
export { Howl } from 'howler';
export * as THREE from 'three';
export * as RAPIER from '@dimforge/rapier3d-compat';
declare const Zylem: {
    Util: {
        wait(delay: number, callback: Function): void;
        actionOnPress: (isPressed: boolean, callback: Function) => void;
        actionOnRelease: (isPressed: boolean, callback: Function) => void;
        actionWithCooldown: ({ timer, immediate }: {
            timer: number;
            immediate?: boolean;
        }, callback: Function, update: Function) => void;
        actionWithThrottle: (timer: number, callback: Function) => void;
    };
};
export { Zylem };
