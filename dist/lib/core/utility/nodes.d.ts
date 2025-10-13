import { BaseNode } from '../base-node';
import { Stage } from '../../stage/stage';
import { GameEntityLifeCycle } from '../../entities/entity';
import { BasicTypes, GlobalVariablesType, ZylemGameConfig } from '../../game/game-interfaces';
import { GameConfigLike } from '~/lib/game/game-config';
export type GameOptions<TGlobals extends Record<string, BasicTypes> = GlobalVariablesType> = Array<ZylemGameConfig<Stage, any, TGlobals> | GameConfigLike | Stage | GameEntityLifeCycle | BaseNode>;
export declare function convertNodes<TGlobals extends Record<string, BasicTypes> = GlobalVariablesType>(_options: GameOptions<TGlobals>): Promise<{
    id: string;
    globals: TGlobals;
    stages: Stage[];
}>;
