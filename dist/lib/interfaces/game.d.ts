import ZylemGame from '~/lib/game/zylem-game';
import { ZylemScene } from '~/lib/graphics/zylem-scene';
import { ZylemCamera } from '~/lib/camera/zylem-camera';
import { ZylemWorld } from '~/lib/collision/world';
export type GameRatio = '16:9' | '9:16' | '4:3' | '3:4' | '1:1';
type Concrete<Type> = {
    [Property in keyof Type]-?: Type[Property];
};
export type Conditions<T> = {
    bindings: string[];
    callback: (globals: Concrete<T>, game: ZylemGame) => void;
};
export interface SetupCallbackOptions {
    scene: ZylemScene;
    world?: ZylemWorld;
    camera?: ZylemCamera;
}
export type SetupCallback = (options: SetupCallbackOptions) => void;
export {};
