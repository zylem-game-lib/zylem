import { Vector2 } from 'three';
import { Application, Text, Graphics } from 'pixi.js';
export interface HUDTextOptions {
    binding?: string | null;
    bindings?: string[] | null;
    update: null | ((element: Text, value: any) => void);
    position?: Vector2;
    style?: any;
}
export declare class ZylemHUD {
    _app: Application | null;
    _hudText: Map<Vector2, Text>;
    _frame: Graphics;
    static defaultStyleParams: {
        fontFamily: string;
        fontSize: number;
        fontWeight: string;
        fill: string[];
        stroke: string;
        strokeThickness: number;
        wordWrap: boolean;
        wordWrapWidth: number;
        lineJoin: string;
    };
    constructor();
    createUI(): void;
    updateFrame(width: number, height: number): void;
    addText(text: string, options?: HUDTextOptions, x?: number, y?: number): void;
    updateTextPosition(position: Vector2, text: Text, width: number, height: number): void;
    resize(width: number, height: number): void;
}
