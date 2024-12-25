import { Inputs } from '../input/input';

export type UpdateContext<T> = {
	entity: T;
	delta: number;
	inputs: Inputs;
};

export interface UpdateFunction<T> {
	(context: UpdateContext<T>): void;
}