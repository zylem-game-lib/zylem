import { ZylemGame } from './game/ZylemGame';
import { GameOptions } from './interfaces/Game';
import { Entity, GameEntityType } from './interfaces/Entity';
import { Howl } from 'howler';
import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
declare function create(options: GameOptions): ZylemGame;
declare function destroy(entity: Entity): void;
declare const Zylem: {
    create: typeof create;
    destroy: typeof destroy;
    GameEntityType: typeof GameEntityType;
    Howl: typeof Howl;
    THREE: typeof THREE;
    RAPIER: typeof RAPIER;
};
export { Zylem };
