import { ZylemHUD } from "../ui/hud";
import { ZylemCamera } from "./camera";
export type Globals = any;
export interface EntityParameters<T> {
    delta: number;
    inputs: any;
    entity: T;
    globals: Globals;
    camera: ZylemCamera;
    HUD: ZylemHUD;
}
export declare abstract class Entity {
    abstract uuid: string;
    abstract createFromBlueprint(): Promise<this>;
    abstract setup(params: EntityParameters<this>): void;
    abstract update(params: EntityParameters<this>): void;
    abstract destroy(params: EntityParameters<this>): void;
}
