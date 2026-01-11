import { G as GameEntity, U as UpdateContext, s as GameEntityOptions, k as DestroyContext, l as BaseNode, T as TexturePath, V as Vec3, M as MaterialOptions } from './entity-BtSVUHY-.js';
import { Vector3, Sprite, Color, Vector2, Object3D } from 'three';
import RAPIER__default, { World } from '@dimforge/rapier3d-compat';
import { E as Entity } from './entity-Bq_eNEDI.js';

/**
 * Interface for entities that handle collision events.
 */
interface CollisionHandlerDelegate {
    handlePostCollision(params: any): boolean;
    handleIntersectionEvent(params: any): void;
}
declare class ZylemWorld implements Entity<ZylemWorld> {
    type: string;
    world: World;
    collisionMap: Map<string, GameEntity<any>>;
    collisionBehaviorMap: Map<string, GameEntity<any>>;
    _removalMap: Map<string, GameEntity<any>>;
    static loadPhysics(gravity: Vector3): Promise<RAPIER__default.World>;
    constructor(world: World);
    addEntity(entity: any): void;
    setForRemoval(entity: any): void;
    destroyEntity(entity: GameEntity<any>): void;
    setup(): void;
    update(params: UpdateContext<any>): void;
    updatePostCollisionBehaviors(delta: number): void;
    updateColliders(delta: number): void;
    destroy(): void;
}

type SpriteImage = {
    name: string;
    file: string;
};
type SpriteAnimation = {
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
declare const SPRITE_TYPE: unique symbol;
declare class ZylemSprite extends GameEntity<ZylemSpriteOptions> {
    static type: symbol;
    protected sprites: Sprite[];
    protected spriteMap: Map<string, number>;
    protected currentSpriteIndex: number;
    protected animations: Map<string, any>;
    protected currentAnimation: any;
    protected currentAnimationFrame: string;
    protected currentAnimationIndex: number;
    protected currentAnimationTime: number;
    constructor(options?: ZylemSpriteOptions);
    create(): this;
    protected createSpritesFromImages(images: SpriteImage[]): void;
    protected createAnimations(animations: SpriteAnimation[]): void;
    setSprite(key: string): void;
    setAnimation(name: string, delta: number): void;
    spriteUpdate(params: UpdateContext<ZylemSpriteOptions>): Promise<void>;
    spriteDestroy(params: DestroyContext<ZylemSpriteOptions>): Promise<void>;
    buildInfo(): Record<string, any>;
}
type SpriteOptions = BaseNode | Partial<ZylemSpriteOptions>;
declare function sprite(...args: Array<SpriteOptions>): Promise<ZylemSprite>;

type ZylemSphereOptions = GameEntityOptions & {
    radius?: number;
};
declare const SPHERE_TYPE: unique symbol;
declare class ZylemSphere extends GameEntity<ZylemSphereOptions> {
    static type: symbol;
    constructor(options?: ZylemSphereOptions);
    buildInfo(): Record<string, any>;
}
type SphereOptions = BaseNode | Partial<ZylemSphereOptions>;
declare function sphere(...args: Array<SphereOptions>): Promise<ZylemSphere>;

type ZylemRectOptions = GameEntityOptions & {
    width?: number;
    height?: number;
    fillColor?: Color | string | null;
    strokeColor?: Color | string | null;
    strokeWidth?: number;
    radius?: number;
    padding?: number;
    stickToViewport?: boolean;
    screenPosition?: Vector2;
    zDistance?: number;
    anchor?: Vector2;
    bounds?: {
        screen?: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        world?: {
            left: number;
            right: number;
            top: number;
            bottom: number;
            z?: number;
        };
    };
};
declare const RECT_TYPE: unique symbol;
declare class ZylemRect extends GameEntity<ZylemRectOptions> {
    static type: symbol;
    private _sprite;
    private _mesh;
    private _texture;
    private _canvas;
    private _ctx;
    private _cameraRef;
    private _lastCanvasW;
    private _lastCanvasH;
    constructor(options?: ZylemRectOptions);
    private createSprite;
    private redrawRect;
    private roundedRectPath;
    private toCssColor;
    private rectSetup;
    private rectUpdate;
    private updateStickyTransform;
    private worldToScreen;
    private computeScreenBoundsFromOptions;
    updateRect(options?: Partial<Pick<ZylemRectOptions, 'width' | 'height' | 'fillColor' | 'strokeColor' | 'strokeWidth' | 'radius'>>): void;
    buildInfo(): Record<string, any>;
}
type RectOptions = BaseNode | Partial<ZylemRectOptions>;
declare function rect(...args: Array<RectOptions>): Promise<ZylemRect>;

type ZylemTextOptions = GameEntityOptions & {
    text?: string;
    fontFamily?: string;
    fontSize?: number;
    fontColor?: Color | string;
    backgroundColor?: Color | string | null;
    padding?: number;
    stickToViewport?: boolean;
    screenPosition?: Vector2;
    zDistance?: number;
};
declare const TEXT_TYPE: unique symbol;
declare class ZylemText extends GameEntity<ZylemTextOptions> {
    static type: symbol;
    private _sprite;
    private _texture;
    private _canvas;
    private _ctx;
    private _cameraRef;
    private _lastCanvasW;
    private _lastCanvasH;
    constructor(options?: ZylemTextOptions);
    create(): this;
    private createSprite;
    private measureAndResizeCanvas;
    private drawCenteredText;
    private updateTexture;
    private redrawText;
    private toCssColor;
    private textSetup;
    private textUpdate;
    private getResolution;
    private getScreenPixels;
    private computeWorldExtents;
    private updateSpriteScale;
    private updateStickyTransform;
    updateText(_text: string): void;
    buildInfo(): Record<string, any>;
    /**
     * Dispose of Three.js resources when the entity is destroyed.
     */
    private textDestroy;
}
type TextOptions = BaseNode | Partial<ZylemTextOptions>;
declare function text(...args: Array<TextOptions>): Promise<ZylemText>;

type ZylemBoxOptions = GameEntityOptions;
declare const BOX_TYPE: unique symbol;
declare class ZylemBox extends GameEntity<ZylemBoxOptions> {
    static type: symbol;
    constructor(options?: ZylemBoxOptions);
    buildInfo(): Record<string, any>;
}
type BoxOptions = BaseNode | ZylemBoxOptions;
declare function box(...args: Array<BoxOptions>): Promise<ZylemBox>;

type ZylemPlaneOptions = GameEntityOptions & {
    tile?: Vector2;
    repeat?: Vector2;
    texture?: TexturePath;
    subdivisions?: number;
    randomizeHeight?: boolean;
    heightMap?: number[];
    heightScale?: number;
};
declare const PLANE_TYPE: unique symbol;
declare class ZylemPlane extends GameEntity<ZylemPlaneOptions> {
    static type: symbol;
    constructor(options?: ZylemPlaneOptions);
}
type PlaneOptions = BaseNode | Partial<ZylemPlaneOptions>;
declare function plane(...args: Array<PlaneOptions>): Promise<ZylemPlane>;

type OnHeldParams = {
    delta: number;
    self: ZylemZone;
    visitor: GameEntity<any>;
    heldTime: number;
    globals: any;
};
type OnEnterParams = Pick<OnHeldParams, 'self' | 'visitor' | 'globals'>;
type OnExitParams = Pick<OnHeldParams, 'self' | 'visitor' | 'globals'>;
type ZylemZoneOptions = GameEntityOptions & {
    size?: Vector3;
    static?: boolean;
    onEnter?: (params: OnEnterParams) => void;
    onHeld?: (params: OnHeldParams) => void;
    onExit?: (params: OnExitParams) => void;
};
declare const ZONE_TYPE: unique symbol;
declare class ZylemZone extends GameEntity<ZylemZoneOptions> implements CollisionHandlerDelegate {
    static type: symbol;
    private _enteredZone;
    private _exitedZone;
    private _zoneEntities;
    constructor(options?: ZylemZoneOptions);
    handlePostCollision({ delta }: {
        delta: number;
    }): boolean;
    handleIntersectionEvent({ other, delta }: {
        other: any;
        delta: number;
    }): void;
    onEnter(callback: (params: OnEnterParams) => void): this;
    onHeld(callback: (params: OnHeldParams) => void): this;
    onExit(callback: (params: OnExitParams) => void): this;
    entered(other: any): void;
    exited(delta: number, key: string): void;
    held(delta: number, other: any): void;
}
type ZoneOptions = BaseNode | Partial<ZylemZoneOptions>;
declare function zone(...args: Array<ZoneOptions>): Promise<ZylemZone>;

interface EntityLoaderDelegate {
    load(): Promise<void>;
    data(): any;
}

type AnimationOptions = {
    key: string;
    pauseAtEnd?: boolean;
    pauseAtPercentage?: number;
    fadeToKey?: string;
    fadeDuration?: number;
};

/**
 * Interface for entities that provide custom debug information
 */
interface DebugInfoProvider {
    getDebugInfo(): Record<string, any>;
}

type AnimationObject = {
    key?: string;
    path: string;
};
type CollisionShapeType = 'capsule' | 'model';
type ZylemActorOptions = GameEntityOptions & {
    static?: boolean;
    animations?: AnimationObject[];
    models?: string[];
    scale?: Vec3;
    material?: MaterialOptions;
    collisionShape?: CollisionShapeType;
};
declare const ACTOR_TYPE: unique symbol;
declare class ZylemActor extends GameEntity<ZylemActorOptions> implements EntityLoaderDelegate, DebugInfoProvider {
    static type: symbol;
    private _object;
    private _animationDelegate;
    private _modelFileNames;
    private _assetLoader;
    controlledRotation: boolean;
    constructor(options?: ZylemActorOptions);
    load(): Promise<void>;
    data(): Promise<any>;
    actorUpdate(params: UpdateContext<ZylemActorOptions>): Promise<void>;
    /**
     * Clean up actor resources including animations, models, and groups
     */
    actorDestroy(): void;
    private loadModels;
    playAnimation(animationOptions: AnimationOptions): void;
    get object(): Object3D | null;
    /**
     * Provide custom debug information for the actor
     * This will be merged with the default debug information
     */
    getDebugInfo(): Record<string, any>;
}
type ActorOptions = BaseNode | ZylemActorOptions;
declare function actor(...args: Array<ActorOptions>): Promise<ZylemActor>;

export { ACTOR_TYPE as A, BOX_TYPE as B, PLANE_TYPE as P, RECT_TYPE as R, SPRITE_TYPE as S, TEXT_TYPE as T, ZylemBox as Z, sprite as a, box as b, actor as c, SPHERE_TYPE as d, ZONE_TYPE as e, ZylemWorld as f, ZylemSprite as g, ZylemSphere as h, ZylemRect as i, ZylemText as j, ZylemPlane as k, ZylemZone as l, ZylemActor as m, plane as p, rect as r, sphere as s, text as t, zone as z };
