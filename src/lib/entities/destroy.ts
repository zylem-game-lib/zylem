import { DestroyContext, DestroyFunction } from "../core/base-node-life-cycle";

export function destroyEntity<T>(entity: T, globals: any, destroyFunction: DestroyFunction<T>): void {
	const context: DestroyContext<T> = {
		me: entity,
		globals
	};
	destroyFunction(context);
}

export function destroy(entity: any): void {
	destroyEntity(entity, {}, entity.nodeDestroy.bind(entity));
}