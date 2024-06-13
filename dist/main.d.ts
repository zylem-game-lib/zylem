import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { Howl } from 'howler';
import { ZylemGame } from './lib/core/game';
import { GameBlueprint } from './lib/interfaces/game';
import { StageBlueprint } from './lib/interfaces/stage';
import { PerspectiveType, Perspectives } from './lib/interfaces/perspective';
import { Vect3 } from './lib/interfaces/utility';
import { stage } from './lib/core/stage';
import * as entities from './lib/entities/index';
declare function game(options: GameBlueprint): {
    start: () => Promise<void>;
    pause: () => Promise<void>;
    end: () => Promise<void>;
    reset: (game: ZylemGame) => Promise<void>;
};
declare const Zylem: {
    Util: {
        actionOnPress: (isPressed: boolean, callback: Function) => void;
        actionOnRelease: (isPressed: boolean, callback: Function) => void;
        actionWithCooldown: ({ timer, immediate }: {
            timer: number;
            immediate?: boolean | undefined;
        }, callback: Function, update: Function) => void;
        actionWithThrottle: (timer: number, callback: Function) => void;
    };
};
declare const box: typeof entities.box, sphere: typeof entities.sphere, sprite: typeof entities.sprite, plane: typeof entities.plane, zone: typeof entities.zone, actor: typeof entities.actor;
declare namespace Zylem { }
export { game, stage, box, sphere, sprite, plane, zone, actor, Perspectives, Zylem, Howl, THREE, RAPIER };
export type { GameBlueprint as ZylemGame, StageBlueprint as ZylemStage, Vect3, PerspectiveType };
