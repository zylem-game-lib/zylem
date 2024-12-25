import { Color } from 'three';
import { EntityParameters, GameEntity, IGameEntity } from '../../core';
import { GameEntityOptions } from '../../interfaces/entity';
import { TexturePath, ZylemMaterial } from '../../core/material';
import { Moveable } from '../../behaviors/moveable';
import { SizeVector } from '../../interfaces/utility';
import { BoxMesh, BoxCollision } from './index';
import { Behavior } from '~/lib/behaviors/behavior';
type ZylemBoxOptions = {
    size?: SizeVector;
    static?: boolean;
    texture?: TexturePath;
    color?: Color;
};
type BoxOptions = GameEntityOptions<ZylemBoxOptions, ZylemBox>;
declare const ZylemBox_base: import('ts-mixer/dist/types/types').Class<any[], GameEntity<unknown> & ZylemMaterial & BoxMesh & BoxCollision & Moveable, (new (options: GameEntityOptions<{
    collision?: import('../../interfaces/entity').CollisionOption<unknown> | undefined;
}, unknown>) => GameEntity<unknown>) & typeof ZylemMaterial & typeof BoxMesh & typeof BoxCollision & typeof Moveable>;
declare class ZylemBox extends ZylemBox_base implements IGameEntity {
	type: string;
	constructor(options: BoxOptions);
	create(): Promise<this>;
	setup(params: EntityParameters<this>): void;
	update(params: EntityParameters<this>): void;
	destroy(params: EntityParameters<this>): void;
}
export declare function box(options?: BoxOptions, ...behaviors: Behavior[]): ZylemBox;
export {};
