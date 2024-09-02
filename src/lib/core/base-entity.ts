import {
	SetupFunction,
	UpdateFunction,
	DestroyFunction,
	BaseEntityOptions,
} from '../interfaces/entity';
import { Entity, EntityParameters } from './entity';
import { nanoid } from 'nanoid';

export class BaseEntity<T> implements Entity<T> {
	public uuid: string;
	public _custom: { [key: string]: any };

	protected type: string = 'BaseEntity';
	protected _setup: SetupFunction<T>;
	protected _update: UpdateFunction<T>;
	protected _destroy: DestroyFunction<T>;

	static entityCount = 1;

	constructor(options: BaseEntityOptions<T>) {
		this.uuid = `${++BaseEntity.entityCount}-${nanoid()}`;
		this._setup = options.setup || (() => { });
		this._update = options.update || (() => { });
		this._destroy = options.destroy || (() => { });
		this._custom = options.custom || {};
	}

	public create(): Promise<T> {
		throw new Error('Create method needs to be implemented for Entities.');
	}

	public setup(_: EntityParameters<T>): void { }

	public update(_: EntityParameters<T>): void { }

	public destroy(_: EntityParameters<T>): void { }

}
