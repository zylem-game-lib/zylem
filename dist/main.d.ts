import { ZylemGame } from './lib/core/Game';
import { GameBlueprint, StageBlueprint } from './lib/interfaces/game';
import { EntityType } from './lib/interfaces/entity';
import { PerspectiveType } from './lib/interfaces/Perspective';
import { Howl } from 'howler';
import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { Vect3 } from './lib/interfaces/Utility';
declare function create(options: GameBlueprint): ZylemGame;
interface Zylem {
    create: (options: GameBlueprint) => ZylemGame;
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
export type { GameBlueprint, StageBlueprint, Vect3 };
