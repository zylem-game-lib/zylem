import { ZylemCamera } from '../camera/zylem-camera';
import { Game } from '../game/game';
import { Inputs } from '../input/input';
import { ZylemStage } from '../stage/zylem-stage';

export interface SetupContext<T> {
	me: T;
	globals: any;
	inputs?: Inputs;
	camera?: ZylemCamera;
	stage?: ZylemStage;
	game?: Game;
}

export interface SetupFunction<T> {
	(context: SetupContext<T>): void;
}

export type UpdateContext<T> = {
	me: T;
	delta: number;
	inputs: Inputs;
	globals: any;
	camera: ZylemCamera;
	stage?: ZylemStage;
	game?: Game;
};

export interface UpdateFunction<T> {
	(context: UpdateContext<T>): void;
}

export interface DestroyContext<T> {
	me: T;
	globals: any;
}

export interface DestroyFunction<T> {
	(context: DestroyContext<T>): void;
}