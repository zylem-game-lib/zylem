import { SetupFunction, UpdateFunction, DestroyFunction, BaseEntityOptions } from '../interfaces/entity';
import { Entity, EntityParameters } from './entity';
export declare class BaseEntity<T> implements Entity<T> {
    uuid: string;
    eid: number;
    _custom: {
        [key: string]: any;
    };
    protected type: string;
    protected _setup: SetupFunction<T>;
    protected _update: UpdateFunction<T>;
    protected _destroy: DestroyFunction<T>;
    static entityCount: number;
    constructor(options: BaseEntityOptions<T>);
    create(): Promise<T>;
    setup(_: EntityParameters<T>): void;
    update(_: EntityParameters<T>): void;
    destroy(_: EntityParameters<T>): void;
}
