import { ZylemHUD } from "../ui/hud";
import { ZylemCamera } from "./camera";
import { Game } from "./game-wrapper";

export type Globals = any;

export interface EntityParameters<T> {
	game: Game;
	delta: number;
	inputs: any; // TODO: inputs type
	entity: T;
	globals: Globals;
	camera: ZylemCamera;
	HUD: ZylemHUD;
}

export abstract class Entity {
	abstract uuid: string;

	public abstract createFromBlueprint(): Promise<this>;

	public abstract setup(params: EntityParameters<this>): void;

	public abstract update(params: EntityParameters<this>): void;

	public abstract destroy(params: EntityParameters<this>): void;
}
