import { Vector3, Sprite as ThreeSprite, Color, BufferGeometry, Mesh } from "three";
import { ZylemMaterial } from "../../core/material";
import { EntityParameters, GameEntity } from "../../core";
import { EntitySpawner } from "../../behaviors/entity-spawner";
import { Moveable } from "../../behaviors/moveable";
import { GameEntityOptions } from "../../interfaces/entity";
import { SpriteCollision } from './index';
export type SpriteImage = {
    name: string;
    file: string;
};
export type SpriteAnimation<T extends SpriteImage[] | undefined> = {
    name: string;
    frames: T extends SpriteImage[] ? Array<T[number]['name']> : never[];
    speed: number | number[];
    loop: boolean;
};
type ZylemSpriteOptions = {
    static?: boolean;
    color?: Color;
    images?: SpriteImage[] | undefined;
    animations?: SpriteAnimation<any>[] | undefined;
    size?: Vector3;
    collisionSize?: Vector3;
};
type SpriteOptions = GameEntityOptions<ZylemSpriteOptions, ZylemSprite>;
declare const ZylemSprite_base: import("ts-mixer/dist/types/types").Class<any[], GameEntity<unknown> & ZylemMaterial & SpriteCollision & Moveable & EntitySpawner, (new (options: GameEntityOptions<{
    collision?: import("../../interfaces/entity").CollisionOption<unknown> | undefined;
}, unknown>) => GameEntity<unknown>) & typeof ZylemMaterial & typeof SpriteCollision & typeof Moveable & typeof EntitySpawner>;
export declare class ZylemSprite extends ZylemSprite_base {
    type: string;
    _sensor: boolean;
    _size: Vector3;
    _debugMesh: Mesh | null;
    _images?: SpriteImage[] | undefined;
    spriteIndex: number;
    sprites: ThreeSprite[];
    _spriteMap: Map<string, number>;
    _animations?: SpriteAnimation<typeof this._images>[] | undefined;
    _mappedAnimations: Map<string, any>;
    _currentAnimation: any;
    _currentAnimationFrame: string;
    _currentAnimationIndex: number;
    _currentAnimationTime: number;
    constructor(options: SpriteOptions);
    createFromBlueprint(): Promise<this>;
    setup(params: EntityParameters<ZylemSprite>): void;
    update(params: EntityParameters<ZylemSprite>): void;
    destroy(params: EntityParameters<ZylemSprite>): void;
    createSprites(size?: Vector3 | undefined): void;
    createSpritesFromImages(): void;
    createAnimations(): void;
    setSprite(key: string): void;
    setColor(color: Color): void;
    setAnimation(name: string, delta: number): void;
    createDebugMesh(geometry: BufferGeometry): void;
}
export declare function sprite(options: SpriteOptions): ZylemSprite;
export {};
