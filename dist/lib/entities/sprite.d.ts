import { ColliderDesc } from '@dimforge/rapier3d-compat';
import { Vector3 } from 'three';
import { Sprite as ThreeSprite } from 'three';
import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { EntityBuilder } from './builder';
import { EntityCollisionBuilder } from './builder';
import { DestroyContext, UpdateContext } from '../core/base-node-life-cycle';
export type SpriteImage = {
    name: string;
    file: string;
};
export type SpriteAnimation = {
    name: string;
    frames: string[];
    speed: number | number[];
    loop: boolean;
};
type ZylemSpriteOptions = GameEntityOptions & {
    images?: SpriteImage[];
    animations?: SpriteAnimation[];
    size?: Vector3;
    collisionSize?: Vector3;
};
export declare class SpriteCollisionBuilder extends EntityCollisionBuilder {
    collider(options: ZylemSpriteOptions): ColliderDesc;
}
export declare class SpriteBuilder extends EntityBuilder<ZylemSprite, ZylemSpriteOptions> {
    protected createEntity(options: Partial<ZylemSpriteOptions>): ZylemSprite;
}
export declare const SPRITE_TYPE: unique symbol;
export declare class ZylemSprite extends GameEntity<ZylemSpriteOptions> {
    static type: symbol;
    protected sprites: ThreeSprite[];
    protected spriteMap: Map<string, number>;
    protected currentSpriteIndex: number;
    protected animations: Map<string, any>;
    protected currentAnimation: any;
    protected currentAnimationFrame: string;
    protected currentAnimationIndex: number;
    protected currentAnimationTime: number;
    constructor(options?: ZylemSpriteOptions);
    protected createSpritesFromImages(images: SpriteImage[]): void;
    protected createAnimations(animations: SpriteAnimation[]): void;
    setSprite(key: string): void;
    setAnimation(name: string, delta: number): void;
    spriteUpdate(params: UpdateContext<ZylemSpriteOptions>): Promise<void>;
    spriteDestroy(params: DestroyContext<ZylemSpriteOptions>): Promise<void>;
}
type SpriteOptions = BaseNode | Partial<ZylemSpriteOptions>;
export declare function sprite(...args: Array<SpriteOptions>): Promise<ZylemSprite>;
export {};
//# sourceMappingURL=sprite.d.ts.map