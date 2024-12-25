import { Vector2 } from 'three';
import { Application, FillGradient, Graphics, StrokeInput } from 'pixi.js';
import { HUDControl, HUDOptions } from './hud';
export interface HUDBarOptions {
    color?: number;
    colors?: number[];
    gradient?: FillGradient;
    stroke: StrokeInput;
    roundness?: number;
    position: Vector2;
    width: number;
    height: number;
    backgroundColor?: number;
    backgroundColors?: number[];
    backgroundGradient?: FillGradient;
    transitionColor?: number;
    transitionColors?: number[];
    transitionGradient?: FillGradient;
    isVertical: boolean;
}
type HUDOptionParams = Partial<HUDBarOptions & HUDOptions<HUDBar>>;
export declare class HUDBar implements HUDControl {
	_app: Application;
	_bar: Graphics;
	_barOptions: HUDBarOptions;
	constructor(app: Application);
	generateGradient(color: number, colors: Array<number>, gradient: FillGradient): FillGradient;
	addBar(options: HUDOptionParams): void;
	updateBar(values: any): void;
}
export {};
