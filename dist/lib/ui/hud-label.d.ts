import { Vector2 } from 'three';
import { Application, FillGradient, Text } from 'pixi.js';
import { HUDControl, HUDOptions } from './hud';
export interface HUDTextOptions extends HUDOptions<Text> {
    style?: any;
}
export declare class HUDLabel implements HUDControl {
    _hudText: Map<Vector2, Text>;
    _app: Application;
    static defaultStyleParams: {
        fontFamily: string;
        fontSize: number;
        fontWeight: string;
        fill: FillGradient;
        stroke: {
            color: string;
            width: number;
            join: string;
        };
        strokeThickness: number;
        wordWrap: boolean;
        wordWrapWidth: number;
        lineJoin: string;
    };
    constructor(app: Application);
    setupDefaults(): void;
    addText(text: string, options?: HUDTextOptions, x?: number, y?: number): void;
}
