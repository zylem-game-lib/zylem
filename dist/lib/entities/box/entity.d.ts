import { Color } from "three";
import { EntityParameters, GameEntity } from "../../core";
import { GameEntityOptions } from "../../interfaces/entity";
import { TexturePath, ZylemMaterial } from '../../core/material';
import { Moveable } from "../../behaviors/moveable";
import { SizeVector } from "../../interfaces/utility";
import { BoxMesh, BoxCollision } from "./index";
type ZylemBoxOptions = {
    size?: SizeVector;
    static?: boolean;
    texture?: TexturePath;
    color?: Color;
};
type BoxOptions = GameEntityOptions<ZylemBoxOptions, ZylemBox>;
declare const ZylemBox_base: import("ts-mixer/dist/types/types").Class<any[], GameEntity<unknown> & ZylemMaterial & BoxMesh & BoxCollision & Moveable, (new (options: GameEntityOptions<{
    collision?: import("../../interfaces/entity").CollisionOption<unknown> | undefined;
}, unknown>) => GameEntity<unknown>) & typeof ZylemMaterial & typeof BoxMesh & typeof BoxCollision & typeof Moveable>;
declare class ZylemBox extends ZylemBox_base {
    protected type: string;
    constructor(options: BoxOptions);
    createFromBlueprint(): Promise<ZylemBox>;
    setup(params: EntityParameters<ZylemBox>): void;
    update(params: EntityParameters<ZylemBox>): void;
    destroy(params: EntityParameters<ZylemBox>): void;
}
export declare function Box(options: BoxOptions): ZylemBox;
export {};
