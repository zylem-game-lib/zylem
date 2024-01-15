import { ColliderDesc, RigidBody, RigidBodyDesc } from "@dimforge/rapier3d-compat";
import { Color, Group, Vector3 } from "three";
import { UpdateOptions } from "./Update";
import { SpriteAnimation, SpriteImage } from "~/lib/entities";
export interface Entity<T = any> {
    setup: (entity: T) => void;
    destroy: () => void;
    update: (delta: number, options: UpdateOptions<Entity<T>>) => void;
    _type: string;
    _collision?: (entity: any, other: any, globals?: any) => void;
    _destroy?: (globals?: any) => void;
    name?: string;
    tag?: Set<string>;
}
export interface EntityBlueprint<T> extends Entity<T> {
    name: string;
    type: EntityType;
    props?: {
        [key: string]: any;
    };
    shape?: Vector3;
    collision?: (entity: Entity<T>, other: Entity<T>) => void;
}
export interface GameEntity<T> extends Entity<T> {
    group: Group;
    body?: RigidBody;
    bodyDescription: RigidBodyDesc;
    constraintBodies?: RigidBody[];
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
export declare enum EntityType {
    Box = "Box",
    Sphere = "Sphere",
    Sprite = "Sprite",
    Zone = "Zone"
}
export declare function update(this: GameEntity<Entity>, delta: number, { inputs }: any): void;
export type OptionalVector = {
    x?: number;
    y?: number;
    z?: number;
};
