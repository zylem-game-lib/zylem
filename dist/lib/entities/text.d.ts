import { Color, Vector2 } from 'three';
import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { EntityBuilder } from './builder';
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
export declare class TextBuilder extends EntityBuilder<ZylemText, ZylemTextOptions> {
    protected createEntity(options: Partial<ZylemTextOptions>): ZylemText;
}
export declare const TEXT_TYPE: unique symbol;
export declare class ZylemText extends GameEntity<ZylemTextOptions> {
    static type: symbol;
    private _sprite;
    private _texture;
    private _canvas;
    private _ctx;
    private _cameraRef;
    private _lastCanvasW;
    private _lastCanvasH;
    constructor(options?: ZylemTextOptions);
    private createSprite;
    private redrawText;
    private toCssColor;
    private textSetup;
    private textUpdate;
    private updateStickyTransform;
    updateText(_text: string): void;
    buildInfo(): Record<string, any>;
}
type TextOptions = BaseNode | Partial<ZylemTextOptions>;
export declare function text(...args: Array<TextOptions>): Promise<ZylemText>;
export {};
