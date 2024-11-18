export interface DestroyContext<T> {
	entity: T;
	globals: any;
}

export interface DestroyFunction<T> {
	(context: DestroyContext<T>): void;
}

export function destroyEntity<T>(entity: T, globals: any, destroyFunction: DestroyFunction<T>): void {
	const context: DestroyContext<T> = {
		entity,
		globals
	};
	destroyFunction(context);
}
