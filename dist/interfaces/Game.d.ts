import { ZylemDebug } from '@/game/ZylemDebug';
import { PerspectiveType } from './Perspective';
import ZylemGame from '@/game/ZylemGame';
import { ZylemScene } from '@/scene/ZylemScene';
import { ZylemHUD } from '@/game/ZylemHUD';
import { Color, Vector3 } from 'three';
import { ZylemCamera } from '~/scene/ZylemCamera';
import { ZylemWorld } from '~/world/ZylemWorld';
export type GameRatio = '16:9' | '9:16' | '4:3' | '3:4' | '1:1';
export interface GameOptions {
    id: string;
    ratio?: GameRatio;
    globals: Record<string, any>;
    /**
     * Individual stage options
     *
     * @deprecated use stages instead
    */
    stage?: StageOptions;
    stages: StageOptions[];
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
export interface StageOptions {
    id?: string;
    gravity?: Vector3;
    perspective: PerspectiveType;
    backgroundImage?: string;
    backgroundColor: Color | number;
    setup: SetupCallback;
    children: (globals?: any) => any[];
    conditions: Array<Conditions<GameOptions["globals"]>>;
    update?: (delta: number, options: any) => void;
}
export {};
