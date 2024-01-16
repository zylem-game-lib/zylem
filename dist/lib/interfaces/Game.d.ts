import { ZylemDebug } from '~/lib/core/Debug';
import { PerspectiveType } from './Perspective';
import ZylemGame from '~/lib/core/Game';
import { ZylemScene } from '~/lib/rendering/Scene';
import { ZylemHUD } from '~/lib/ui/HUD';
import { Color, Vector3 } from 'three';
import { ZylemCamera } from '~/lib/rendering/Camera';
import { ZylemWorld } from '~/lib/collision/World';
export type GameRatio = '16:9' | '9:16' | '4:3' | '3:4' | '1:1';
export interface GameBlueprint {
    id: string;
    ratio?: GameRatio;
    globals: Record<string, any>;
    stages: StageBlueprint[];
    update?: (delta: number, options: any) => void;
    debug?: ZylemDebug;
}
type Concrete<Type> = {
    [Property in keyof Type]-?: Type[Property];
};
export type Conditions<T> = (globals: Concrete<T>, game: ZylemGame, HUD?: ZylemHUD) => void;
export interface SetupCallbackOptions {
    scene: ZylemScene;
    world?: ZylemWorld;
    camera?: ZylemCamera;
    HUD: ZylemHUD;
}
export type SetupCallback = (options: SetupCallbackOptions) => void;
export interface StageBlueprint {
    id?: string;
    gravity?: Vector3;
    perspective: PerspectiveType;
    backgroundImage?: string;
    backgroundColor: Color | number;
    setup: SetupCallback;
    children: (globals?: any) => any[];
    conditions: Array<Conditions<GameBlueprint["globals"]>>;
    update?: (delta: number, options: any) => void;
}
export {};
