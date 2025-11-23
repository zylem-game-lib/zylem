import { Color, Vector2 } from 'three';
import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { EntityBuilder } from './builder';
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
export declare class RectBuilder extends EntityBuilder<ZylemRect, ZylemRectOptions> {
    protected createEntity(options: Partial<ZylemRectOptions>): ZylemRect;
}
export declare const RECT_TYPE: unique symbol;
export declare class ZylemRect extends GameEntity<ZylemRectOptions> {
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
export declare function rect(...args: Array<RectOptions>): Promise<ZylemRect>;
export {};
//# sourceMappingURL=rect.d.ts.map