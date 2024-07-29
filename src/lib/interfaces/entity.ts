import { Collider, ColliderDesc, RigidBody, RigidBodyDesc } from "@dimforge/rapier3d-compat";
import { Color, Group, Vector3 } from "three";
import { SpriteAnimation, SpriteImage } from "~/lib/entities";
import { EntityParameters } from "../core/entity";

export type UpdateFunction<T> = (params: EntityParameters<T>) => void;
export type SetupFunction<T> = (params: EntityParameters<T>) => void;
export type DestroyFunction<T> = (params: EntityParameters<T>) => void;

export interface BaseEntityOptions<T> {
	setup?: SetupFunction<T>;
	update?: UpdateFunction<T>;
	destroy?: DestroyFunction<T>;
	custom?: { [key: string]: any };
}

export type CollisionOption<T> = (entity: any, other: any, globals?: any) => void;

export type GameEntityOptions<Options, T> = Partial<Options> & BaseEntityOptions<T> & {
	collision?: CollisionOption<T>;
	name?: string;
	tag?: Set<string>;
	shader?: string;
};

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
	// type: EntityType;
	props?: { [key: string]: any };
	shape?: Vector3;
	collision?: (entity: Entity<T>, other: Entity<T>, globals?: any) => void;

	createFromBlueprint: () => Promise<T>;
}

export interface GameEntity<T> extends Entity<T> {
	group: Group;
	body?: RigidBody;
	bodyDescription: RigidBodyDesc;
	constraintBodies?: RigidBody[];
	collider: Collider;
	controlledRotation?: boolean;
	characterController?: any;
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

export type OptionalVector = { x?: number, y?: number, z?: number };