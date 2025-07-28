import ZylemGame from '~/lib/game/zylem-game';
import { ZylemScene } from '~/lib/graphics/zylem-scene';
// import { ZylemHUD } from '~/lib/ui/hud';
import { ZylemCamera } from '~/lib/camera/zylem-camera';
import { ZylemWorld } from '~/lib/collision/world';

export type GameRatio = '16:9' | '9:16' | '4:3' | '3:4' | '1:1';

type Concrete<Type> = {
	[Property in keyof Type]-?: Type[Property];
};

// TODO: find a way to dynamically get type from actual GameObject
// i.e. in the stage creation
// I want the "globals" variable to have proper type checking against
// the object literal that was just created above
export type Conditions<T> = {
	bindings: string[];
	callback: (globals: Concrete<T>, game: ZylemGame) => void;
};

export interface SetupCallbackOptions {
	scene: ZylemScene;
	world?: ZylemWorld;
	camera?: ZylemCamera;
};

export type SetupCallback = (options: SetupCallbackOptions) => void;