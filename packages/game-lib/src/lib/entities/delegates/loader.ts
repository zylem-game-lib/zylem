// this class is not for asset loading, it is for loading entity specific data
// this is to keep the entity class focused purely on entity logic

export function isLoadable(obj: any): obj is EntityLoaderDelegate {
	return typeof obj?.load === "function" && typeof obj?.data === "function";
}

export interface EntityLoaderDelegate {
	/** Initiates loading (may be async internally, but call returns immediately) */
	load(): void;
	/** Returns data synchronously (may be null if still loading) */
	data(): any;
}

export class EntityLoader {
	entityReference: EntityLoaderDelegate;

	constructor(entity: EntityLoaderDelegate) {
		this.entityReference = entity;
	}

	load(): void {
		if (this.entityReference.load) {
			this.entityReference.load();
		}
	}

	data(): any {
		if (this.entityReference.data) {
			return this.entityReference.data();
		}
		return null;
	}
}