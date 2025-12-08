import { DestroyContext, DestroyFunction } from "../core/base-node-life-cycle";
import { getGlobals } from "../game/game-state";

export function destroyEntity<T>(entity: T, globals: any, destroyFunction: DestroyFunction<T>): void {
	const context: DestroyContext<T> = {
		me: entity,
		globals
	};
	destroyFunction(context);
}

export function destroy(entity: any, globals?: any): void {
	const resolvedGlobals = globals ?? getGlobals();
	destroyEntity(entity, resolvedGlobals, entity.nodeDestroy.bind(entity));
}