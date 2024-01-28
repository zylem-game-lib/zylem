import { ZylemDebug } from '~/lib/core/debug';
import { PerspectiveType } from './perspective';
import ZylemGame from '~/lib/core/game';
import { ZylemScene } from '~/lib/rendering/scene';
import { ZylemHUD } from '~/lib/ui/hud';
import { Color, Vector3 } from 'three';
import { ZylemCamera } from '~/lib/rendering/camera';
import { ZylemWorld } from '~/lib/collision/world';

export type GameRatio = '16:9' | '9:16' | '4:3' | '3:4' | '1:1';

export interface GameBlueprint {
	id: string;
	ratio?: GameRatio,
	globals: Record<string, any>;
	stages: StageBlueprint[]; // TODO: use stage interface
	update?: (delta: number, options: any) => void;
	debug?: ZylemDebug;
}

type Concrete<Type> = {
	[Property in keyof Type]-?: Type[Property];
};

// TODO: find a way to dynamically get type from actual GameObject
// i.e. in the stage creation
// I want the "globals" variable to have proper type checking against
// the object literal that was just created above
export type Conditions<T> = (globals: Concrete<T>, game: ZylemGame, HUD?: ZylemHUD) => void;

export interface SetupCallbackOptions {
	scene: ZylemScene;
	world?: ZylemWorld;
	camera?: ZylemCamera;
	HUD: ZylemHUD;
};

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
	// TODO: define generalized interface for update options
	update?: (delta: number, options: any) => void;
}