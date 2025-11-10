import { proxy } from 'valtio/vanilla';
import { deepClone } from 'valtio/utils';
import { nanoid } from 'nanoid';

import type { Stage } from '../stage/stage';
import type { GlobalVariablesType, ZylemGameConfig } from './game-interfaces';
import { GlobalsBase } from './game';

/**
 * A lightweight, serializable blueprint representing the initial configuration
 * of a `Game`. It should not include runtime references. Use blueprints only to
 * build games.
 */
export interface GameBlueprint<TGlobals extends GlobalsBase = GlobalVariablesType> {
	id: string;
	name?: string;
	config: Partial<ZylemGameConfig<Stage, any, TGlobals>>;
}

/**
 * Valtio store for game blueprints. Keeps an ordered collection and a reference
 * to the current blueprint, if any.
 */
const initialGameBlueprintsState = {
	byId: {} as Record<string, GameBlueprint>,
	order: [] as string[],
	currentId: null as string | null,
};

export const gameBlueprintsState = proxy(deepClone(initialGameBlueprintsState));

/** Reset the blueprints store back to its initial empty state. */
export function resetGameBlueprints(): void {
	const resetObj = deepClone(initialGameBlueprintsState);
	Object.keys(resetObj).forEach((key) => {
		gameBlueprintsState[key as keyof typeof gameBlueprintsState] = (resetObj as any)[key];
	});
}

/** Create and register a new `GameBlueprint`. */
export function createGameBlueprint<TGlobals extends GlobalsBase = GlobalVariablesType>(
	config: Partial<ZylemGameConfig<Stage, any, TGlobals>>,
	options?: { id?: string; name?: string; setCurrent?: boolean; }
): GameBlueprint<TGlobals> {
	const id = options?.id ?? nanoid();
	const blueprint: GameBlueprint<TGlobals> = { id, name: options?.name, config: { ...config } };
	(gameBlueprintsState.byId as Record<string, GameBlueprint<TGlobals>>)[id] = blueprint;
	if (!gameBlueprintsState.order.includes(id)) {
		gameBlueprintsState.order = [...gameBlueprintsState.order, id];
	}
	if (options?.setCurrent) {
		gameBlueprintsState.currentId = id;
	}
	return blueprint;
}

/** Upsert a blueprint into the store. */
export function upsertGameBlueprint<TGlobals extends GlobalsBase = GlobalVariablesType>(
	blueprint: GameBlueprint<TGlobals>
): void {
	(gameBlueprintsState.byId as Record<string, GameBlueprint<TGlobals>>)[blueprint.id] = { ...blueprint, config: { ...blueprint.config } } as GameBlueprint<TGlobals>;
	if (!gameBlueprintsState.order.includes(blueprint.id)) {
		gameBlueprintsState.order = [...gameBlueprintsState.order, blueprint.id];
	}
}

/** Remove a blueprint by id. */
export function removeGameBlueprint(id: string): void {
	delete gameBlueprintsState.byId[id];
	gameBlueprintsState.order = gameBlueprintsState.order.filter((x) => x !== id);
	if (gameBlueprintsState.currentId === id) {
		gameBlueprintsState.currentId = null;
	}
}

/** Get a blueprint by id. */
export function getGameBlueprint(id: string): GameBlueprint | undefined {
	return gameBlueprintsState.byId[id];
}

/** List all blueprints in insertion order. */
export function listGameBlueprints(): GameBlueprint[] {
	return gameBlueprintsState.order
		.map((id) => gameBlueprintsState.byId[id])
		.filter((bp): bp is GameBlueprint => Boolean(bp));
}

/** Set the current blueprint id (or clear by passing null). */
export function setCurrentGameBlueprint(id: string | null): void {
	gameBlueprintsState.currentId = id;
}

/** Get the current blueprint object, if any. */
export function getCurrentGameBlueprint(): GameBlueprint | null {
	const id = gameBlueprintsState.currentId;
	return id ? gameBlueprintsState.byId[id] ?? null : null;
}
