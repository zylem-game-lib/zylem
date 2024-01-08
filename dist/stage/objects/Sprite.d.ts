import { EntityOptions, GameEntity } from "../../interfaces/Entity";
import { RigidBody, RigidBodyDesc, ColliderDesc } from "@dimforge/rapier3d-compat";
import { Vector3, Sprite, Group } from "three";
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
export declare class ZylemSprite implements GameEntity<ZylemSprite> {
    body?: RigidBody | undefined;
    bodyDescription: RigidBodyDesc;
    constraintBodies?: RigidBody[] | undefined;
    _update: (delta: number, options: any) => void;
    _setup: (entity: ZylemSprite) => void;
    _type: string;
    _collision?: ((entity: any, other: any, globals?: any) => void) | undefined;
    _destroy?: ((globals?: any) => void) | undefined;
    name?: string | undefined;
    tag?: Set<string> | undefined;
    images?: SpriteImage[] | undefined;
    spriteIndex: number;
    sprites: Sprite[];
    _spriteMap: Map<string, number>;
    group: Group;
    animations?: SpriteAnimation<typeof this.images>[] | undefined;
    _animations: Map<string, any>;
    _currentAnimation: any;
    _currentAnimationFrame: string;
    _currentAnimationIndex: number;
    _currentAnimationTime: number;
    size: Vector3;
    collisionSize: Vector3 | null;
    constructor(options: EntityOptions);
    setup(): void;
    update(delta: number, { inputs }: any): void;
    destroy(): void;
    createBodyDescription(): RigidBodyDesc;
    createSprites(size?: Vector3 | undefined): void;
    createSpritesFromImages(): void;
    createAnimations(): void;
    createCollider(isSensor?: boolean): ColliderDesc;
    setSprite(key: string): void;
    setAnimation(name: string, delta: number): void;
}
