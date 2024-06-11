import { Color, Vector2 } from "three";
import { EntityParameters, GameEntity } from "../../core";
import { TexturePath, ZylemMaterial } from '../../core/material';
import { GameEntityOptions } from "../../interfaces/entity";
import { PlaneMesh, PlaneCollision } from "./index";
type ZylemPlaneOptions = {
    tile?: Vector2;
    repeat?: Vector2;
    static?: boolean;
    texture?: TexturePath;
    color?: Color;
};
type PlaneOptions = GameEntityOptions<ZylemPlaneOptions, ZylemPlane>;
declare const ZylemPlane_base: import("ts-mixer/dist/types/types").Class<any[], GameEntity<unknown> & ZylemMaterial & PlaneMesh & PlaneCollision, (new (options: GameEntityOptions<{
    collision?: import("../../interfaces/entity").CollisionOption<unknown> | undefined;
}, unknown>) => GameEntity<unknown>) & typeof ZylemMaterial & typeof PlaneMesh & typeof PlaneCollision>;
export declare class ZylemPlane extends ZylemPlane_base {
    protected type: string;
    constructor(options: PlaneOptions);
    createFromBlueprint(): Promise<this>;
    setup(params: EntityParameters<ZylemPlane>): void;
    update(params: EntityParameters<ZylemPlane>): void;
    destroy(params: EntityParameters<ZylemPlane>): void;
}
export declare function plane(options: PlaneOptions): ZylemPlane;
export {};
