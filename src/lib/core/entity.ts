
export interface UpdateParameters<T> {
	delta: number;
	inputs: any; // TODO: inputs type
	entity: T;
	globals: any; // TODO: define globals type
}

export type LifecycleParameters<T> = Pick<UpdateParameters<T>, 'entity' | 'globals'>;

export abstract class Entity {
	public abstract createFromBlueprint(): this;

	public abstract setup(params: LifecycleParameters<this>): void;

	public abstract update(params: UpdateParameters<this>): void;

	public abstract destroy(params: LifecycleParameters<this>): void;
}
