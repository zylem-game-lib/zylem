import { Vector2 } from 'three';
import { Application, Text, Graphics } from 'pixi.js';
import { HUDLabel } from './hud-label';
import { HUDBar } from './hud-bar';
export declare class HUDOptions<T> {
	binding?: string | null;
	bindings?: string[] | null;
	update: null | ((element: T, value: any | any[]) => void);
	position?: Vector2;
	constructor();
}
export declare function createBindings(element: any, options: Partial<HUDOptions<any>>): void;
export interface HUDControl {
    _app: Application;
}
declare const ZylemHUD_base: import('ts-mixer/dist/types/types').Class<any[], HUDLabel & HUDBar, typeof HUDLabel & typeof HUDBar>;
export declare class ZylemHUD extends ZylemHUD_base {
	_app: Application;
	_frame: Graphics;
	constructor();
	createUI(): Promise<void>;
	updateTextPosition(position: Vector2, text: Text, width: number, height: number): void;
}
export {};
