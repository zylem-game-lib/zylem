import { ZylemHUD } from "../ui/hud";
import { ZylemCamera } from "./camera";
import { Game } from "./game-wrapper";

export type Globals = any;

export interface EntityParameters<T> {
	game: Game;
	delta: number;
	inputs: any; // TODO: inputs type
	entity: T;
	globals: Globals; // TODO: this needs better type information
	camera: ZylemCamera;
	HUD: ZylemHUD;
}

export abstract class Entity<T> {
	abstract uuid: string;

	abstract eid: number;

	public abstract create(): Promise<T>;

	public abstract setup(params: EntityParameters<T>): void;

	public abstract update(params: EntityParameters<T>): void;

	public abstract destroy(params: EntityParameters<T>): void;
}
