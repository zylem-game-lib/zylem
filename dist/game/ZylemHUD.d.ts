import { Vector3 } from 'three';
import SpriteText from 'three-spritetext';
export interface HUDTextOptions {
    text: string;
    binding: string;
    position: Vector3;
}
export interface HUDText {
    sprite: SpriteText;
    binding: string;
    position: Vector3;
}
export declare class ZylemHUD {
    _hudText: HUDText[];
    constructor();
    createText({ text, binding, position }: HUDTextOptions): void;
    update(): void;
}
