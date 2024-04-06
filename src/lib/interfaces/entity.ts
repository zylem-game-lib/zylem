import { ColliderDesc, RigidBody, RigidBodyDesc } from "@dimforge/rapier3d-compat";
import { Color, Group, Vector3 } from "three";
import { SpriteAnimation, SpriteImage } from "~/lib/entities";
import { EntityParameters } from "../core/entity";

export type UpdateFunction<T> = (params: EntityParameters<T>) => void;
export type SetupFunction<T> = (params: EntityParameters<T>) => void;
export type DestroyFunction<T> = (params: EntityParameters<T>) => void;

interface BaseGameEntityOptions<T> {
	setup?: SetupFunction<T>;
	update?: UpdateFunction<T>;
	destroy?: DestroyFunction<T>;
}

export type GameEntityOptions<Options, T> = Partial<Options> & BaseGameEntityOptions<T>;

export interface Entity<T = any> {
	setup: (entity: T) => void;
	destroy: () => void;
	update: UpdateFunction<T>;
	type: string;
	_collision?: (entity: any, other: any, globals?: any) => void;
	_destroy?: (globals?: any) => void;
	name?: string;
	tag?: Set<string>;
}

export interface EntityBlueprint<T> extends Entity<T> {
	name: string;
	type: EntityType;
	props?: { [key: string]: any };
	shape?: Vector3;
	collision?: (entity: Entity<T>, other: Entity<T>) => void;

	createFromBlueprint: () => Promise<T>;
}

export interface GameEntity<T> extends Entity<T> {
	group: Group;
	body?: RigidBody;
	bodyDescription: RigidBodyDesc;
	constraintBodies?: RigidBody[];
	controlledRotation?: boolean;
	sensor?: boolean;
	debug?: boolean;
	debugColor?: Color;
	createCollider: (isSensor?: boolean) => ColliderDesc;
	_update: (delta: number, options: any) => void;
	_setup: (entity: T) => void;
}

export interface EntityOptions {
	update: (delta: number, options: any) => void;
	setup: (entity: any) => void;
	size?: Vector3;
	collisionSize?: Vector3 | null;
	sensor?: boolean;
	debug?: boolean;
	debugColor?: Color;
	radius?: number;
	images?: SpriteImage[];
	animations?: SpriteAnimation<EntityOptions['images']>[];
	color?: THREE.Color;
	static?: boolean;
}

export enum EntityType {
	Sphere = 'Sphere',
	Sprite = 'Sprite',
	Zone = 'Zone'
}

// TODO: use generic Entity class for shared methods
export function update(this: GameEntity<Entity>, delta: number, { inputs }: any) {
	if (!this.body) {
		return;
	}
	const { x, y, z } = this.body.translation();
	const { x: rx, y: ry, z: rz } = this.body.rotation();
	this.group.position.set(x, y, z);
	this.group.rotation.set(rx, ry, rz);
	const _inputs = inputs ?? { moveUp: false, moveDown: false };
	if (this._update === undefined) {
		return;
	}
	this._update(delta, { inputs: _inputs, entity: this });
}

export type OptionalVector = { x?: number, y?: number, z?: number };