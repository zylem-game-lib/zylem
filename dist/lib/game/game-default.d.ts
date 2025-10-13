import { Stage } from '../stage/stage';
import type { BasicTypes, GlobalVariablesType, ZylemGameConfig, GameInputConfig } from './game-interfaces';
export declare const gameDefaultsState: Partial<ZylemGameConfig<Stage, any, GlobalVariablesType>>;
/** Replace multiple defaults at once (shallow merge). */
export declare function setGameDefaults(partial: Partial<ZylemGameConfig<Stage, any, GlobalVariablesType>>): void;
/** Reset defaults back to library defaults. */
export declare function resetGameDefaults(): void;
/**
 * Get a plain object copy of the current defaults.
 */
export declare function getGameDefaultConfig<TGlobals extends Record<string, BasicTypes> = GlobalVariablesType>(): {
    id: string;
    globals: TGlobals;
    stages: Stage[];
    debug?: boolean;
    time?: number;
    input?: GameInputConfig;
};
