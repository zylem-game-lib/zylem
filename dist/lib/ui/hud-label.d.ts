import { Vector2 } from 'three';
import { Application, Text, TextStyleOptions } from 'pixi.js';
import { HUDControl, HUDOptions } from './hud';
export interface HUDLabelOptions {
    style: TextStyleOptions;
    position: Vector2;
}
type HUDOptionParams = Partial<HUDLabelOptions & HUDOptions<HUDLabel>>;
export declare class HUDLabel implements HUDControl {
    _app: Application;
    _labeOptions: HUDLabelOptions;
    _text: Text;
    constructor(app: Application);
    setupDefaults(): void;
    addLabel(options: HUDOptionParams): void;
    addText(text: string, options?: HUDOptionParams, x?: number, y?: number): void;
    updateText(text: string, style?: any): void;
}
export {};
