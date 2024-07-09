import {
	SetupFunction,
	UpdateFunction,
	DestroyFunction,
	BaseEntityOptions,
} from '../interfaces/entity';
import { Entity, EntityParameters } from './entity';
import { nanoid } from 'nanoid';

export class BaseEntity<T> implements Entity {
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

	public createFromBlueprint(): Promise<any> {
		throw new Error('Method not implemented.');
	}

	public setup(_params: Partial<EntityParameters<any>>) { }

	public update(_params: EntityParameters<any>): void { }

	public destroy(_params: EntityParameters<any>): void { }

}
