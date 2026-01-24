import { G as GameEntity, a as GameEntityOptions, U as UpdateContext, q as DestroyContext, s as BaseNode, T as TexturePath, y as CollisionHandlerDelegate, V as Vec3, M as MaterialOptions } from './world-B_wuK3GQ.js';
import { Vector3, Sprite, Color, Vector2, Object3D } from 'three';

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
    spriteUpdate(params: UpdateContext<ZylemSpriteOptions>): void;
    spriteDestroy(params: DestroyContext<ZylemSpriteOptions>): void;
    buildInfo(): Record<string, any>;
}
type SpriteOptions = BaseNode | Partial<ZylemSpriteOptions>;
declare function createSprite(...args: Array<SpriteOptions>): ZylemSprite;

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
declare function createSphere(...args: Array<SphereOptions>): ZylemSphere;

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
    getWidth(): number;
    getHeight(): number;
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
declare function createRect(...args: Array<RectOptions>): ZylemRect;

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
declare function createText(...args: Array<TextOptions>): ZylemText;

type ZylemBoxOptions = GameEntityOptions;
declare const BOX_TYPE: unique symbol;
declare class ZylemBox extends GameEntity<ZylemBoxOptions> {
    static type: symbol;
    constructor(options?: ZylemBoxOptions);
    buildInfo(): Record<string, any>;
}
type BoxOptions = BaseNode | ZylemBoxOptions;
declare function createBox(...args: Array<BoxOptions>): ZylemBox;

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
declare function createPlane(...args: Array<PlaneOptions>): ZylemPlane;

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
declare function createZone(...args: Array<ZoneOptions>): ZylemZone;

interface EntityLoaderDelegate {
    /** Initiates loading (may be async internally, but call returns immediately) */
    load(): void;
    /** Returns data synchronously (may be null if still loading) */
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
    /**
     * Initiates model and animation loading in background (deferred).
     * Call returns immediately; assets will be ready on subsequent updates.
     */
    load(): void;
    /**
     * Returns current data synchronously.
     * May return null values if loading is still in progress.
     */
    data(): any;
    actorUpdate(params: UpdateContext<ZylemActorOptions>): void;
    /**
     * Clean up actor resources including animations, models, and groups
     */
    actorDestroy(): void;
    /**
     * Deferred loading - starts async load and updates entity when complete.
     * Called by synchronous load() method.
     */
    private loadModelsDeferred;
    playAnimation(animationOptions: AnimationOptions): void;
    /**
     * Apply material overrides from options to all meshes in the loaded model.
     * Only applies if material options are explicitly specified (not just defaults).
     */
    private applyMaterialOverrides;
    get object(): Object3D | null;
    /**
     * Provide custom debug information for the actor
     * This will be merged with the default debug information
     */
    getDebugInfo(): Record<string, any>;
}
type ActorOptions = BaseNode | ZylemActorOptions;
declare function createActor(...args: Array<ActorOptions>): ZylemActor;

export { ACTOR_TYPE as A, BOX_TYPE as B, PLANE_TYPE as P, RECT_TYPE as R, SPRITE_TYPE as S, TEXT_TYPE as T, ZylemBox as Z, createSphere as a, createSprite as b, createBox as c, createPlane as d, createZone as e, createActor as f, createText as g, createRect as h, SPHERE_TYPE as i, ZONE_TYPE as j, ZylemSprite as k, ZylemSphere as l, ZylemRect as m, ZylemText as n, ZylemPlane as o, ZylemZone as p, ZylemActor as q };
