import { ZylemShaderType } from '../core/preset-shader';
import { LifecycleOptions, LifecycleParameters } from '../core/base-node-life-cycle';
import { EntityOptions } from '../core';

export type LifecycleFunction<T> = (params?: LifecycleParameters<T>) => void;
/** deprecated */
export type UpdateFunction = (params: LifecycleParameters) => void;
/** deprecated */
export type SetupFunction = (params: LifecycleParameters) => void;
/** deprecated */
export type DestroyFunction = (params: LifecycleParameters) => void;

export type CollisionOption = (entity: any, other: any, globals?: Global) => void;

export type StageEntityOptions<Options> = Partial<Options> & EntityOptions & LifecycleOptions<Options> & {
	collision?: CollisionOption;
	name?: string;
	tag?: Set<string>;
	shader?: ZylemShaderType;
};

export interface Entity<T = any> {
	setup: (entity: T) => void;
	destroy: () => void;
	update: LifecycleFunction<T>;
	type: string;
	_collision?: (entity: any, other: any, globals?: any) => void;
	_destroy?: (globals?: any) => void;
	name?: string;
	tag?: Set<string>;
}

export type OptionalVector = { x?: number, y?: number, z?: number };