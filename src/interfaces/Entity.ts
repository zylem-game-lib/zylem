import { Body } from "objects/Body";
import { Mesh } from "three";
import { UpdateOptions } from "./Update";

export interface Entity<T> {
	setup: (entity: T) => void;
	destroy: () => void;
	update: (delta: number, options: UpdateOptions<Entity<T>>) => void;
	_type: string;
}

export interface EntityBlueprint<T> extends Entity<T> {
	name: string;
	type: GameEntityType;
}

export interface GameEntity<T> extends Entity<T> {
	mesh: Mesh;
	body: Body;
}

export interface EntityOptions {
	update: (delta: number, options: any) => void;
	setup: (entity: any) => void;
}

export enum GameEntityType {
	Box = 'Box',
	Sphere = 'Sphere',
}