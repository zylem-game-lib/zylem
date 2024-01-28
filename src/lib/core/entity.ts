
export interface EntityParameters<T> {
	delta: number;
	inputs: any; // TODO: inputs type
	entity: T;
	globals: any; // TODO: define globals type
}

export abstract class Entity {
	public abstract createFromBlueprint(): this;

	public setup() {
		console.log('Entity Setup');
	}

	public update(params: EntityParameters<this>): void {
		console.log('Entity Update');
	}

	public abstract destroy(): void;
}
