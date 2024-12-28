import { ZylemHUD } from '../../ui/hud';
import { ZylemCamera } from '../camera';
import { Game } from '../game-wrapper';
import { Inputs } from '../../input/input';

export interface SetupContext<T> {
	entity: T;
	globals: any;
	HUD: ZylemHUD;
	camera: ZylemCamera;
	game: Game;
}

export interface SetupFunction<T> {
	(context: SetupContext<T>): void;
}

export type UpdateContext<T> = {
	entity: T;
	delta: number;
	inputs: Inputs;
};

export interface UpdateFunction<T> {
	(context: UpdateContext<T>): void;
}

export interface DestroyContext<T> {
	entity: T;
	globals: any;
}

export interface DestroyFunction<T> {
	(context: DestroyContext<T>): void;
}

export function destroyEntity<T>(entity: T, globals: any, destroyFunction: DestroyFunction<T>): void {
	const context: DestroyContext<T> = {
		entity,
		globals
	};
	destroyFunction(context);
}
