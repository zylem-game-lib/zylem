import {
	SetupFunction,
	UpdateFunction,
	DestroyFunction,
	BaseEntityOptions,
} from '../interfaces/entity';
import { Entity, EntityParameters } from './entity';

export class BaseEntity<T> implements Entity {
	public uuid: string;
	public _custom: { [key: string]: any };

	protected type: string = 'BaseEntity';
	protected _setup: SetupFunction<T>;
	protected _update: UpdateFunction<T>;
	protected _destroy: DestroyFunction<T>;

	static entityCount = 1;

	constructor(options: BaseEntityOptions<T>) {
		this.uuid = `${++BaseEntity.entityCount}`; // TODO: use package for assigning uuid
		this._setup = options.setup || (() => { });
		this._update = options.update || (() => { });
		this._destroy = options.destroy || (() => { });
		this._custom = options.custom || {};
	}

	protected createUuid(type: string) {
		this.type = type;
		this.uuid = `${this.type}-${this.uuid}`;
	}

	public createFromBlueprint(): Promise<any> {
		throw new Error('Method not implemented.');
	}

	public setup(_params: Partial<EntityParameters<any>>) {
		this.createUuid(_params.entity.type);
	}

	public update(_params: EntityParameters<any>): void { }

	public destroy(_params: EntityParameters<any>): void {
		// this._destroy({})
	}

}
