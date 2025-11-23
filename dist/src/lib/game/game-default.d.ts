import { Stage } from '../stage/stage';
import type { BasicTypes, BaseGlobals, GameInputConfig } from './game-interfaces';
/**
 * Get a plain object copy of the current defaults.
 */
export declare function getGameDefaultConfig<TGlobals extends Record<string, BasicTypes> = BaseGlobals>(): {
    id: string;
    globals: TGlobals;
    stages: Stage[];
    debug?: boolean;
    time?: number;
    input?: GameInputConfig;
};
//# sourceMappingURL=game-default.d.ts.map