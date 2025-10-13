import type { Stage } from './stage';
import type { StageOptions, ZylemStageConfig } from './zylem-stage';
/**
 * A lightweight, serializable blueprint representing the initial configuration
 * of a `ZylemStage`. It is intentionally minimal and should not include
 * entities, functions, or runtime references. Use blueprints only to build
 * stages.
 */
export interface StageBlueprint {
    id: string;
    name?: string;
    config: Partial<ZylemStageConfig>;
}
export declare const stageBlueprintsState: {
    byId: Record<string, StageBlueprint>;
    order: string[];
    currentId: string | null;
};
/** Reset the blueprints store back to its initial empty state. */
export declare function resetStageBlueprints(): void;
/** Create and register a new `StageBlueprint`. */
export declare function createStageBlueprint(config: Partial<ZylemStageConfig>, options?: {
    id?: string;
    name?: string;
    setCurrent?: boolean;
}): StageBlueprint;
/** Upsert a blueprint into the store. */
export declare function upsertStageBlueprint(blueprint: StageBlueprint): void;
/** Remove a blueprint by id. */
export declare function removeStageBlueprint(id: string): void;
/** Get a blueprint by id. */
export declare function getStageBlueprint(id: string): StageBlueprint | undefined;
/** List all blueprints in insertion order. */
export declare function listStageBlueprints(): StageBlueprint[];
/** Set the current blueprint id (or clear by passing null). */
export declare function setCurrentStageBlueprint(id: string | null): void;
/** Get the current blueprint object, if any. */
export declare function getCurrentStageBlueprint(): StageBlueprint | null;
/**
 * Build a `Stage` instance from a blueprint and optional extra `StageOptions`
 * (e.g., entities or a camera wrapper). This does not load the stage; callers
 * should pass the returned `Stage` to the game and call `load` as usual.
 */
export declare function buildStageFromBlueprint(input: string | StageBlueprint, ...extras: StageOptions): Stage;
