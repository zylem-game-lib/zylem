import type { Stage } from '../stage/stage';
import type { BaseGlobals, ZylemGameConfig } from './game-interfaces';
/**
 * A lightweight, serializable blueprint representing the initial configuration
 * of a `Game`. It should not include runtime references. Use blueprints only to
 * build games.
 */
export interface GameBlueprint<TGlobals extends BaseGlobals = BaseGlobals> {
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
export declare function createGameBlueprint<TGlobals extends BaseGlobals>(config: Partial<ZylemGameConfig<Stage, any, TGlobals>>, options?: {
    id?: string;
    name?: string;
    setCurrent?: boolean;
}): GameBlueprint<TGlobals>;
/** Upsert a blueprint into the store. */
export declare function upsertGameBlueprint<TGlobals extends BaseGlobals>(blueprint: GameBlueprint<TGlobals>): void;
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
//# sourceMappingURL=game-blueprint.d.ts.map