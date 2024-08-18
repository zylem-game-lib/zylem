import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { Howl } from 'howler';
import { game, GameOptions, stage } from './lib/core';
import { StageBlueprint } from './lib/interfaces/stage';
import { PerspectiveType, Perspectives } from './lib/interfaces/perspective';
import { Vect3 } from './lib/interfaces/utility';
import * as actions from './lib/behaviors/actions';
import * as entities from './lib/entities/index';
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
declare const box: typeof entities.box, sphere: typeof entities.sphere, sprite: typeof entities.sprite, plane: typeof entities.plane, zone: typeof entities.zone, actor: typeof entities.actor;
declare namespace Zylem { }
export { game, stage, box, sphere, sprite, plane, zone, actor, actions, Perspectives, Zylem, Howl, THREE, RAPIER };
export type { GameOptions as ZylemGame, StageBlueprint as ZylemStage, Vect3, PerspectiveType };
