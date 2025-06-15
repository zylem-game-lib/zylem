import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { Howl } from 'howler';
import { game, ZylemGameConfig, stage, StageOptions, vessel } from './lib/core';
import { PerspectiveType, Perspectives } from './lib/camera/perspective';
import { camera } from './lib/camera/camera';
import { Vect3 } from './lib/core/utility';
import * as actions from './lib/behaviors/actions';
import * as entities from './lib/entities/index';
import { destroy } from './lib/entities/destroy';
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
declare const box: typeof entities.box, sphere: typeof entities.sphere, sprite: typeof entities.sprite, plane: typeof entities.plane, zone: typeof entities.zone, actor: typeof entities.actor, ZylemBox: typeof entities.ZylemBox;
declare namespace Zylem { }
export { game, stage, camera, box, sphere, sprite, plane, zone, actor, vessel, actions, destroy, Perspectives, Zylem, ZylemBox, Howl, THREE, RAPIER };
export type { ZylemGameConfig as ZylemGame, StageOptions as ZylemStage, Vect3, PerspectiveType };
