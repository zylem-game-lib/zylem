import { Body } from "objects/Body";
import { Mesh } from "three";

export interface EntityBlueprint {
	name: string;
	type: string;
}

export interface Entity {
	setup: () => void;
	destroy: () => void;
	update: (delta: number) => void;
	type: string;
}

export interface GameEntity extends Entity {
	mesh: Mesh;
	body: Body;
}

export interface EntityOptions {
}