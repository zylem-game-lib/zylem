import type { Stage } from '../stage/stage';
import type { BasicTypes, GlobalVariablesType, ZylemGameConfig } from './game-interfaces';
import type { GameOptions } from '../core/utility/nodes';
/**
 * A lightweight, serializable blueprint representing the initial configuration
 * of a `Game`. It should not include runtime references. Use blueprints only to
 * build games.
 */
export interface GameBlueprint<TGlobals extends Record<string, BasicTypes> = GlobalVariablesType> {
    id: string;
    name?: string;
    config: Partial<ZylemGameConfig<Stage, any, TGlobals>>;
}
export declare const gameBlueprintsState: {
    byId: Record<string, GameBlueprint>;
    order: string[];
    currentId: string | null;
};
/** Reset the blueprints store back to its initial empty state. */
export declare function resetGameBlueprints(): void;
/** Create and register a new `GameBlueprint`. */
export declare function createGameBlueprint<TGlobals extends Record<string, BasicTypes> = GlobalVariablesType>(config: Partial<ZylemGameConfig<Stage, any, TGlobals>>, options?: {
    id?: string;
    name?: string;
    setCurrent?: boolean;
}): GameBlueprint<TGlobals>;
/** Upsert a blueprint into the store. */
export declare function upsertGameBlueprint<TGlobals extends Record<string, BasicTypes> = GlobalVariablesType>(blueprint: GameBlueprint<TGlobals>): void;
/** Remove a blueprint by id. */
export declare function removeGameBlueprint(id: string): void;
/** Get a blueprint by id. */
export declare function getGameBlueprint(id: string): GameBlueprint | undefined;
/** List all blueprints in insertion order. */
export declare function listGameBlueprints(): GameBlueprint[];
/** Set the current blueprint id (or clear by passing null). */
export declare function setCurrentGameBlueprint(id: string | null): void;
/** Get the current blueprint object, if any. */
export declare function getCurrentGameBlueprint(): GameBlueprint | null;
/**
 * Build a `Game` instance from a blueprint and optional extra `GameOptions`
 * (e.g., additional stages or nodes). This returns a `Game` wrapper instance;
 * call `.start()` to run it.
 */
export declare function buildGameFromBlueprint<TGlobals extends Record<string, BasicTypes> = GlobalVariablesType>(input: string | GameBlueprint<TGlobals>, ...extras: GameOptions<TGlobals>): import("./game").Game<TGlobals>;
