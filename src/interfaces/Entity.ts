import { Body } from "objects/Body";
import { Mesh, Vector3 } from "three";
import { UpdateOptions } from "./Update";
import { Constraint, HingeConstraint, LockConstraint } from "cannon-es";

export type AnyConstraint = HingeConstraint | Constraint | LockConstraint;

export interface Entity<T> {
	setup: (entity: T) => void;
	destroy: () => void;
	update: (delta: number, options: UpdateOptions<Entity<T>>) => void;
	_type: string;
	_props?: { [key: string]: any };
	_collision?: (entity: any, other: any) => void;
	name?: string;
	tag?: Set<string>;
}

export abstract class EntityClass {
	_props?: { [key: string]: any };

	getProps(key: string = '') {
		if (key === '') {
			return this._props;
		}
		return this._props ? this._props[key] : null;
	}
}

export interface EntityBlueprint<T> extends Entity<T> {
	name: string;
	type: GameEntityType;
	props?: { [key: string]: any };
	shape?: Vector3;
	collision?: (entity: EntityClass, other: EntityClass) => void;
}

export interface GameEntity<T> extends Entity<T> {
	mesh: Mesh;
	body: Body;
	constraintBodies?: Body[];
	constraints?: AnyConstraint[];
}

export interface EntityOptions {
	update: (delta: number, options: any) => void;
	setup: (entity: any) => void;
	shape?: Vector3;
}

export enum GameEntityType {
	Box = 'Box',
	Sphere = 'Sphere',
}