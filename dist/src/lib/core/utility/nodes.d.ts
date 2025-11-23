import { BaseNode } from '../base-node';
import { Stage } from '../../stage/stage';
import { GameEntityLifeCycle } from '../../entities/entity';
import { BaseGlobals, ZylemGameConfig } from '../../game/game-interfaces';
import { GameConfigLike } from '~/lib/game/game-config';
export type GameOptions<TGlobals extends BaseGlobals> = Array<ZylemGameConfig<Stage, any, TGlobals> | GameConfigLike | Stage | GameEntityLifeCycle | BaseNode>;
export declare function convertNodes<TGlobals extends BaseGlobals>(_options: GameOptions<TGlobals>): Promise<{
    id: string;
    globals: TGlobals;
    stages: Stage[];
}>;
export declare function hasStages<TGlobals extends BaseGlobals>(_options: GameOptions<TGlobals>): Boolean;
//# sourceMappingURL=nodes.d.ts.map