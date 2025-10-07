import { proxy } from 'valtio/vanilla';
import { deepClone } from 'valtio/utils';
import { nanoid } from 'nanoid';
import { stage } from './stage';
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

/**
 * Valtio store for stage blueprints. Keeps an ordered collection and a
 * reference to the current blueprint, if any.
 */
const initialStageBlueprintsState = {
	byId: {} as Record<string, StageBlueprint>,
	order: [] as string[],
	currentId: null as string | null,
};

export const stageBlueprintsState = proxy(deepClone(initialStageBlueprintsState));

/** Reset the blueprints store back to its initial empty state. */
export function resetStageBlueprints(): void {
	const resetObj = deepClone(initialStageBlueprintsState);
	Object.keys(resetObj).forEach((key) => {
		stageBlueprintsState[key as keyof typeof stageBlueprintsState] = (resetObj as any)[key];
	});
}

/** Create and register a new `StageBlueprint`. */
export function createStageBlueprint(config: Partial<ZylemStageConfig>, options?: { id?: string; name?: string; setCurrent?: boolean; }): StageBlueprint {
	const id = options?.id ?? nanoid();
	const blueprint: StageBlueprint = { id, name: options?.name, config: { ...config } };
	stageBlueprintsState.byId[id] = blueprint;
	if (!stageBlueprintsState.order.includes(id)) {
		stageBlueprintsState.order = [...stageBlueprintsState.order, id];
	}
	if (options?.setCurrent) {
		stageBlueprintsState.currentId = id;
	}
	return blueprint;
}

/** Upsert a blueprint into the store. */
export function upsertStageBlueprint(blueprint: StageBlueprint): void {
	stageBlueprintsState.byId[blueprint.id] = { ...blueprint, config: { ...blueprint.config } };
	if (!stageBlueprintsState.order.includes(blueprint.id)) {
		stageBlueprintsState.order = [...stageBlueprintsState.order, blueprint.id];
	}
}

/** Remove a blueprint by id. */
export function removeStageBlueprint(id: string): void {
	delete stageBlueprintsState.byId[id];
	stageBlueprintsState.order = stageBlueprintsState.order.filter((x) => x !== id);
	if (stageBlueprintsState.currentId === id) {
		stageBlueprintsState.currentId = null;
	}
}

/** Get a blueprint by id. */
export function getStageBlueprint(id: string): StageBlueprint | undefined {
	return stageBlueprintsState.byId[id];
}

/** List all blueprints in insertion order. */
export function listStageBlueprints(): StageBlueprint[] {
	return stageBlueprintsState.order
		.map((id) => stageBlueprintsState.byId[id])
		.filter((bp): bp is StageBlueprint => Boolean(bp));
}

/** Set the current blueprint id (or clear by passing null). */
export function setCurrentStageBlueprint(id: string | null): void {
	stageBlueprintsState.currentId = id;
}

/** Get the current blueprint object, if any. */
export function getCurrentStageBlueprint(): StageBlueprint | null {
	const id = stageBlueprintsState.currentId;
	return id ? stageBlueprintsState.byId[id] ?? null : null;
}

/**
 * Build a `Stage` instance from a blueprint and optional extra `StageOptions`
 * (e.g., entities or a camera wrapper). This does not load the stage; callers
 * should pass the returned `Stage` to the game and call `load` as usual.
 */
export function buildStageFromBlueprint(input: string | StageBlueprint, ...extras: StageOptions): Stage {
	const blueprint = typeof input === 'string' ? getStageBlueprint(input) : input;
	if (!blueprint) {
		throw new Error('Stage blueprint not found');
	}
	return stage(blueprint.config, ...extras);
}
