import { Body } from "objects/Body";
import { Mesh } from "three";
import { UpdateOptions } from "./Update";

export interface Entity<T> {
	setup: (entity: T) => void;
	destroy: () => void;
	update: (delta: number, options: UpdateOptions<Entity<T>>) => void;
	type: string;
}

export interface EntityBlueprint<T> extends Entity<T> {
	name: string;
}

export interface GameEntity<T> extends Entity<T> {
	mesh: Mesh;
	body: Body;

	moveY: (delta: number) => void;
	moveX: (delta: number) => void;
	moveZ: (delta: number) => void;
}

export interface EntityOptions {
	update: (delta: number, options: any) => void;
	setup: (entity: any) => void;
}
