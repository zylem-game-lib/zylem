import ZylemGame from '~/lib/core/game';
import { DebugConfiguration } from '~/lib/core/debug';
import { ZylemScene } from '~/lib/rendering/scene';
import { ZylemHUD } from '~/lib/ui/hud';
import { ZylemCamera } from '~/lib/core/camera';
import { ZylemWorld } from '~/lib/collision/world';
import { UpdateFunction } from './entity';
import { ZylemStage } from '../core/stage';

export type GameRatio = '16:9' | '9:16' | '4:3' | '3:4' | '1:1';

export interface GameBlueprint {
	id: string;
	ratio?: GameRatio,
	globals: Record<string, any>;
	stages: ZylemStage[];
	update?: UpdateFunction<this>;
	debug?: boolean;
	debugConfiguration?: DebugConfiguration;
	time?: number;
}

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
	HUD?: ZylemHUD;
};

export type SetupCallback = (options: SetupCallbackOptions) => void;