import { ZylemHUD } from '../ui/hud';
import { ZylemCamera } from './camera';
import { Game } from './game-wrapper';

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