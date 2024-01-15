import { ZylemGame } from './lib/core/ZylemGame';
import { GameOptions, StageOptions } from './lib/interfaces/Game';
import { EntityType } from './lib/interfaces/Entity';
import { PerspectiveType } from './lib/interfaces/Perspective';
import { Howl } from 'howler';
import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { Vect3 } from './lib/interfaces/Utility';
declare function create(options: GameOptions): ZylemGame;
interface Zylem {
    create: (options: GameOptions) => ZylemGame;
    EntityType: typeof EntityType;
    PerspectiveType: typeof PerspectiveType;
}
declare const Zylem: {
    FirstPerson: PerspectiveType.FirstPerson;
    ThirdPerson: PerspectiveType.ThirdPerson;
    Isometric: PerspectiveType.Isometric;
    Flat2D: PerspectiveType.Flat2D;
    Fixed2D: PerspectiveType.Fixed2D;
    Box: EntityType.Box;
    Sphere: EntityType.Sphere;
    Sprite: EntityType.Sprite;
    Zone: EntityType.Zone;
    create: typeof create;
};
declare namespace Zylem { }
export { Zylem, Howl, THREE, RAPIER };
export type { GameOptions, StageOptions, Vect3 };
