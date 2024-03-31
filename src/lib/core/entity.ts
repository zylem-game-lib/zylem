import { ZylemCamera } from "./camera";

export interface EntityParameters<T> {
	delta: number;
	inputs: any; // TODO: inputs type
	entity: T;
	globals: any; // TODO: define globals type
	camera: ZylemCamera;
}

export abstract class Entity {
	abstract uuid: string;

	public abstract createFromBlueprint(): Promise<this>;

	public abstract setup(params: EntityParameters<this>): void;

	public abstract update(params: EntityParameters<this>): void;

	public abstract destroy(params: EntityParameters<this>): void;
}
