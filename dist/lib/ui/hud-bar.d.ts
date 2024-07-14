import { Application } from "pixi.js";
import { HUDControl } from "./hud";
export declare class HUDBar implements HUDControl {
    _app: Application;
    constructor(app: Application);
    addBar(colors?: number[]): void;
}
