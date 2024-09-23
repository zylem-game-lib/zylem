import { Collider, ColliderDesc, RigidBody, RigidBodyDesc } from "@dimforge/rapier3d-compat";
import { Color, Group, Vector3 } from "three";
import { SpriteAnimation, SpriteImage } from "~/lib/entities";
import { ZylemShaderType } from "../core/preset-shader";
import { LifecycleParameters } from "../core/entity-life-cycle";
import { EntityOptions } from "../core";

export type LifecycleFunction<T> = (params?: LifecycleParameters<T>) => void;
/** deprecated */
export type UpdateFunction = (params: LifecycleParameters) => void;
/** deprecated */
export type SetupFunction = (params: LifecycleParameters) => void;
/** deprecated */
export type DestroyFunction = (params: LifecycleParameters) => void;

export type CollisionOption = (entity: any, other: any, globals?: Global) => void;

export type StageEntityOptions<Options, T> = Partial<Options> & EntityOptions & {
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

// export interface GameEntity extends Entity {
// 	group: Group;
// 	body?: RigidBody;
// 	bodyDescription: RigidBodyDesc;
// 	constraintBodies?: RigidBody[];
// 	collider: Collider;
// 	controlledRotation?: boolean;
// 	characterController?: any;
// 	sensor?: boolean;
// 	debug?: boolean;
// 	debugColor?: Color;
// 	createCollider: (isSensor?: boolean) => ColliderDesc;
// 	_update: (delta: number, options: any) => void;
// 	_setup: (entity: T) => void;
// }

// export interface EntityOptions {
// 	update: (delta: number, options: any) => void;
// 	setup: (entity: any) => void;
// 	size?: Vector3;
// 	collisionSize?: Vector3 | null;
// 	sensor?: boolean;
// 	debug?: boolean;
// 	debugColor?: Color;
// 	radius?: number;
// 	images?: SpriteImage[];
// 	animations?: SpriteAnimation<EntityOptions['images']>[];
// 	color?: THREE.Color;
// 	static?: boolean;
// }

export type OptionalVector = { x?: number, y?: number, z?: number };