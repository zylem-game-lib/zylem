import { Vector2 } from 'three';
import { Application, Text, Graphics } from 'pixi.js';
import { HUDLabel } from './hud-label';
import { HUDBar } from './hud-bar';
export interface HUDOptions<T> {
    binding?: string | null;
    bindings?: string[] | null;
    update: null | ((element: T, value: any) => void);
    position?: Vector2;
}
export interface HUDControl {
    _app: Application;
}
export interface HUDBarOptions extends HUDOptions<Text> {
    binding?: string | null;
    bindings?: string[] | null;
    update: null | ((element: Text, value: any) => void);
    position?: Vector2;
    style?: any;
}
declare const ZylemHUD_base: import("ts-mixer/dist/types/types").Class<any[], HUDLabel & HUDBar, typeof HUDLabel & typeof HUDBar>;
export declare class ZylemHUD extends ZylemHUD_base {
    _app: Application;
    _frame: Graphics;
    constructor();
    createUI(): Promise<void>;
    updateTextPosition(position: Vector2, text: Text, width: number, height: number): void;
}
export {};
