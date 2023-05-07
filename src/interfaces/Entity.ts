import { Body } from "objects/Body";
import { Mesh } from "three";

export interface Entity<T> {
	setup: (entity: T) => void;
	destroy: () => void;
	update: (delta: number) => void;
	type: string;
}

export interface EntityBlueprint<T> extends Entity<T> {
	name: string;
}

export interface GameEntity<T> extends Entity<T> {
	mesh: Mesh;
	body: Body;
}

export interface EntityOptions {}
