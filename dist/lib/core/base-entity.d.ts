import { SetupFunction, UpdateFunction, DestroyFunction, BaseEntityOptions } from '../interfaces/entity';
import { Entity, EntityParameters } from './entity';
export declare class BaseEntity<T> implements Entity {
    uuid: string;
    _custom: {
        [key: string]: any;
    };
    protected type: string;
    protected _setup: SetupFunction<T>;
    protected _update: UpdateFunction<T>;
    protected _destroy: DestroyFunction<T>;
    static entityCount: number;
    constructor(options: BaseEntityOptions<T>);
    createFromBlueprint(): Promise<any>;
    setup(_params: Partial<EntityParameters<any>>): void;
    update(_params: EntityParameters<any>): void;
    destroy(_params: EntityParameters<any>): void;
}
