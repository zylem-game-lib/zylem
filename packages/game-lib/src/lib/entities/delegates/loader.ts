// this class is not for asset loading, it is for loading entity specific data
// this is to keep the entity class focused purely on entity logic

export function isLoadable(obj: any): obj is EntityLoaderDelegate {
	return typeof obj?.load === "function" && typeof obj?.data === "function";
}

export interface EntityLoaderDelegate {
	load(): Promise<void>;
	data(): any;
}

export class EntityLoader {
	entityReference: EntityLoaderDelegate;

	constructor(entity: EntityLoaderDelegate) {
		this.entityReference = entity;
	}

	async load() {
		if (this.entityReference.load) {
			await this.entityReference.load();
		}
	}

	async data() {
		if (this.entityReference.data) {
			return this.entityReference.data();
		}
		return null;
	}
}