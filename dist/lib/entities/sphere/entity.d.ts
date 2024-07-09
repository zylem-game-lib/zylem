import { Color } from 'three';
import { EntityParameters, GameEntity } from '../../core';
import { TexturePath, ZylemMaterial } from '../../core/material';
import { GameEntityOptions } from '../../interfaces/entity';
import { SphereMesh, SphereCollision } from './index';
import { Moveable } from '../../behaviors/moveable';
type ZylemSphereOptions = {
    radius?: number;
    static?: boolean;
    texture?: TexturePath;
    color?: Color;
};
type SphereOptions = GameEntityOptions<ZylemSphereOptions, ZylemSphere>;
declare const ZylemSphere_base: import("ts-mixer/dist/types/types").Class<any[], GameEntity<unknown> & ZylemMaterial & SphereMesh & SphereCollision & Moveable, (new (options: GameEntityOptions<{
    collision?: import("../../interfaces/entity").CollisionOption<unknown> | undefined;
}, unknown>) => GameEntity<unknown>) & typeof ZylemMaterial & typeof SphereMesh & typeof SphereCollision & typeof Moveable>;
export declare class ZylemSphere extends ZylemSphere_base {
    protected type: string;
    constructor(options: SphereOptions);
    createFromBlueprint(): Promise<this>;
    setup(params: EntityParameters<ZylemSphere>): void;
    update(params: EntityParameters<ZylemSphere>): void;
    destroy(params: EntityParameters<ZylemSphere>): void;
}
export declare function sphere(options: SphereOptions): ZylemSphere;
export {};
