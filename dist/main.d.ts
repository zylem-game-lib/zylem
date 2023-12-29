import { ZylemGame } from './game/ZylemGame';
import { GameOptions } from './interfaces/Game';
import { GameEntityType } from './interfaces/Entity';
import { Howl } from 'howler';
import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
declare function create(options: GameOptions): ZylemGame;
declare const Zylem: {
    create: typeof create;
    GameEntityType: typeof GameEntityType;
    Howl: typeof Howl;
    THREE: typeof THREE;
    RAPIER: typeof RAPIER;
};
export { Zylem, Howl, THREE, RAPIER };
