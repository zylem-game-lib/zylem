import { nanoid } from 'nanoid';
import { UpdateFunction } from './update';
import { SetupFunction } from './setup';
import { DestroyFunction } from './destroy';

export abstract class AbstractEntity {
	abstract uuid: string;
	abstract eid: number;
}

export interface EntityConfig<T> {
	update?: UpdateFunction<T>;
	setup?: SetupFunction<T>;
	destroy?: DestroyFunction<T>;
}

export function createEntity<T>(config: EntityConfig<T>): T {
	// Implementation
	// Initialize the entity, set up update loop, etc.
	return {} as T; // Replace with actual implementation
}

export interface EntityOptions<T = any> {
	custom?: { [key: string]: any };
}

export class Entity<T = any> implements AbstractEntity {
	public uuid: string;
	public eid: number = -1;
	public _custom: { [key: string]: any };
	public _behaviors: any[] = [];

	protected type: string = 'Entity';

	static entityCount = 1;

	constructor(options: EntityOptions) {
		this.uuid = '';
		this._custom = options.custom || {};
	}

	public entityDefaults(options: EntityOptions<T>): void {
		this.uuid = `${++Entity.entityCount}-${nanoid()}`;
		this._custom = options.custom || {};
	}
}
