import ZylemGame from '~/lib/core/game';
import { ZylemScene } from '~/lib/rendering/scene';
import { ZylemHUD } from '~/lib/ui/hud';
import { ZylemCamera } from '~/lib/core/camera';
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
    HUD?: ZylemHUD;
}
export type SetupCallback = (options: SetupCallbackOptions) => void;
export {};
