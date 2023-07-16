import { RigidBody } from "@dimforge/rapier3d-compat";
import { Mesh, Vector3 } from "three";
import { UpdateOptions } from "./Update";

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
	body: RigidBody;
	constraintBodies?: RigidBody[];
	_update: (delta: number, options: any) => void;
	_setup: (entity: T) => void;
}

export interface EntityOptions {
	update: (delta: number, options: any) => void;
	setup: (entity: any) => void;
	size?: Vector3;
}

export enum GameEntityType {
	Box = 'Box',
	Sphere = 'Sphere',
}

// TODO: use generic Entity class for shared methods
export function update(this: GameEntity<EntityClass>, delta: number, { inputs }: any) {
	if (!this.body) {
		return;
	}
	const { x, y, z } = this.body.translation();
	const { x: rx, y: ry, z: rz } = this.body.rotation();
	this.mesh.position.set(x, y, z);
	this.mesh.rotation.set(rx, ry, rz);
	const _inputs = inputs ?? { moveUp: false, moveDown: false };
	if (this._update === undefined) {
		return;
	}
	this._update(delta, { inputs: _inputs, entity: this });
}