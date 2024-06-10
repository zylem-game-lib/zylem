import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { Howl } from 'howler';
import { ZylemGame } from './lib/core/game';
import { GameBlueprint } from './lib/interfaces/game';
import { StageBlueprint } from './lib/interfaces/stage';
import { PerspectiveType } from './lib/interfaces/perspective';
import { Vect3 } from './lib/interfaces/utility';
import { Entity } from './lib/core/entity';
import { Stage } from './lib/core/stage';
declare function Game(options: GameBlueprint): {
    start: () => Promise<void>;
    pause: () => Promise<void>;
    end: () => Promise<void>;
    reset: (game: ZylemGame) => Promise<void>;
};
interface Game {
    start: () => {};
    pause: () => {};
    end: () => {};
}
interface Zylem {
    Game: (options: GameBlueprint) => Game;
    PerspectiveType: typeof PerspectiveType;
}
declare const Zylem: {
    Entity: typeof Entity;
    Stage: typeof Stage;
    Util: {
        actionOnPress: (isPressed: boolean, callback: Function) => void;
        actionOnRelease: (isPressed: boolean, callback: Function) => void;
        actionWithCooldown: ({ timer, immediate }: {
            timer: number;
            immediate?: boolean | undefined;
        }, callback: Function, update: Function) => void;
        actionWithThrottle: (timer: number, callback: Function) => void;
    };
    FirstPerson: PerspectiveType.FirstPerson;
    ThirdPerson: PerspectiveType.ThirdPerson;
    Isometric: PerspectiveType.Isometric;
    Flat2D: PerspectiveType.Flat2D;
    Fixed2D: PerspectiveType.Fixed2D;
    Game: typeof Game;
};
declare namespace Zylem { }
export { Zylem, Howl, THREE, RAPIER };
export type { GameBlueprint as ZylemGame, StageBlueprint as ZylemStage, Vect3 };
