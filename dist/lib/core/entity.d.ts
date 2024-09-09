import { ZylemHUD } from "../ui/hud";
import { ZylemCamera } from "./camera";
import { Game } from "./game-wrapper";
export type Globals = any;
export interface EntityParameters<T> {
    game: Game;
    delta: number;
    inputs: any;
    entity: T;
    globals: Globals;
    camera: ZylemCamera;
    HUD: ZylemHUD;
}
export declare abstract class Entity<T> {
    abstract uuid: string;
    abstract eid: number;
    abstract create(): Promise<T>;
    abstract setup(params: EntityParameters<T>): void;
    abstract update(params: EntityParameters<T>): void;
    abstract destroy(params: EntityParameters<T>): void;
}
