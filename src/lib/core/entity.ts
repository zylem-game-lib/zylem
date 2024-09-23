import {
	LifecycleFunction
} from '../interfaces/entity';
import { nanoid } from 'nanoid';

export abstract class AbstractEntity {
	abstract uuid: string;
	abstract eid: number;
}

export interface EntityOptions<T = any> {
	setup?: LifecycleFunction<T>;
	update?: LifecycleFunction<T>;
	destroy?: LifecycleFunction<T>;
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
