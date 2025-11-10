import { Stage } from '../stage/stage';
import type { BasicTypes, BaseGlobals, ZylemGameConfig, GameInputConfig } from './game-interfaces';
export declare const gameDefaultsState: Partial<ZylemGameConfig<Stage, any, BaseGlobals>>;
/** Replace multiple defaults at once (shallow merge). */
export declare function setGameDefaults(partial: Partial<ZylemGameConfig<Stage, any, BaseGlobals>>): void;
/** Reset defaults back to library defaults. */
export declare function resetGameDefaults(): void;
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